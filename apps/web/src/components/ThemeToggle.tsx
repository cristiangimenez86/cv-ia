"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
};

/**
 * Renders nothing until mounted to avoid server/client markup mismatch (e.g. theme-dependent output).
 * Shows Moon (dark mode) / Sun (light mode) icon in a bordered button.
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  if (!mounted) {
    return (
      <span
        className={`header-btn-secondary ${className}`}
        aria-hidden
        style={{ visibility: "hidden" }}
      >
        <Sun className="h-4 w-4" />
      </span>
    );
  }

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`header-btn-secondary ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-foreground" />
      ) : (
        <Sun className="h-4 w-4 text-foreground" />
      )}
    </button>
  );
}
