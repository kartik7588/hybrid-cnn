import { useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  return <footer className="flex flex-col items-end border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">{open && <section className="mb-3 w-72 max-w-full text-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">Demo support</h2><button onClick={() => setOpen(false)} aria-label="Close support" className="grid h-11 w-11 place-items-center"><X size={18} /></button></div><p className="leading-6 text-slate-600 dark:text-slate-300">No AI assistant is connected. Images stay in this browser session; analysis and reports use fixed sample values.</p></section>}<button onClick={() => setOpen(!open)} aria-label="Demo support" title="Demo support" aria-expanded={open} className="flex min-h-11 items-center gap-2 text-sm text-blue-700 dark:text-blue-300"><CircleHelp size={20} />Demo support</button></footer>;
}
