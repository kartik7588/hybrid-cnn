import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout";
import { FloatingAssistant } from "./components/FloatingAssistant";
import { Login } from "./pages/Login";
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default:module.Dashboard })));
import { UploadScan } from "./pages/UploadScan";
import { Results } from "./pages/Results";
import { PatientHistory } from "./pages/PatientHistory";
const Analytics = lazy(() => import('./pages/Analytics').then((module) => ({ default:module.Analytics })));
import { Settings } from "./pages/Settings";
import { Reports } from "./pages/Reports";

export default function App() {
  return (
    <>
      <Suspense fallback={<p role="status" className="p-6">Loading workspace...</p>}><Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadScan />} />
          <Route path="/results" element={<Results />} />
          <Route path="/history" element={<PatientHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></Suspense>
      <FloatingAssistant />
    </>
  );
}
