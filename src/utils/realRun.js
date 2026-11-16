// Runs a dataset through the real prediction API and returns results in the same
// shape the Upload Dataset page already displays (see createDemoRun in dataset.js).
import { api, ApiError } from './mlApi.js';
import { researchModels } from './dataset.js';

// Page model id -> API model key. CNN and the image/numeric hybrid have no trained model.
export const API_KEYS = { lr: 'logistic_regression', svm: 'svm', mlp: 'mlp' };
export const isModelAvailable = id => Object.hasOwn(API_KEYS, id);

const pageId = key => Object.keys(API_KEYS).find(id => API_KEYS[id] === key);
const modelInfo = id => researchModels.find(m => m.id === id);
const label = prediction => (prediction === 'malignant' ? 'Malignant' : 'Benign');
const percent = p => Math.round(p * 1000) / 10;   // malignant probability as a percentage

// Server messages count records from 0; the page counts data rows from 1.
const friendly = text => text.replace(/record (\d+)/, (_, n) => `data row ${Number(n) + 1}`);

function toRecords(dataset, features) {
  const columns = features.map(f => dataset.headers.indexOf(f));
  const missing = features.filter((_, i) => columns[i] < 0);
  if (missing.length) {
    const shown = missing.slice(0, 5).join(', ');
    const more = missing.length > 5 ? ` and ${missing.length - 5} more` : '';
    throw new ApiError(
      `This dataset is missing required feature columns: ${shown}${more}. ` +
        'The models need the 30 WDBC measurement columns.',
      { kind: 'invalid', details: missing },
    );
  }
  return dataset.records.map(row =>
    Object.fromEntries(features.map((f, i) => [f, row[columns[i]]])));
}

function entry(id, name, detail, results, pick) {
  const predictions = results.map(r => {
    const item = pick(r);
    return { label: label(item.prediction), score: percent(item.probability) };
  });
  return {
    id, name, detail, input: 'Numeric features', predictions,
    malignant: predictions.filter(p => p.label === 'Malignant').length,
    cutoff: pick(results[0]).cutoff,
  };
}

// mode: 'single' | 'hybrid' | 'compare'; ids: page model ids.
// single -> 1 id; hybrid -> exactly 2 different ids; compare -> 2 or 3 ids.
export async function createRealRun(dataset, mode, ids, referenceColumn = '', client = api) {
  const unavailable = ids.filter(id => !isModelAvailable(id));
  if (unavailable.length) {
    const names = unavailable.map(id => modelInfo(id)?.name ?? id).join(', ');
    throw new ApiError(`${names} has no trained model yet.`, { kind: 'invalid' });
  }
  if (mode === 'single' && ids.length !== 1) throw new ApiError('Choose one model.', { kind: 'invalid' });
  if (mode === 'hybrid' && (ids.length !== 2 || ids[0] === ids[1])) {
    throw new ApiError('Choose two different models to combine.', { kind: 'invalid' });
  }
  if (mode === 'compare' && ids.length < 2) throw new ApiError('Choose at least two models to compare.', { kind: 'invalid' });

  try {
    const { features } = await client.getModels();
    const records = toRecords(dataset, features);
    let models;

    if (mode === 'hybrid') {
      const [a, b] = ids;
      const out = await client.predict([API_KEYS[a], API_KEYS[b]], records);
      const [nameA, nameB] = [modelInfo(a).name, modelInfo(b).name];
      models = [
        entry(`${a}_${b}`, `${nameA} + ${nameB} (combined)`,
          "Average of the two models' malignant probabilities", out.results, r => r),
        ...[a, b].map(id => entry(id, modelInfo(id).name, modelInfo(id).detail, out.results,
          r => r.individual[API_KEYS[id]])),
      ];
    } else {
      models = await Promise.all(ids.map(async id => {
        const out = await client.predict([API_KEYS[id]], records);
        const info = modelInfo(id);
        return entry(id, info.name, info.detail, out.results, r => r);
      }));
    }
    return { referenceColumn, source: 'api', models };
  } catch (err) {
    if (err instanceof ApiError) {
      err.details = (err.details ?? []).map(d => (typeof d === 'string' ? friendly(d) : d));
      if (err.kind === 'invalid' && err.details.length && !err.message.startsWith('This dataset')) {
        err.message = `${err.message} ${err.details[0]}`;
      }
    }
    throw err;
  }
}
