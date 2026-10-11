import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UploadCloud,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "../utils/cn";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Scan", to: "/upload", icon: UploadCloud },
  { label: "Patient History", to: "/history", icon: ClipboardList },
  { label: "AI Reports", to: "/reports", icon: FileText },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function Sidebar({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <>
      <button
        className={cn("fixed inset-0 z-30 bg-slate-950/40 lg:hidden", open ? "block" : "hidden")}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0",
          open ? "translate-x-0 visible" : "-translate-x-full invisible lg:visible",
        )}
      >
        <Logo />
        <button onClick={onClose} className="mt-3 min-h-11 text-left text-sm text-blue-700 dark:text-blue-300 lg:hidden">Close navigation</button>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>AI Server</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Demo
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Hybrid CNN v2.1</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No model server connected</p>
        </div>
        <button
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
          onClick={() => navigate("/")}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>
    </>
  );
}
