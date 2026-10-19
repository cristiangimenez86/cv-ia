"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, isColorPalette, type ColorPalette } from "@/lib/color-palettes";

type PaletteContextValue = {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setCurrentPalette] = useState<ColorPalette>(DEFAULT_PALETTE);

  useEffect(() => {
    const initial = document.documentElement.dataset.palette;
    setCurrentPalette(isColorPalette(initial) ? initial : DEFAULT_PALETTE);

    function syncStorage(event: StorageEvent) {
      if (event.key !== PALETTE_STORAGE_KEY && event.key !== null) return;
      const next = isColorPalette(event.newValue) ? event.newValue : DEFAULT_PALETTE;
      document.documentElement.dataset.palette = next;
      setCurrentPalette(next);
    }

    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  const setPalette = useCallback((next: ColorPalette) => {
    document.documentElement.dataset.palette = next;
    setCurrentPalette(next);
    try {
      if (next === DEFAULT_PALETTE) window.localStorage.removeItem(PALETTE_STORAGE_KEY);
      else window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // Appearance changes still work when browser storage is unavailable.
    }
  }, []);

  return <PaletteContext.Provider value={{ palette, setPalette }}>{children}</PaletteContext.Provider>;
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context) throw new Error("usePalette must be used within PaletteProvider");
  return context;
}
