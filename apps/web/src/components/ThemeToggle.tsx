"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type ThemeToggleProps = {
  className?: string;
};

/**
 * Renders nothing until mounted to avoid server/client markup mismatch (e.g. theme-dependent output).
 * No random/Date/Math; same null on server and first client render, then toggle after effect.
 */
export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  const current = theme === "system" ? resolvedTheme : theme;

  function toggle() {
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button type="button" onClick={toggle} className={className}>
      Theme: {current}
    </button>
  );
}
