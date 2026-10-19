export type FaviconColors = {
  accent: string;
  line: string;
  gradientStart: string;
  gradientEnd: string;
  glyph: string;
};

export const DEFAULT_FAVICON_COLORS: FaviconColors = {
  accent: "#e5bc82",
  line: "#403e34",
  gradientStart: "#65482b",
  gradientEnd: "#22221d",
  glyph: "#f3d7ab",
};

function mixHex(first: string, second: string, weight: number) {
  return "#" + [1, 3, 5].map((offset) => {
    const value = Math.round(parseInt(first.slice(offset, offset + 2), 16) * weight
      + parseInt(second.slice(offset, offset + 2), 16) * (1 - weight));
    return value.toString(16).padStart(2, "0");
  }).join("");
}

export function createFaviconSvg(colors: Partial<FaviconColors> = DEFAULT_FAVICON_COLORS) {
  const color = (key: keyof FaviconColors) => {
    const value = colors[key];
    if (value && /^#[\da-f]{3}$/i.test(value)) {
      return "#" + value.slice(1).split("").map((digit) => digit + digit).join("");
    }
    return value && /^#[\da-f]{6}$/i.test(value) ? value : DEFAULT_FAVICON_COLORS[key];
  };
  const border = mixHex(color("accent"), color("line"), 0.45);

  // Same Code2 / CodeXml geometry as the header, with a slightly heavier stroke at tab sizes.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs><linearGradient id="background" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="${color("gradientStart")}"/><stop offset="1" stop-color="${color("gradientEnd")}"/></linearGradient></defs>
  <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="17" fill="url(#background)" stroke="${border}" stroke-width="1.5"/>
  <g transform="translate(14 14) scale(1.5)" fill="none" stroke="${color("glyph")}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
  </g>
</svg>`;
}
