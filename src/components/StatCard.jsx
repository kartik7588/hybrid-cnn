export function StatCard({ title, value, detail }) {
  return <article className="clinical-stat"><p className="text-sm text-slate-600 dark:text-slate-300">{title}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{detail}</p></article>;
}
