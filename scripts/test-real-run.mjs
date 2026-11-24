import assert from 'node:assert/strict';
import { ApiError, createClient } from '../src/utils/mlApi.js';
import { API_KEYS, createRealRun, isModelAvailable } from '../src/utils/realRun.js';
import { exportRunCsv, parseDataset } from '../src/utils/dataset.js';
import { wdbcHeaders } from '../src/utils/wdbc.js';

// A fake prediction server: no Python needed. Numbers are made up for testing the page logic only.
const features = wdbcHeaders.slice(2);
const dataset = {
  headers: ['case_id', 'diagnosis', ...features],
  records: [
    ['1', '=HYPERLINK("x")', ...features.map(() => '1.5')],
    ['2', 'Benign', ...features.map(() => '2.5')],
    ['3', 'Malignant', ...features.map(() => '3.5')],
  ],
};
const metrics = {
  n_test: 114,
  results: ['logistic_regression', 'svm', 'mlp', ['logistic_regression', 'svm'], ['svm', 'mlp']]
    .map((s, i) => ({ selected: [].concat(s), chosen_cutoff: { missed_cancers: i, false_alarms: 1, sensitivity: 0.95, specificity: 0.98, accuracy: 0.97 } })),
};
const probabilities = { logistic_regression: [0.9, 0.1, 0.6], svm: [0.8, 0.2, 0.4], mlp: [0.7, 0.3, 0.5] };

function fakeClient({ metricsFails = false } = {}) {
  const calls = [];
  const client = {
    calls,
    getModels: async () => ({ features }),
    getMetrics: async () => { if (metricsFails) throw new ApiError('no metrics', { status: 404 }); return metrics; },
    predict: async (models, records) => {
      calls.push(models);
      const per = key => records.map((_, i) => ({ probability: probabilities[key][i], cutoff: 0.5, prediction: probabilities[key][i] >= 0.5 ? 'malignant' : 'benign' }));
      const each = Object.fromEntries(models.map(k => [k, per(k)]));
      const results = records.map((_, i) => {
        const p = models.reduce((s, k) => s + each[k][i].probability, 0) / models.length;
        const item = { probability: p, cutoff: 0.45, prediction: p >= 0.45 ? 'malignant' : 'benign' };
        if (models.length === 2) item.individual = Object.fromEntries(models.map(k => [k, each[k][i]]));
        return item;
      });
      return { results };
    },
  };
  return client;
}

// ---- model availability ----
assert.deepEqual(Object.keys(API_KEYS), ['lr', 'svm', 'mlp']);
assert.equal(isModelAvailable('svm'), true);
assert.equal(isModelAvailable('cnn'), false);
assert.equal(isModelAvailable('hybrid'), false);

// ---- single model ----
let client = fakeClient();
let run = await createRealRun(dataset, 'single', ['svm'], 'diagnosis', client);
assert.equal(run.source, 'api');
assert.equal(run.models.length, 1);
assert.deepEqual(run.models[0].predictions, [{ label: 'Malignant', score: 80 }, { label: 'Benign', score: 20 }, { label: 'Benign', score: 40 }]);
assert.equal(run.models[0].malignant, 1);
assert.equal(run.models[0].measured.missedCancers, 1);   // the svm row of the metrics
assert.deepEqual(client.calls, [['svm']]);

// ---- hybrid: combined first, then each chosen model; API keys are used, not page ids ----
client = fakeClient();
run = await createRealRun(dataset, 'hybrid', ['lr', 'svm'], '', client);
assert.deepEqual(client.calls, [['logistic_regression', 'svm']]);
assert.deepEqual(run.models.map(m => m.name), ['Logistic regression + SVM (combined)', 'Logistic regression', 'SVM']);
assert.equal(run.models[0].predictions[0].score, 85);                 // (0.9 + 0.8) / 2
assert.equal(run.models[1].predictions[0].score, 90);                 // lr alone
assert.equal(run.models[2].predictions[0].score, 80);                 // svm alone
assert.equal(run.models[0].cutoff, 0.45);
assert.equal(run.models[0].measured.missedCancers, 3);                // pair row
// Order of the two models must not change which measured row is found.
run = await createRealRun(dataset, 'hybrid', ['svm', 'lr'], '', fakeClient());
assert.equal(run.models[0].measured.missedCancers, 3);
// A pair with no measured row is simply shown without one.
run = await createRealRun(dataset, 'hybrid', ['lr', 'mlp'], '', fakeClient());
assert.equal(run.models[0].measured, null);

