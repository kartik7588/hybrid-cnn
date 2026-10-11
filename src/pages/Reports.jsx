import { FileDown } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { reports } from "../data/patients";
import { printReport } from "../utils/printReport";

export function Reports() {
  return (
    <>
      <PageHeader title="Sample reports" description="Review illustrative case records and open a printable report. Use your browser's Save as PDF option to export." />
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.slice(0, 6).map((report) => (
          <article key={report.reportId} className="clinical-card rounded-xl p-5 dark:text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">{report.reportId}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{report.name}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{report.id} | {report.doctor}</p>
              </div>
              <StatusPill value={report.prediction} />
            </div>
            <div className="mt-5 border-y border-slate-200 py-4 dark:border-slate-800">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{report.notes}</p>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Confidence" value={`${report.confidence}%`} />
              <Metric label="Risk" value={report.risk} />
              <Metric label="Latency" value={`${report.latency} ms`} />
            </div>
            <button onClick={() => printReport(report)} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
              <FileDown className="h-4 w-4" />
              Print / save sample PDF
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="py-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
