"use client";

import { useLayoutEffect, useState } from "react";

/** Tailwind `sm` is 640px — panel uses full-screen layout below this width. */
const MAX_MOBILE_PANEL_PX = 639;
/** Matches `inset-3` (0.75rem) on the chat panel. */
const EDGE_PX = 12;
/** Minimum height so header + a bit of scroll + input stay usable. */
const MIN_PANEL_HEIGHT_PX = 200;

export type ChatMobileVisualViewportLayout = { top: number; height: number };

/**
 * Below `sm`, sizes the chat panel to `visualViewport` so the on-screen keyboard leaves
 * messages and input visible (Android Chrome / iOS Safari).
 */
export function useChatMobileVisualViewport(): ChatMobileVisualViewportLayout | null {
  const [layout, setLayout] = useState<ChatMobileVisualViewportLayout | null>(null);

  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      return;
    }

    const mm = window.matchMedia(`(max-width: ${MAX_MOBILE_PANEL_PX}px)`);

    const sync = () => {
      if (!mm.matches) {
        setLayout(null);
        return;
      }
      const height = Math.max(MIN_PANEL_HEIGHT_PX, vv.height - EDGE_PX * 2);
      const top = vv.offsetTop + EDGE_PX;
      setLayout({ top, height });
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    mm.addEventListener("change", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      mm.removeEventListener("change", sync);
    };
  }, []);

  return layout;
}