// ---- compare: one request per model ----
client = fakeClient();
run = await createRealRun(dataset, 'compare', ['svm', 'lr', 'mlp'], '', client);
assert.deepEqual(client.calls, [['svm'], ['logistic_regression'], ['mlp']]);
assert.deepEqual(run.models.map(m => m.id), ['svm', 'lr', 'mlp']);

// ---- measured results are optional ----
run = await createRealRun(dataset, 'single', ['mlp'], '', fakeClient({ metricsFails: true }));
assert.equal(run.models[0].measured, null);

// ---- invalid choices are rejected before any request ----
client = fakeClient();
await assert.rejects(createRealRun(dataset, 'single', ['cnn'], '', client), e => e.kind === 'invalid' && /CNN has no trained model yet/.test(e.message));
await assert.rejects(createRealRun(dataset, 'compare', ['svm', 'hybrid'], '', client), e => /Hybrid CNN \+ MLP has no trained model yet/.test(e.message));
await assert.rejects(createRealRun(dataset, 'hybrid', ['svm', 'svm'], '', client), /two different models/);
await assert.rejects(createRealRun(dataset, 'hybrid', ['svm'], '', client), /two different models/);
await assert.rejects(createRealRun(dataset, 'compare', ['svm'], '', client), /at least two models/);
await assert.rejects(createRealRun(dataset, 'single', ['svm', 'lr'], '', client), /one model/);
assert.equal(client.calls.length, 0);

// ---- a dataset without the 30 feature columns ----
const noFeatures = { headers: ['id', 'value', 'label'], records: [['1', '2', 'Benign']] };
await assert.rejects(createRealRun(noFeatures, 'single', ['svm'], '', client),
  e => e.kind === 'invalid' && /missing required feature columns: radius_mean/.test(e.message) && /and 25 more/.test(e.message));
assert.equal(client.calls.length, 0);

// ---- server messages count rows from 0; the page counts from 1 ----
client = { ...fakeClient(), predict: async () => { throw new ApiError('Invalid input.', { status: 400, kind: 'invalid', details: ["record 2: 'radius_mean' must be a number"] }); } };
await assert.rejects(createRealRun(dataset, 'single', ['svm'], '', client), e => e.details[0] === "data row 3: 'radius_mean' must be a number");

// ---- server offline ----
client = { ...fakeClient(), getModels: async () => { throw new ApiError('Cannot reach', { kind: 'offline' }); } };
await assert.rejects(createRealRun(dataset, 'single', ['svm'], '', client), e => e.kind === 'offline');
console.log('PASS: real-run adapter (single, hybrid, compare, measured results, invalid choices, error mapping).');

// ---- CSV export of real results ----
run = await createRealRun(dataset, 'hybrid', ['lr', 'svm'], 'diagnosis', fakeClient());
const csv = exportRunCsv(dataset, run);
const lines = csv.split('\r\n');
assert.equal(lines[0], '"row","reference_label","lr_svm_prediction","lr_svm_malignant_probability_percent","lr_svm_cutoff_percent","lr_prediction","lr_malignant_probability_percent","lr_cutoff_percent","svm_prediction","svm_malignant_probability_percent","svm_cutoff_percent","output_type"');
assert.equal(lines.length, 4);
assert.ok(lines[1].startsWith(`"1","'=HYPERLINK(""x"")","Malignant","85","45"`));   // formula neutralized, cutoff as percent
assert.ok(lines[1].endsWith('"MODEL PREDICTIONS - research prototype trained on WDBC, not a diagnosis"'));
assert.ok(!csv.includes('SYNTHETIC'));
assert.equal(parseDataset(csv).records.length, 3);
console.log('PASS: results CSV columns, cutoffs, formula protection.');

