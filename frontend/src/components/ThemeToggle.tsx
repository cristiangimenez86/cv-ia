"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/content/types";

type Props = { locale: Locale };

export function ThemeToggle({ locale }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(mountTimer);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function chooseTheme(choice: "dark" | "light") {
    document.documentElement.classList.add("theme-transition");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => document.documentElement.classList.remove("theme-transition"), 350);
    setTheme(choice);
  }

  return (
    <div className="cv-theme-switch" role="group" aria-label={locale === "es" ? "Tema de color" : "Color theme"}>
      {(["dark", "light"] as const).map((choice) => (
        <button
          key={choice}
          type="button"
          onClick={() => chooseTheme(choice)}
          aria-pressed={mounted ? resolvedTheme === choice : undefined}
          aria-label={locale === "es" ? (choice === "dark" ? "Tema oscuro" : "Tema claro") : (choice === "dark" ? "Dark theme" : "Light theme")}
          title={locale === "es" ? (choice === "dark" ? "Tema oscuro" : "Tema claro") : (choice === "dark" ? "Dark theme" : "Light theme")}
          className={mounted && resolvedTheme === choice ? "is-active" : ""}
        >
          {choice === "dark" ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
        </button>
      ))}
    </div>
  );
}
