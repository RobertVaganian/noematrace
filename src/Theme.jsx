import { createContext, useContext, useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@phosphor-icons/react";

const ThemeContext = createContext(null);
const preferenceKey = "noematrace.theme";
const validTheme = (value) => (value === "light" ? "light" : "dark");

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    validTheme(document.documentElement.dataset.theme),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const sync = (event) => {
      if (event.key === preferenceKey || event.key === null)
        setTheme(validTheme(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(preferenceKey, next);
    } catch {
      /* Session choice still works when storage is unavailable. */
    }
  };
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
  const Icon = theme === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle-icon" key={theme} aria-hidden="true"><Icon size={20} /></span>
    </button>
  );
}
