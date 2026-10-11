import { useSyncExternalStore } from "react";
const listeners = new Set();
const getTheme = () => localStorage.getItem("theme") || "light";
function setTheme(value) {
  localStorage.setItem("theme", value);
  document.documentElement.classList.toggle("dark", value === "dark");
  listeners.forEach((listener) => listener());
}
function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  return { theme, isDark:theme === "dark", setTheme, toggleTheme:() => setTheme(getTheme() === "dark" ? "light" : "dark") };
}
