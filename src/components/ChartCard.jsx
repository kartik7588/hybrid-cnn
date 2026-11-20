export function ChartCard({ title, action, note = "Illustrative dataset; not measured clinical performance", children }) {
  return (
    <section className="clinical-card rounded-xl p-5 dark:text-white">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{note}</p>
        </div>
        {action}
      </div>
      <div className="h-72">{children}</div>
    </section>
  );
}
