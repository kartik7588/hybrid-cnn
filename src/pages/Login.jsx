import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Logo } from "../components/Logo";
export function Login() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  return <main className="login-shell"><div className="login-content"><Logo />
    <h1 className="mt-10 text-2xl font-semibold">Breast imaging workspace</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Review scans, patient records and sample analysis reports in one workspace.</p>
    <form onSubmit={(event) => { event.preventDefault(); navigate('/dashboard'); }} className="mt-8 space-y-5">
      <label className="block text-sm font-medium">Email<input required type="email" autoComplete="username" defaultValue="doctor@medai.hospital" className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 dark:bg-slate-900" /></label>
      <label className="block text-sm font-medium">Password<input required type="password" autoComplete="current-password" defaultValue="hybridcnn" className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 dark:bg-slate-900" /></label>
      <div className="flex items-center justify-between gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked />Remember me</label><button type="button" onClick={() => setMessage('Account recovery is unavailable in this demo. Use Open demo workspace.')} className="text-blue-700 dark:text-blue-300">Reset access</button></div>
      {message && <p role="status" className="text-sm">{message}</p>}
      <button className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 font-medium text-white hover:bg-blue-700">Sign in to demo<ArrowRight size={16} /></button>
      <button type="button" onClick={() => navigate('/dashboard')} className="h-11 w-full rounded-md border border-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800">Open demo workspace</button>
    </form><div className="login-project"><p className="text-sm font-medium">Hybrid CNN breast cancer detection</p><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Frontend demonstration. Sign-in does not authenticate an account. Sample outputs do not represent clinical analysis.</p></div>
  </div></main>;
}
