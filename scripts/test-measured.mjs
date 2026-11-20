import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { numberText, pctText, summarizeMetrics } from '../src/utils/measured.js';

// Number formatting
assert.equal(pctText(0.95238), '95.2%');
assert.equal(pctText(1), '100.0%');
assert.equal(pctText(NaN), 'n/a');
assert.equal(pctText(undefined), 'n/a');
assert.equal(numberText(0.3, 2), '0.30');
assert.equal(numberText(0.99623, 3), '0.996');
assert.equal(numberText(NaN, 3), 'n/a');

// Summary of known results: ranges are computed from the data
const row = (name, selected, missed, falseAlarms) => ({
  name, selected,
  chosen_cutoff: { cutoff: 0.4, missed_cancers: missed, false_alarms: falseAlarms, sensitivity: 0.95, specificity: 0.98, precision: 0.97, accuracy: 0.97, roc_auc: 0.99 },
});
const known = summarizeMetrics({ n_test: 50, results: [
  row('Logistic Regression', ['logistic_regression'], 1, 1),
  row('SVM', ['svm'], 2, 0),
  row('Logistic Regression + SVM', ['logistic_regression', 'svm'], 2, 1),
] });
assert.equal(known.nTest, 50);
assert.equal(known.singles, 1 + 1);
assert.equal(known.pairs, 1);
assert.equal(known.missedRange, '1 to 2');
assert.equal(known.falseAlarmRange, '0 to 1');
assert.deepEqual(known.rows.map(r => r.shortName), ['LR', 'SVM', 'LR + SVM']);
assert.equal(known.rows[0].missed, 1);
const same = summarizeMetrics({ n_test: 10, results: [row('A', ['a'], 2, 0), row('B', ['b'], 2, 0)] });
assert.equal(same.missedRange, '2');
assert.equal(same.falseAlarmRange, '0');

// A missing precision (no positive predictions) does not break the summary
const noPrecision = summarizeMetrics({ n_test: 10, results: [{ ...row('A', ['a'], 0, 0), chosen_cutoff: { ...row('A', ['a'], 0, 0).chosen_cutoff, precision: NaN } }] });
assert.equal(pctText(noPrecision.rows[0].precision), 'n/a');

// Unexpected shapes are rejected instead of crashing the page
for (const bad of [null, undefined, {}, { results: [] }, { results: 'x' }, { results: [{ name: 'A', selected: ['a'] }] }, { results: [{ name: 'A', chosen_cutoff: {} }] }]) {
  assert.equal(summarizeMetrics(bad), null);
}
console.log('PASS: measured-results formatting, ranges and rejection of unexpected data.');

// The real saved results file has the structure the page needs
const saved = JSON.parse(await readFile(new URL('../ml/models/test_results.json', import.meta.url), 'utf8'));
const summary = summarizeMetrics(saved);
assert.ok(summary, 'ml/models/test_results.json could not be summarized');
assert.ok(summary.nTest > 0);
assert.ok(summary.rows.length > 0);
assert.equal(summary.singles + summary.pairs, summary.rows.length);
assert.ok(summary.rows.every(r => [r.cutoff, r.sensitivity, r.specificity, r.accuracy, r.auc].every(Number.isFinite)));
console.log('PASS: ml/models/test_results.json has the structure the Analytics page needs.');
