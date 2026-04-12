"use client";

import type { ReactNode } from "react";
import { CV_IA_CLOSE_CHAT_EVENT } from "@/components/chat/chatCloseEvents";

type Props = {
  className?: string;
  children: ReactNode;
};

/**
 * Client wrapper: header sits above the chat backdrop (z-50 vs z-40), so pointer events here
 * must explicitly request chat close; child controls (nav, PDF, locale, theme) still run after.
 */
export function HeaderInteractiveChrome({ className, children }: Props) {
  return (
    <header
      className={className}
      onPointerDownCapture={() => {
        window.dispatchEvent(new CustomEvent(CV_IA_CLOSE_CHAT_EVENT));
      }}
    >
      {children}
    </header>
  );
}
