"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Moon, RotateCcw, Sun } from "lucide-react";
import { usePalette } from "@/components/PaletteProvider";
import { COLOR_PALETTES, DEFAULT_PALETTE, type ColorPalette } from "@/lib/color-palettes";
import type { Locale } from "@/lib/content/types";

type Props = { locale: Locale };

export function ThemeToggle({ locale }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const es = locale === "es";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(mountTimer);
      if (timer.current) {
        clearTimeout(timer.current);
        document.documentElement.classList.remove("theme-transition");
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>("input:checked")?.focus();

    function closeOutside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function transitionAppearance() {
    document.documentElement.classList.add("theme-transition");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
      timer.current = null;
    }, 350);
  }

  function chooseTheme(choice: "dark" | "light") {
    transitionAppearance();
    setTheme(choice);
  }

  function choosePalette(choice: ColorPalette) {
    transitionAppearance();
    setPalette(choice);
  }

  function resetAppearance() {
    choosePalette(DEFAULT_PALETTE);
    setTheme("dark");
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="cv-appearance" ref={root}>
      <div className="cv-theme-switch" role="group" aria-label={es ? "Apariencia" : "Appearance"}>
        {(["dark", "light"] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => chooseTheme(choice)}
            aria-pressed={mounted ? resolvedTheme === choice : undefined}
            aria-label={es ? (choice === "dark" ? "Tema oscuro" : "Tema claro") : (choice === "dark" ? "Dark theme" : "Light theme")}
            title={es ? (choice === "dark" ? "Tema oscuro" : "Tema claro") : (choice === "dark" ? "Dark theme" : "Light theme")}
            className={mounted && resolvedTheme === choice ? "is-active" : ""}
          >
            {choice === "dark" ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
          </button>
        ))}
        <button
          ref={trigger}
          type="button"
          className="cv-palette-trigger"
          onClick={() => setOpen((value) => !value)}
          aria-label={es ? "Personalizar apariencia" : "Customize appearance"}
          title={es ? "Personalizar apariencia" : "Customize appearance"}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
        >
          <ChevronDown size={14} aria-hidden className={open ? "is-open" : ""} />
        </button>
      </div>
      {open && (
        <div ref={panel} id={panelId} className="cv-palette-popover" role="dialog" aria-labelledby={`${panelId}-title`}>
          <fieldset className="cv-palette-options">
            <legend id={`${panelId}-title`}>{es ? "Color de acento" : "Accent color"}</legend>
            {COLOR_PALETTES.map((option) => (
              <label key={option.id} className={`cv-palette-option${palette === option.id ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name={`${panelId}-palette`}
                  className="cv-palette-radio"
                  value={option.id}
                  checked={palette === option.id}
                  onChange={() => choosePalette(option.id)}
                />
                <span className="cv-palette-swatch" aria-hidden style={{ "--palette-light": option.light, "--palette-dark": option.dark } as CSSProperties} />
                <span className="cv-palette-name">{option.name[locale]}</span>
                {option.id === DEFAULT_PALETTE && <span className="cv-palette-default">{es ? "Predeterminado" : "Default"}</span>}
                {palette === option.id && <Check size={15} aria-hidden className="cv-palette-check" />}
              </label>
            ))}
          </fieldset>
          <button className="cv-palette-reset" type="button" onClick={resetAppearance}>
            <RotateCcw size={14} aria-hidden />{es ? "Restablecer apariencia" : "Reset appearance"}
          </button>
        </div>
      )}
    </div>
  );
}
