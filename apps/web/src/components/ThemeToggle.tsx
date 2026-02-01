"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const current = theme === "system" ? resolvedTheme : theme;

  function toggle() {
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button type="button" onClick={toggle}>
      Theme: {current}
    </button>
  );
}
