import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Search, Sun, UserRound } from 'lucide-react';
export function TopNav({ onMenuClick, theme, onThemeToggle }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [profile, setProfile] = useState(false);
  const button = 'grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800';
  return <header className="sticky top-0 z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex min-h-16 items-center gap-2 px-4 md:px-6">
    <button onClick={onMenuClick} aria-label="Open navigation" title="Open navigation" className={`${button} lg:hidden`}><Menu size={20} /></button>
    <form className="relative min-w-0 max-w-xl flex-1" onSubmit={(event) => { event.preventDefault(); navigate(`/history?q=${encodeURIComponent(query)}`); }}><Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search patients or reports" placeholder="Search patients" className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-2 text-sm dark:border-slate-800 dark:bg-slate-950" /></form>
    <button onClick={onThemeToggle} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} title="Change theme" className={button}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
    <div className="relative"><button onClick={() => { setNotifications(!notifications); setProfile(false); }} aria-label="Notifications" aria-expanded={notifications} title="Notifications" className={button}><Bell size={20} /></button>{notifications && <div className="absolute right-0 top-14 w-60 rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900"><p className="font-semibold">Notifications</p><p className="mt-2 text-slate-600 dark:text-slate-300">No live notifications are available in this demo.</p></div>}</div>
    <div className="relative"><button onClick={() => { setProfile(!profile); setNotifications(false); }} aria-label="Account menu" aria-expanded={profile} title="Account" className={button}><UserRound size={20} /></button>{profile && <div className="absolute right-0 top-14 w-48 rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900"><p className="px-3 py-2 text-slate-600 dark:text-slate-300">Demo account</p><button onClick={() => { navigate('/settings'); setProfile(false); }} className="w-full px-3 py-2 text-left">Settings</button><button onClick={() => navigate('/')} className="w-full px-3 py-2 text-left">Sign out</button></div>}</div>
  </div></header>;
}
