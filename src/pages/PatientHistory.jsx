import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { reports } from "../data/patients";

export function PatientHistory() {
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || new URLSearchParams(location.search).get('q') || "");
  const [page, setPage] = useState(1);
  const dialogRef = useRef(null);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  useEffect(() => { setQuery(location.state?.query || new URLSearchParams(location.search).get('q') || ''); }, [location.search, location.state]);
  useEffect(() => { setPage(1); }, [query, filter]);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    const handler = (event) => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'Tab') {
        const elements = dialogRef.current?.querySelectorAll('button, a, input, select, textarea, [tabindex="0"]');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [active]);

  const filtered = useMemo(
    () =>
      reports.filter((report) => {
        const matchesQuery = `${report.id} ${report.name} ${report.doctor}`.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === "All" || report.prediction === filter;
        return matchesQuery && matchesFilter;
      }),
    [query, filter],
  );

  return (
    <>
      <PageHeader eyebrow="Patient history" title="Prediction history and reports" description="Search clinical cases, filter predictions, and open complete AI report details." />

      <section className="clinical-card rounded-xl dark:text-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              aria-label="Search patient history"
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900"
              placeholder="Search patient history"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Normal", "Benign", "Malignant"].map((option) => (
              <button
                key={option}
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === option ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                {["Patient ID", "Name", "Date", "Prediction", "Doctor", "Status", ""].map((head) => (
                  <th scope="col" key={head} className="px-5 py-3 font-semibold">{head || 'Actions'}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center">No matching sample records. Try another name or prediction filter.</td></tr>}
              {filtered.slice((page - 1) * 6, page * 6).map((report) => (
                <tr key={report.reportId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{report.id}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{report.name}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{report.date}</td>
                  <td className="px-5 py-4"><StatusPill value={report.prediction} /></td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{report.doctor}</td>
                  <td className="px-5 py-4"><StatusPill value={report.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setActive(report)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-200">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>{filtered.length} records · Page {page} of {Math.max(1, Math.ceil(filtered.length / 6))}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-800">Previous</button>
            <button disabled={page * 6 >= filtered.length} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-slate-800">Next</button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
            <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Sample report for ${active.name}`} tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-slate-950 dark:text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">{active.reportId}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{active.name}</h2>
                </div>
                <button onClick={() => setActive(null)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close report">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flat-details mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Prediction", active.prediction],
                  ["Confidence", `${active.confidence}%`],
                  ["Risk Level", active.risk],
                  ["Model", active.model],
                  ["Latency", `${active.latency} ms`],
                  ["Doctor", active.doctor],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-1 font-semibold text-slate-950 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:text-slate-300">Sample notes: {active.notes}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
