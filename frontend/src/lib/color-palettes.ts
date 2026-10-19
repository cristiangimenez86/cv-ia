export const COLOR_PALETTES = [
  { id: "cobre", name: { es: "Cobre", en: "Copper" }, light: "#946436", dark: "#e5bc82" },
  { id: "bosque", name: { es: "Bosque", en: "Forest" }, light: "#276749", dark: "#88c7a2" },
  { id: "oceano", name: { es: "Océano", en: "Ocean" }, light: "#2b5f93", dark: "#8ab9ed" },
  { id: "ciruela", name: { es: "Ciruela", en: "Plum" }, light: "#7b4d83", dark: "#c6a1d4" },
  { id: "grafito", name: { es: "Grafito", en: "Graphite" }, light: "#52525b", dark: "#b8b8c4" },
] as const;

export type ColorPalette = (typeof COLOR_PALETTES)[number]["id"];
export const DEFAULT_PALETTE: ColorPalette = "cobre";
export const PALETTE_STORAGE_KEY = "cv.palette";

export function isColorPalette(value: unknown): value is ColorPalette {
  return COLOR_PALETTES.some((palette) => palette.id === value);
}

// Run before the page paints so a saved palette is already active on reload.
export const PALETTE_BOOTSTRAP_SCRIPT = `(()=>{try{const p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});document.documentElement.dataset.palette=${JSON.stringify(COLOR_PALETTES.map(({ id }) => id))}.includes(p)?p:${JSON.stringify(DEFAULT_PALETTE)}}catch{document.documentElement.dataset.palette=${JSON.stringify(DEFAULT_PALETTE)}}})();`;
