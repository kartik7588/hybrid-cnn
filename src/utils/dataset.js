export const researchModels = [
  { id: 'svm', name: 'SVM', detail: 'Support vector machine', input: 'Numeric features' },
  { id: 'lr', name: 'Logistic regression', detail: 'Linear classification baseline', input: 'Numeric features' },
  { id: 'cnn', name: 'CNN', detail: 'Convolutional neural network', input: 'Images with a connected model' },
  { id: 'mlp', name: 'MLP', detail: 'Multilayer perceptron', input: 'Numeric features' },
  { id: 'hybrid', name: 'Hybrid CNN + MLP', detail: 'Proposed image and numeric feature fusion', input: 'Paired images and numeric features' },
];

// Bounded CSV parser supporting quoted fields, escaped quotes and embedded newlines.
export function parseDataset(text) {
  const rows = [];
  let row = [], value = '', quoted = false, closed = false;
  const pushValue = () => { row.push(value.trim()); value = ''; closed = false; };
  const pushRow = () => {
    pushValue();
    if (row.some(Boolean)) rows.push(row);
    if (rows.length > 5001) throw new Error('Use a CSV with at most 5,000 data rows.');
    row = [];
  };
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else value += c;
    } else if (c === '"') {
      if (value.trim() || closed) throw new Error('Invalid quotation in CSV. Check the file and try again.');
      value = ''; quoted = true;
    } else if (c === ',') pushValue();
    else if (c === '\r' || c === '\n') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      pushRow();
    } else {
      if (closed && c.trim()) throw new Error('Unexpected text after a quoted CSV value.');
      value += c;
    }
    if (row.length > 100) throw new Error('Use a CSV with at most 100 columns.');
  }
  if (quoted) throw new Error('A quoted CSV value is not closed.');
  if (row.length || value || closed) pushRow();
  if (rows.length < 2) throw new Error('Include a header row and at least one data row.');
  const [headers, ...records] = rows;
  if (headers.length > 100 || headers.some(h => !h) || new Set(headers).size !== headers.length) {
    throw new Error('Use 1-100 unique, non-empty column headers.');
  }
  const invalid = records.findIndex(r => r.length !== headers.length);
  if (invalid !== -1) throw new Error(`Data row ${invalid + 1} has a different column count from the header.`);
  return { headers, records };
}

export const exampleDataset = 'case_id,radius_mean,texture_mean,perimeter_mean,diagnosis\nDEMO-001,14.2,18.6,91.4,Benign\nDEMO-002,20.1,25.2,132.8,Malignant\nDEMO-003,12.4,16.1,79.8,Benign\nDEMO-004,17.8,22.4,115.6,Malignant\nDEMO-005,13.1,19.7,84.2,Benign\nDEMO-006,16.4,21.2,106.5,Malignant\n';

// Fixed synthetic outputs exercise the interface only. Never inspect features or labels.
export function createDemoRun(dataset, modelIds, referenceColumn = '') {
  return {
    referenceColumn,
    models: researchModels.filter(m => modelIds.includes(m.id)).map(model => {
      const offset = researchModels.findIndex(m => m.id === model.id);
      const predictions = dataset.records.map((_, index) => ({
        label: (index + offset) % 3 === 0 ? 'Malignant' : 'Benign',
        score: 55 + ((index * 7 + offset * 11) % 40),
      }));
      return { ...model, predictions, malignant: predictions.filter(p => p.label === 'Malignant').length };
    }),
  };
}

export function exportDemoCsv(dataset, run) {
  // Neutralize spreadsheet formulas in user-supplied headers and reference values.
  const quote = value => '"' + String(value).replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const reference = dataset.headers.indexOf(run.referenceColumn);
  const headers = ['row', ...(reference >= 0 ? ['reference_label'] : []), ...run.models.flatMap(m => [`${m.id}_demo_prediction`, `${m.id}_synthetic_score_percent`]), 'output_type'];
  const rows = dataset.records.map((record, index) => [index + 1, ...(reference >= 0 ? [record[reference]] : []), ...run.models.flatMap(m => [m.predictions[index].label, m.predictions[index].score]), 'SYNTHETIC DEMO - NO MODEL INFERENCE']);
  return [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n');
}

// Export for real model runs (see createRealRun in realRun.js).
// Same spreadsheet-formula neutralization as exportDemoCsv.
export function exportRunCsv(dataset, run) {
  const quote = value => '"' + String(value).replace(/^[\s]*[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const reference = dataset.headers.indexOf(run.referenceColumn);
  const headers = ['row', ...(reference >= 0 ? ['reference_label'] : []), ...run.models.flatMap(m => [`${m.id}_prediction`, `${m.id}_malignant_probability_percent`, `${m.id}_cutoff_percent`]), 'output_type'];
  const rows = dataset.records.map((record, index) => [index + 1, ...(reference >= 0 ? [record[reference]] : []), ...run.models.flatMap(m => [m.predictions[index].label, m.predictions[index].score, Math.round(m.cutoff * 100)]), 'MODEL PREDICTIONS - research prototype trained on WDBC, not a diagnosis']);
  return [headers, ...rows].map(row => row.map(quote).join(',')).join('\r\n');
}
