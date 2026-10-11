import { Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useTheme } from "../hooks/useTheme";
import { useRef, useState } from "react";

export function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const form = useRef(null);
  const [saved, setSaved] = useState(false);
  const [config] = useState(() => { try { return JSON.parse(localStorage.getItem('clinical-settings') || '{}'); } catch { return {}; } });

  return (
    <>
      <PageHeader eyebrow="Settings" title="Hospital configuration" description="Manage the local frontend configuration used by the simulated clinical workspace." />

      <section className="clinical-card max-w-4xl rounded-xl p-5 dark:text-white">
        <form ref={form} onSubmit={(event) => { event.preventDefault(); localStorage.setItem('clinical-settings', JSON.stringify(Object.fromEntries(new FormData(form.current)))); setSaved(true); }} className="grid gap-5">
          <SettingRow title="Dark Mode" description="Use the low-light clinical interface.">
            <button
              onClick={toggleTheme}
              type="button"
              role="switch"
              aria-checked={isDark}
              className={`flex h-11 w-14 shrink-0 items-center rounded-md p-2 transition ${isDark ? "bg-blue-600" : "bg-slate-300"}`}
              aria-label="Toggle dark mode"
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${isDark ? "translate-x-4" : ""}`} />
            </button>
          </SettingRow>
          <SettingRow title="Notifications" description="Clinical alerts, model sync, and review updates.">
            <input aria-label="Enable demo notification preference" name="Notifications" type="checkbox" defaultChecked={config.Notifications === 'on'} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          </SettingRow>
          <Field label="Hospital Name" value={config['Hospital Name'] || "MedAI City Hospital"} />
          <Field label="API Endpoint" value={config['API Endpoint'] || "https://api.medai.local/v1"} />
          <Field label="Model Version" value={config['Model Version'] || "Hybrid CNN v2.1"} />
          <label>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</span>
            <select name="Language" defaultValue={config.Language || 'English'} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950">
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </label>
          <button className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-soft hover:bg-blue-700 sm:w-44">
            <Save className="h-4 w-4" />
            Save
          </button>
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{saved ? 'Preferences saved in this browser.' : 'Local demo preferences only. Endpoint, model and language values do not connect services or translate the interface.'}</p>
        </form>
      </section>
    </>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-4 dark:border-slate-800">
      <div>
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <label>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        defaultValue={value}
        name={label}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
      />
    </label>
  );
}
