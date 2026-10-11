import { Cross } from "lucide-react";

export function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-soft">
        <Cross className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-slate-950 dark:text-white">MedAI Hospital</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">Hybrid CNN Diagnostics</p>
        </div>
      )}
    </div>
  );
}
