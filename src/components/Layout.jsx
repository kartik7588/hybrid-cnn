import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useTheme } from "../hooks/useTheme";

const names = {
  dashboard: "Dashboard",
  upload: "Upload Scan",
  results: "AI Results",
  history: "Patient History",
  reports: "AI Reports",
  analytics: "Analytics",
  settings: "Settings",
};

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const active = location.pathname.split("/").filter(Boolean)[0] || "dashboard";

  return (
    <div className="min-h-screen bg-clinical-mist text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3 focus:text-blue-700">Skip to content</a>
      <div className="flex min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="min-w-0 flex-1">
          <TopNav onMenuClick={() => setOpen(true)} theme={theme} onThemeToggle={toggleTheme} />
          <p className="demo-notice">Demonstration workspace. Patients, predictions, overlays and metrics are sample data; no clinical model is connected.</p>
          <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 md:px-6">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>MedAI</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-800 dark:text-slate-200">{names[active]}</span>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
