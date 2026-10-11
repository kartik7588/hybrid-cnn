export function PageHeader({ title, description, children }) {
  return <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div>
    <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
    {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>}
  </div>{children}</div>;
}
