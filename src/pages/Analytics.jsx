import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { modelMetrics, monthlyDiagnoses, usageByDepartment } from "../data/analytics";
import { api } from "../utils/mlApi";
import { numberText, pctText, summarizeMetrics } from "../utils/measured";

const headings = "text-lg font-semibold text-slate-950 dark:text-white";
const muted = "text-sm text-slate-600 dark:text-slate-300";
const columns = ["Model", "Cutoff", "Missed cancers", "False alarms", "Sensitivity", "Specificity", "Precision", "Accuracy", "ROC-AUC"];

// Measured results come from the prediction server (python ml/api.py), which serves ml/models/test_results.json.
function useMeasuredResults() {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let active = true;
    api.getMetrics()
      .then(metrics => {
        const summary = summarizeMetrics(metrics);
        if (active) setState(summary ? { status: "ready", summary } : { status: "error", message: "The measured results are missing or in an unexpected format." });
      })
      .catch(error => { if (active) setState({ status: "error", message: error.message || "Could not load the measured results." }); });
    return () => { active = false; };
  }, []);
  return state;
}

function MeasuredResults({ summary }) {
  return (
    <>
      <div className="clinical-stats mt-4 grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Held-out test patients" value={summary.nTest} detail="Not used for training, tuning or choosing cutoffs" />
        <StatCard title="Options evaluated" value={summary.rows.length} detail={`${summary.singles} models and ${summary.pairs} pairs of models`} />
        <StatCard title="Missed cancers" value={summary.missedRange} detail="Range across the options" />
        <StatCard title="False alarms" value={summary.falseAlarmRange} detail="Range across the options" />
      </div>

      <div className="mt-6 grid gap-6">
        <section className="clinical-card min-w-0 rounded-xl p-5 dark:text-white">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Results by model</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Measured on the held-out test patients, at each option's chosen decision cutoff</p>
          <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Measured results table">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Measured results of each model and pair on the held-out test set</caption>
              <thead className="border-y border-slate-200 dark:border-slate-800">
                <tr>{columns.map(h => <th key={h} className="whitespace-nowrap px-3 py-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {summary.rows.map(r => (
                  <tr key={r.name} className="border-b border-slate-200 dark:border-slate-800">
                    <th scope="row" className="whitespace-nowrap px-3 py-3 font-medium">{r.name}</th>
                    <td className="px-3 py-3 tabular-nums">{numberText(r.cutoff, 2)}</td>
                    <td className="px-3 py-3 tabular-nums">{r.missed}</td>
                    <td className="px-3 py-3 tabular-nums">{r.falseAlarms}</td>
                    <td className="px-3 py-3 tabular-nums">{pctText(r.sensitivity)}</td>
                    <td className="px-3 py-3 tabular-nums">{pctText(r.specificity)}</td>
                    <td className="px-3 py-3 tabular-nums">{pctText(r.precision)}</td>
                    <td className="px-3 py-3 tabular-nums">{pctText(r.accuracy)}</td>
                    <td className="px-3 py-3 tabular-nums">{numberText(r.auc, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ChartCard title="Errors on the held-out test patients" note="Counts per option. Measured, not illustrative.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.rows} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="shortName" stroke="#64748b" interval={0} tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar isAnimationActive={false} dataKey="missed" name="Missed cancers" fill="#f43f5e" />
              <Bar isAnimationActive={false} dataKey="falseAlarms" name="False alarms" fill="#94a3a0" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <p className={`mt-4 max-w-3xl text-xs leading-5 ${muted}`}>
        One test set of {summary.nTest} patients from one public dataset (WDBC, numeric cell measurements, not images).
        One patient changes sensitivity by a few percentage points, so differences of one or two patients are not
        meaningful. Cutoffs were chosen from training data only. This is not a clinical validation.
      </p>
    </>
  );
}

export function Analytics() {
  const measured = useMeasuredResults();
  return (
    <>
      <PageHeader title="Analytics" description="Measured results of the trained models on a held-out test set, followed by illustrative sample data for the demonstration workspace. Nothing here is clinically validated." />

      <section aria-labelledby="measured-heading">
        <h2 id="measured-heading" className={headings}>Measured model performance</h2>
        <p className={`mt-1 max-w-3xl ${muted}`}>Models trained on the Wisconsin Diagnostic Breast Cancer data and tested on patients they never saw. Loaded from the prediction server.</p>
        {measured.status === "loading" && <p role="status" className={`mt-4 ${muted}`}>Loading measured results...</p>}
        {measured.status === "error" && (
          <div role="alert" className="mt-4 text-sm text-rose-700 dark:text-rose-300">
            <p>{measured.message}</p>
          </div>
        )}
        {measured.status === "ready" && <MeasuredResults summary={measured.summary} />}
      </section>

      <section aria-labelledby="sample-heading" className="mt-10">
        <h2 id="sample-heading" className={headings}>Sample operational data</h2>
        <p className={`mt-1 max-w-3xl ${muted}`}>Illustrative numbers for the demonstration workspace. They are not real patients, hospital data or model outputs.</p>

        <div className="clinical-stats mt-4 grid sm:grid-cols-2">
          <StatCard title="Sample patient count" value="12,480" detail="Illustrative value" />
          <StatCard title="Sample flagged cases" value="1,942" detail="Illustrative case count" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ChartCard title="Sample monthly diagnoses">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDiagnoses} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar isAnimationActive={false} dataKey="normal" stackId="a" fill="#0f766e" />
                <Bar isAnimationActive={false} dataKey="benign" stackId="a" fill="#94a3a0" />
                <Bar isAnimationActive={false} dataKey="malignant" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sample prediction time (ms)">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelMetrics} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line isAnimationActive={false} type="monotone" dataKey="latency" stroke="#0f766e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Sample hospital usage">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageByDepartment} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis type="category" dataKey="name" stroke="#64748b" width={80} />
                <Tooltip />
                <Bar isAnimationActive={false} dataKey="usage" fill="#0f766e" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>
    </>
  );
}
