"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./Icon";

type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** Switches between dark and light and remembers the choice; the initial value is set before paint in layout.tsx. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // storage can be blocked; the theme then lasts for this page view only
    }
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} suppressHydrationWarning>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
