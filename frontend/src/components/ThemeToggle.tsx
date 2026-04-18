"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
};

/** ms during which the global theme transition rule is active. Slightly above
 *  the 0.3s transition duration so the animation has time to complete. */
const THEME_TRANSITION_DURATION_MS = 350;

/**
 * Renders nothing until mounted to avoid server/client markup mismatch (e.g. theme-dependent output).
 * Shows Moon (dark mode) / Sun (light mode) icon in a bordered button.
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themeTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (themeTransitionTimer.current) {
        clearTimeout(themeTransitionTimer.current);
      }
    };
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
    /* Scope the cross-theme color transition: add `.theme-transition` to <html>
       only for the duration of the toggle so hover/scroll interactions are
       not animated by it. See globals.css `html.theme-transition`. */
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.add("theme-transition");
      if (themeTransitionTimer.current) {
        clearTimeout(themeTransitionTimer.current);
      }
      themeTransitionTimer.current = setTimeout(() => {
        root.classList.remove("theme-transition");
        themeTransitionTimer.current = null;
      }, THEME_TRANSITION_DURATION_MS);
    }
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
