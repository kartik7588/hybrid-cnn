// Turns the prediction server's measured test results (ml/models/test_results.json,
// served at /api/metrics) into what the Analytics page displays.

export const pctText = value => (Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : 'n/a');
export const numberText = (value, digits) => (Number.isFinite(value) ? value.toFixed(digits) : 'n/a');

const shortName = name => name.replace('Logistic Regression', 'LR');

export function summarizeMetrics(metrics) {
  const results = metrics?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const rows = [];
  for (const result of results) {
    const s = result.chosen_cutoff;
    if (!s || !Array.isArray(result.selected)) return null;
    rows.push({
      name: result.name, shortName: shortName(result.name), models: result.selected.length,
      cutoff: s.cutoff, missed: s.missed_cancers, falseAlarms: s.false_alarms,
      sensitivity: s.sensitivity, specificity: s.specificity, precision: s.precision,
      accuracy: s.accuracy, auc: s.roc_auc,
    });
  }
  const range = key => {
    const values = rows.map(r => r[key]);
    const low = Math.min(...values);
    const high = Math.max(...values);
    return low === high ? String(low) : `${low} to ${high}`;
  };
  return {
    nTest: metrics.n_test, rows,
    singles: rows.filter(r => r.models === 1).length,
    pairs: rows.filter(r => r.models === 2).length,
    missedRange: range('missed'), falseAlarmRange: range('falseAlarms'),
  };
}
