import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BrainCircuit, Clock3, FileSearch, ScanLine } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { StatusPill } from "../components/StatusPill";
import { detectionDistribution, weeklyScans } from "../data/analytics";
import { patients } from "../data/patients";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        eyebrow="Doctor dashboard"
        title="Imaging overview"
        description="Sample scan activity and cases awaiting review."
      >
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Model Version</p>
            <p className="font-semibold text-slate-950 dark:text-white">Hybrid CNN v2.1</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latency</p>
            <p className="font-semibold text-slate-600 dark:text-slate-300">Sample: 180 ms</p>
          </div>
        </div>
      </PageHeader>

      <div className="clinical-stats grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today's Scans" value="86" detail="+12% from yesterday" icon={ScanLine} />
        <StatCard title="Detected Cases" value="19" detail="+6 flagged cases" icon={FileSearch} accent="rose" />
        <StatCard title="Average AI Confidence" value="94.8%" detail="+2.1% this week" icon={BrainCircuit} accent="emerald" />
        <StatCard title="Pending Reviews" value="11" detail="4 high priority" icon={Clock3} accent="cyan" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <ChartCard title="Weekly scans (count)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyScans} margin={{ left: -20, right: 10, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area isAnimationActive={false} type="monotone" dataKey="scans" stroke="#0f766e" strokeWidth={2} fill="#0f766e" fillOpacity={0.08} />
              <Area isAnimationActive={false} type="monotone" dataKey="detected" stroke="#f43f5e" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Sample prediction distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie isAnimationActive={false} data={detectionDistribution} dataKey="value" innerRadius={72} outerRadius={104} paddingAngle={2}>
                {detectionDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="clinical-card mt-6 overflow-hidden rounded-xl dark:text-white">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent Patients</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest mammography AI predictions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                {["Patient ID", "Patient Name", "Age", "Prediction", "Confidence", "Status", ""].map((head) => (
                  <th scope="col" key={head} className="px-5 py-3 font-semibold">{head || 'Actions'}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.slice(0, 6).map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/70">
                  <td className="px-5 py-4 font-semibold text-slate-950 dark:text-white">{patient.id}</td>
                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{patient.name}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{patient.age}</td>
                  <td className="px-5 py-4"><StatusPill value={patient.prediction} /></td>
                  <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{patient.confidence}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{patient.status}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => navigate('/history', { state: { query: patient.id } })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300 dark:hover:bg-blue-950/40">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
