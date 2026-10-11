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
import { Activity, Brain, Clock, Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { modelMetrics, monthlyDiagnoses, usageByDepartment } from "../data/analytics";

export function Analytics() {
  return (
    <>
      <PageHeader title="Sample analytics" description="Illustrative volumes and model metrics. No measured accuracy or clinical validation is available in this frontend." />

      <div className="clinical-stats grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value="12,480" detail="+18% this quarter" icon={Users} />
        <StatCard title="Sample flagged cases" value="1,942" detail="Illustrative case count" icon={Activity} accent="rose" />
        <StatCard title="Average Confidence" value="94.8%" detail="+2.1% month over month" icon={Brain} accent="emerald" />
        <StatCard title="Sample accuracy" value="96.6%" detail="Illustrative value; unvalidated" icon={Clock} accent="cyan" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Monthly Diagnoses">
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

        <ChartCard title="Illustrative accuracy (%)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={modelMetrics} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[92, 98]} />
              <Tooltip />
              <Line isAnimationActive={false} type="monotone" dataKey="accuracy" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
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

        <ChartCard title="Hospital Usage">
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
    </>
  );
}
