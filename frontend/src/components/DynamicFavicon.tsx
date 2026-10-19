"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePalette } from "@/components/PaletteProvider";
import { createFaviconSvg } from "@/lib/favicon";

const FALLBACK_ICON = "/favicon.ico?v=code";

export function DynamicFavicon() {
  const { palette } = usePalette();
  const { resolvedTheme } = useTheme();
  const [href, setHref] = useState(FALLBACK_ICON);

  useEffect(() => {
    // Read after next-themes has applied its HTML class so the icon uses the new tokens.
    const frame = window.requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement);
      const token = (name: string) => style.getPropertyValue(name).trim();
      const svg = createFaviconSvg({
        accent: token("--accent-hex"),
        line: token("--line"),
        gradientStart: token("--accent-dark"),
        gradientEnd: token("--surface-hex"),
        glyph: token("--accent-soft"),
      });
      setHref(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [palette, resolvedTheme]);

  return <link id="cv-favicon" rel="icon" href={href} type={href === FALLBACK_ICON ? "image/x-icon" : "image/svg+xml"} sizes="any" />;
}
