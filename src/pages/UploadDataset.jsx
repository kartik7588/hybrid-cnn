import { useRef, useState } from 'react';
import { Database, Download, Play, UploadCloud } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { exportRunCsv, parseDataset, researchModels } from '../utils/dataset';
import { createRealRun, isModelAvailable } from '../utils/realRun';
import { convertWdbcToCsv } from '../utils/wdbc';
import wdbcRaw from '../data/wdbc.data?raw';

const wisconsinCsv = convertWdbcToCsv(wdbcRaw);

const field = 'mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-900';
const pct = x => `${(x * 100).toFixed(1)}%`;

function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function UploadDataset() {
  const [dataset, setDataset] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isWisconsin, setIsWisconsin] = useState(false);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [mode, setMode] = useState('single');
  const [single, setSingle] = useState('svm');
  const [hybridA, setHybridA] = useState('lr');
  const [hybridB, setHybridB] = useState('svm');
  const [selected, setSelected] = useState(['svm', 'lr', 'mlp']);
  const [reference, setReference] = useState('');
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [page, setPage] = useState(0);
  const request = useRef(0);
  const runRequest = useRef(0);
  const trained = researchModels.filter(m => isModelAvailable(m.id));
  const ids = mode === 'single' ? [single] : mode === 'hybrid' ? [hybridA, hybridB] : selected;
  const blocker = mode === 'hybrid' && hybridA === hybridB ? 'Choose two different models to combine.' : mode === 'compare' && ids.length < 2 ? 'Choose at least two models to compare.' : '';
  const clearRun = () => { runRequest.current++; setRun(null); setRunning(false); setRunError(null); setPage(0); };

  const startRun = async () => {
    const id = ++runRequest.current;
    setRun(null); setPage(0); setRunError(null); setRunning(true);
    try {
      const result = await createRealRun(dataset, mode, ids, reference);
      if (id === runRequest.current) setRun(result);
    } catch (e) {
      if (id === runRequest.current) setRunError({ message: e.message || 'The run failed. Try again.', details: Array.isArray(e.details) ? e.details.slice(0, 3) : [] });
    } finally {
      if (id === runRequest.current) setRunning(false);
    }
  };

  const load = (text, name, wisconsin = false) => {
    const parsed = parseDataset(text);
    setDataset(parsed); setFileName(name); setIsWisconsin(wisconsin); setError(''); clearRun();
    setReference(parsed.headers.find(h => /^(diagnosis|label|target)$/i.test(h)) || '');
  };
  const handleFile = async file => {
    if (!file) return;
    const id = ++request.current;
    setError(''); clearRun(); setDataset(null); setFileName(''); setIsWisconsin(false);
    const isWdbc = file.name.toLowerCase().endsWith('.data');
    if ((!file.name.toLowerCase().endsWith('.csv') && !isWdbc) || file.size > 10 * 1024 * 1024) {
      setReading(false); setError('Choose a CSV or WDBC .data file up to 10 MB. ZIP folders and image datasets are not supported yet.'); return;
    }
    setReading(true);
    try { const text = await file.text(); if (id === request.current) load(isWdbc ? convertWdbcToCsv(text) : text, file.name, isWdbc); }
    catch (e) { if (id === request.current) setError(e.message || 'Unable to read this file. Try another CSV.'); }
    finally { if (id === request.current) setReading(false); }
  };

  return <div className="dataset-workspace min-w-0">
    <PageHeader title="Upload dataset" description="Research workspace for single-model and hybrid-model comparison." />
    <p className="mb-6 border-y border-slate-200 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
      Research prototype. Predictions come from Logistic regression, SVM and MLP models trained on the Wisconsin Diagnostic Breast Cancer data (30 numeric cell measurements). They are not a diagnosis and have not been clinically validated. The prediction server must be running (python ml/api.py). Use de-identified data only.
    </p>
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="min-w-0" aria-labelledby="dataset-heading">
        <h2 id="dataset-heading" className="text-lg font-semibold">Dataset</h2>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} className="mt-4 border border-dashed border-slate-300 p-5 dark:border-slate-700">
          <div className="flex items-start gap-3"><Database className="mt-1 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" /><div className="min-w-0"><h3 className="text-sm font-semibold">{fileName || 'Select a CSV dataset'}</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Header row required. Up to 5,000 records, 100 columns and 10 MB.</p></div></div>
          <label className={`${secondary} relative mt-4 cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-600`}><UploadCloud size={16} />{dataset ? 'Replace dataset' : 'Choose dataset'}<input aria-label="Choose CSV dataset" type="file" accept=".csv,.data,text/csv" className="sr-only" onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3"><button disabled={reading} className={secondary} onClick={() => { request.current++; load(wisconsinCsv, 'wisconsin-diagnostic.csv', true); }}>Use sample dataset</button><button className={secondary} onClick={() => download(wisconsinCsv, 'wisconsin-diagnostic.csv')}><Download size={16} />Download sample CSV</button></div>
        <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">Sample: Wisconsin Diagnostic Breast Cancer. CSV files require headers; original WDBC .data files are also accepted. The models need the 30 WDBC measurement columns (radius_mean ... fractal_dimension_worst).</p>
        {isWisconsin && dataset && <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300"><p>Wisconsin Diagnostic: {dataset.records.filter(r => r[1] === 'Benign').length} benign and {dataset.records.filter(r => r[1] === 'Malignant').length} malignant records. 30 numeric features, plus case ID and diagnosis. These are cell measurements, not mammogram images.</p><p className="font-medium">The models were trained on 455 of these 569 records, so agreement with this sample's labels does not measure accuracy.</p><p className="text-xs">Wolberg, Mangasarian, Street and Street (1993). <a className="text-blue-700 underline dark:text-blue-300" href="https://doi.org/10.24432/C5DW2B" target="_blank" rel="noreferrer">UCI dataset</a>. <a className="text-blue-700 underline dark:text-blue-300" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Headers added; B/M labels expanded. ID and diagnosis are not input features.</p></div>}
        {reading && <p role="status" className="mt-3 text-sm">Reading dataset...</p>}
        {error && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        {dataset && <div className="mt-4 border-y border-slate-200 py-3 text-sm dark:border-slate-800"><strong>{dataset.records.length.toLocaleString()}</strong> records <span className="mx-3 text-slate-400">/</span><strong>{dataset.headers.length}</strong> columns</div>}
      </section>
      <section className="min-w-0" aria-labelledby="model-heading">
        <h2 id="model-heading" className="text-lg font-semibold">Model selection</h2>
        <fieldset className="mt-4"><legend className="mb-2 text-sm font-medium">Evaluation mode</legend><div className="flex flex-wrap gap-4">{[['single','Single model'],['hybrid','Hybrid model'],['compare','Compare models']].map(([value,label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"><input type="radio" name="evaluation-mode" value={value} checked={mode === value} onChange={() => { setMode(value); clearRun(); }} />{label}</label>)}</div></fieldset>
        {mode === 'single' && <label className="mt-3 block text-sm font-medium">Single model<select className={field} value={single} onChange={e => { setSingle(e.target.value); clearRun(); }}>{researchModels.filter(m => m.id !== 'hybrid').map(m => <option key={m.id} value={m.id} disabled={!isModelAvailable(m.id)}>{m.name} — {isModelAvailable(m.id) ? m.detail : 'not trained yet'}</option>)}</select></label>}
        {mode === 'hybrid' && <div className="mt-3 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Model A<select className={field} value={hybridA} onChange={e => { setHybridA(e.target.value); clearRun(); }}>{trained.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="block text-sm font-medium">Model B<select className={field} value={hybridB} onChange={e => { setHybridB(e.target.value); clearRun(); }}>{trained.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div><p className="text-xs leading-5 text-slate-600 dark:text-slate-300">The two models are combined by averaging their malignant probabilities, and the combined result is shown first. This combines two numeric models; the CNN and image + numeric fusion are not trained yet.</p></div>}
        {mode === 'compare' && <fieldset className="mt-3"><legend className="mb-2 text-sm font-medium">Models to compare</legend>{researchModels.map(m => { const ok = isModelAvailable(m.id); return <label key={m.id} className={`flex min-h-11 items-center gap-3 text-sm ${ok ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}><input type="checkbox" disabled={!ok} checked={selected.includes(m.id)} onChange={e => { setSelected(e.target.checked ? [...selected,m.id] : selected.filter(id => id !== m.id)); clearRun(); }} />{m.name}{!ok && <span className="text-xs"> — not trained yet</span>}</label>; })}</fieldset>}
        <label className="mt-4 block text-sm font-medium">Reference label column (optional)<select disabled={!dataset} className={field} value={reference} onChange={e => { setReference(e.target.value); clearRun(); }}><option value="">No reference labels</option>{dataset?.headers.map(h => <option key={h}>{h}</option>)}</select></label>
        <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">Reference labels appear in the output only. No accuracy is calculated on your data. Measured results on the project's held-out test set are shown in the summary table. The CNN and the image + numeric hybrid are not trained yet; they need image data and correctly paired records.</p>
        <button disabled={!dataset || reading || running || !ids.length || !!blocker} onClick={startRun} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Play size={16} />{running ? 'Running models...' : 'Run models'}</button>
        {blocker && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{blocker}</p>}
        {running && <p role="status" className="mt-3 text-sm">Running models on {dataset.records.length.toLocaleString()} records...</p>}
        {runError && <div role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300"><p>{runError.message}</p>{runError.details.length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{runError.details.map((d, i) => <li key={i}>{String(d)}</li>)}</ul>}</div>}
      </section>
    </div>
    {dataset && <section className="mt-8 min-w-0" aria-labelledby="preview-heading"><h2 id="preview-heading" className="mb-3 text-lg font-semibold">Dataset preview</h2><div className="max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Dataset preview table"><table className="w-full text-left text-sm"><caption className="sr-only">First five dataset rows</caption><thead className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"><tr>{dataset.headers.map(h => <th className="max-w-64 break-words px-3 py-3 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{dataset.records.slice(0,5).map((r,i) => <tr key={i} className="border-b border-slate-200 dark:border-slate-800">{r.map((v,j) => <td className="max-w-64 break-words px-3 py-3" key={j}>{v || 'Not supplied'}</td>)}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Showing the first {Math.min(5,dataset.records.length)} records. Data stays in this browser session and is sent only to the local prediction server.</p></section>}
    <section className="mt-8 min-w-0 border-t border-slate-200 pt-6 dark:border-slate-800" aria-labelledby="output-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="output-heading" className="text-lg font-semibold">{run ? 'Prediction output' : 'Comparison output'}</h2>{run && <button className={secondary} onClick={() => download(exportRunCsv(dataset,run),'model-predictions.csv')}><Download size={16} />Export results CSV</button>}</div>
      {!run ? <p className="py-6 text-sm text-slate-600 dark:text-slate-300">{dataset ? 'Select a model and run it to view predictions.' : 'Choose a dataset to start a research comparison.'}</p> : <>
        <p role="status" className="mb-4 text-sm text-slate-600 dark:text-slate-300">Run complete: {dataset.records.length.toLocaleString()} rows across {run.models.length} model{run.models.length > 1 ? 's' : ''}. Each prediction applies the model's decision cutoff to its malignant probability. These are research-prototype outputs, not a diagnosis.</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Model summary table"><table className="w-full text-left text-sm"><caption className="sr-only">Model predictions summary and measured held-out test performance</caption><thead className="border-y border-slate-200 dark:border-slate-800"><tr>{['Model','Input','Flagged benign','Flagged malignant','Decision cutoff','Measured on held-out test set'].map(h => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{run.models.map(m => <tr key={m.id} className="border-b border-slate-200 dark:border-slate-800"><th scope="row" className="px-3 py-3 font-medium">{m.name}</th><td className="px-3 py-3">{m.input}</td><td className="px-3 py-3">{dataset.records.length-m.malignant}</td><td className="px-3 py-3">{m.malignant}</td><td className="px-3 py-3">{Math.round(m.cutoff*100)}%</td><td className="px-3 py-3">{m.measured ? <>{pct(m.measured.sensitivity)} sensitivity, {pct(m.measured.specificity)} specificity<span className="block text-xs text-slate-600 dark:text-slate-300">{m.measured.missedCancers} missed cancers, {m.measured.falseAlarms} false alarms ({m.measured.nTest} held-out patients)</span></> : 'Not available'}</td></tr>)}</tbody></table></div>
        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Measured results come from one held-out test set of 114 patients from the WDBC dataset. Differences of a single patient are not meaningful, and this is not a clinical validation.</p>
        <h3 className="mb-3 mt-6 text-sm font-semibold">Per-record predictions</h3>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Per-record comparison table"><table className="w-full text-left text-sm"><caption className="sr-only">Predictions and malignant probabilities for each dataset row</caption><thead className="border-y border-slate-200 dark:border-slate-800"><tr><th className="px-3 py-3">Row</th>{run.referenceColumn && <th className="px-3 py-3">Reference label</th>}{run.models.map(m => <th key={m.id} className="px-3 py-3 font-medium">{m.name}</th>)}</tr></thead><tbody>{dataset.records.slice(page*10,page*10+10).map((record,i) => { const index=page*10+i; return <tr key={index} className="border-b border-slate-200 dark:border-slate-800"><th scope="row" className="px-3 py-3 font-normal">{index+1}</th>{run.referenceColumn && <td className="max-w-48 break-words px-3 py-3">{record[dataset.headers.indexOf(run.referenceColumn)] || 'Not supplied'}</td>}{run.models.map(m => <td key={m.id} className="whitespace-nowrap px-3 py-3">{m.predictions[index].label}<span className="ml-2 text-xs text-slate-600 dark:text-slate-300">{m.predictions[index].score}% malignant probability</span></td>)}</tr>; })}</tbody></table></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm">Page {page+1} of {Math.ceil(dataset.records.length/10)}</p><div className="flex gap-2"><button className={secondary} disabled={page===0} onClick={() => setPage(page-1)}>Previous</button><button className={secondary} disabled={(page+1)*10>=dataset.records.length} onClick={() => setPage(page+1)}>Next</button></div></div>
      </>}
    </section>
  </div>;
}
