import { parseDataset } from './dataset.js';

const features = ['radius', 'texture', 'perimeter', 'area', 'smoothness', 'compactness', 'concavity', 'concave_points', 'symmetry', 'fractal_dimension'];
export const wdbcHeaders = ['case_id', 'diagnosis', ...['mean', 'se', 'worst'].flatMap(group => features.map(feature => `${feature}_${group}`))];

export function convertWdbcToCsv(raw) {
  const { records } = parseDataset(`${wdbcHeaders.join(',')}\n${raw.trim()}`);
  for (const [index, row] of records.entries()) {
    if (!/^\d+$/.test(row[0]) || !['B', 'M'].includes(row[1]) || row.slice(2).some(value => !value || !Number.isFinite(Number(value)))) {
      throw new Error(`Invalid WDBC record ${index + 1}. Expected an ID, B/M diagnosis and 30 numeric features.`);
    }
  }
  return [wdbcHeaders.join(','), ...records.map(([id, label, ...values]) => [id, label === 'B' ? 'Benign' : 'Malignant', ...values].join(','))].join('\n') + '\n';
}
