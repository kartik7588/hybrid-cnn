import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle2, FileImage, Loader2, UploadCloud } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const stages = ["Uploading Image", "Preprocessing", "Running CNN", "Generating Heatmap", "Preparing Report"];

export function UploadScan() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState('');
  const timers = useRef([]);
  const patientForm = useRef(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const patientId = useMemo(() => `BC-${Math.floor(24000 + Math.random() * 800)}`, []);

  const handleFile = (selected) => {
    if (!selected) return;
    if (!['image/png', 'image/jpeg'].includes(selected.type) || selected.size > 20 * 1024 * 1024) { setError('Choose a PNG or JPG image under 20 MB. DICOM decoding is not available.'); return; }
    setError('');
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    if (selected.type?.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview("");
    }
  };

  const analyze = () => {
    if (!patientForm.current.reportValidity()) return;
    const patient = Object.fromEntries(new FormData(patientForm.current));
    setLoading(true);
    setStageIndex(0);
    stages.forEach((_, index) => {
      timers.current.push(setTimeout(() => setStageIndex(index), 650 * index));
    });
    timers.current.push(setTimeout(() => {
      navigate("/results", { state: { preview, fileName: file?.name, patient } });
    }, 3800));
  };

  return (
    <>
      <PageHeader
        eyebrow="Upload mammogram"
        title="Upload scan"
        description="Upload a mammography image, attach patient context, and run the simulated AI review workflow."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="clinical-card rounded-xl p-5 dark:text-white">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
            className="relative grid min-h-[280px] place-items-center overflow-hidden rounded-xl border border-dashed border-blue-200 bg-slate-50 p-5 text-center dark:border-blue-900 dark:bg-slate-950 md:min-h-[380px]"
          >
            {preview ? (
              <div className="w-full">
                <img src={preview} alt="Selected mammogram preview" className="mx-auto max-h-[340px] w-full rounded-xl object-contain shadow-clinical" />
                <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">{file?.name}</p>
              </div>
            ) : (
              <div className="max-w-sm">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-xl bg-white text-blue-600 shadow-soft dark:bg-slate-900">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">Upload Mammogram</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Choose a PNG or JPG image for the demo review. DICOM decoding is not available.
                </p>
                <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-blue-700">
                  <FileImage className="h-5 w-5" />
                  Select Scan
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </label>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">PNG or JPG · Maximum file size 20 MB</p>
          {error && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          {preview && <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300">Replace scan<input aria-label="Replace scan" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} /></label>}
        </section>

        <form ref={patientForm} onSubmit={(event) => event.preventDefault()} className="clinical-card rounded-xl p-5 dark:text-white">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Patient Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Patient Name" placeholder="Enter full name" />
            <Field label="Patient ID" value={patientId} />
            <Field label="Age" type="number" placeholder="47" />
            <Field label="Gender" value="Female" />
            <Field label="Doctor Name" value="Dr. Meera Kapoor" />
            <Field label="Hospital" value="MedAI City Hospital" />
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Symptoms</span>
              <textarea name="Symptoms" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950" placeholder="Palpable lump, discharge, family history" />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
              <textarea name="Notes" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950" placeholder="Prior scan comparison, radiologist comments" />
            </label>
          </div>

          <button
            disabled={!file || loading}
            type="button"
            onClick={analyze}
            className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
            Run demo analysis
          </button>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-200">{stages[stageIndex]}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{stageIndex + 1}/5</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
                  <motion.div
                    animate={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }}
                    className="h-full rounded-full bg-blue-600"
                  />
                </div>
                <div className="mt-4 grid gap-2">
                  {stages.map((stage, index) => (
                    <div key={stage} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {index <= stageIndex ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                      {stage}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </>
  );
}

function Field({ label, type = "text", value, placeholder }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type={type}
        name={label}
        min={type === 'number' ? 0 : undefined}
        max={type === 'number' ? 120 : undefined}
        defaultValue={value}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
      />
    </label>
  );
}