// ---- the API client turns failures into clear errors ----
const realFetch = globalThis.fetch;
const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new SyntaxError('not json'); return body; } });
async function failsWith(fakeFetch, call) {
  globalThis.fetch = fakeFetch;
  try { await call(createClient('http://x', 50)); } catch (e) { return e; } finally { globalThis.fetch = realFetch; }
  assert.fail('expected an error');
}
let e = await failsWith(async () => { throw new TypeError('fetch failed'); }, c => c.health());
assert.ok(e instanceof ApiError && e.kind === 'offline' && /python ml\/api\.py/.test(e.message));
e = await failsWith(reply(400, { error: 'Invalid input.', details: ['record 0: x'] }), c => c.predict(['svm'], []));
assert.ok(e.kind === 'invalid' && e.status === 400 && e.details[0] === 'record 0: x');
e = await failsWith(reply(502, undefined), c => c.getModels());
assert.equal(e.kind, 'offline');                       // dev proxy with nothing behind it
e = await failsWith(reply(500, { error: 'Internal server error.' }), c => c.getModels());
assert.equal(e.kind, 'server');
e = await failsWith(async (_, opts) => new Promise((_, reject) => opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))), c => c.health());
assert.equal(e.kind, 'timeout');
let sent;
globalThis.fetch = async (url, opts) => { sent = { url, opts }; return { ok: true, status: 200, json: async () => ({ ok: true }) }; };
await createClient('http://x').predict(['svm', 'mlp'], [{ a: 1 }]);
globalThis.fetch = realFetch;
assert.equal(sent.url, 'http://x/api/predict');
assert.equal(sent.opts.method, 'POST');
assert.deepEqual(JSON.parse(sent.opts.body), { models: ['svm', 'mlp'], records: [{ a: 1 }] });
console.log('PASS: API client errors (offline, invalid input, proxy down, server error, timeout) and request format.');

// ---- big datasets are sent in chunks (Vercel's request limit is 4.5 MB) ----
import { CHUNK_SIZE } from '../src/utils/realRun.js';
assert.equal(CHUNK_SIZE, 1000);
const bigDataset = {
  headers: ['case_id', 'diagnosis', ...features],
  records: Array.from({ length: 2500 }, (_, i) => [String(i), 'Benign', String(i), ...features.slice(1).map(() => '1')]),
};
const chunkClient = (failOnCall = -1) => {
  const calls = [];
  return {
    calls,
    getModels: async () => ({ features }),
    getMetrics: async () => ({ n_test: 114, results: [] }),
    predict: async (models, records) => {
      calls.push([models, records.length]);
      if (calls.length - 1 === failOnCall) throw new ApiError('Invalid input.', { status: 400, kind: 'invalid', details: ["record 5: 'radius_mean' must be a number"] });
      return { results: records.map(r => ({ probability: Number(r.radius_mean) / 10000, cutoff: 0.5, prediction: 'benign' })) };
    },
  };
};
let chunked = chunkClient();
run = await createRealRun(bigDataset, 'single', ['svm'], '', chunked);
assert.deepEqual(chunked.calls.map(c => c[1]), [1000, 1000, 500]);          // three requests, none over 1,000 rows
assert.ok(chunked.calls.every(c => c[0][0] === 'svm'));
assert.equal(run.models[0].predictions.length, 2500);                         // all rows come back, in order
assert.equal(run.models[0].predictions[0].score, 0);
assert.equal(run.models[0].predictions[1000].score, 10);
assert.equal(run.models[0].predictions[2000].score, 20);
assert.equal(run.models[0].predictions[2499].score, 25);
chunked = chunkClient();
run = await createRealRun(bigDataset, 'compare', ['svm', 'lr', 'mlp'], '', chunked);
assert.equal(chunked.calls.length, 9);                                        // 3 models x 3 chunks
assert.ok(run.models.every(m => m.predictions.length === 2500));
chunked = chunkClient();
await createRealRun(dataset, 'single', ['svm'], '', chunked);                 // small datasets still use one request
assert.equal(chunked.calls.length, 1);
// an error in a later chunk reports the row number in the whole file, not within the chunk
await assert.rejects(createRealRun(bigDataset, 'single', ['svm'], '', chunkClient(2)), e => e.details[0] === "data row 2006: 'radius_mean' must be a number");
console.log('PASS: large datasets are sent in chunks, results stay in order, and error rows are numbered correctly.');
