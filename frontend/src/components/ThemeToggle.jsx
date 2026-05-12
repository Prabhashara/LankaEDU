import { useEffect, useState } from "react";

const storageKey = "onlineExam.theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(storageKey);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    function handleExternalTheme(event) {
      const nextTheme = event.detail?.theme;
      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
      }
    }

    window.addEventListener("online-exam:set-theme", handleExternalTheme);
    return () => window.removeEventListener("online-exam:set-theme", handleExternalTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(storageKey, theme);
    window.dispatchEvent(new CustomEvent("online-exam:theme-change", { detail: { theme } }));
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">{isDark ? "☀️" : "🌙"}</span>
      </span>
      <span className="theme-toggle-text">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
