"use client";

import type { ReactNode } from "react";
import { CV_IA_CLOSE_CHAT_EVENT, type ChatCloseEventDetail } from "@/components/chat/chatCloseEvents";

type Props = {
  className?: string;
  children: ReactNode;
};

/**
 * Client wrapper: header sits above the chat backdrop (z-50 vs z-40), so clicks here
 * explicitly request chat close; child controls (nav, PDF, locale, theme) still run after.
 */
export function HeaderInteractiveChrome({ className, children }: Props) {
  return (
    <header
      className={className}
      onClickCapture={(event) => {
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
        const willNavigate = link !== null && link.target !== "_blank" && !link.hasAttribute("download");
        window.dispatchEvent(new CustomEvent<ChatCloseEventDetail>(CV_IA_CLOSE_CHAT_EVENT, { detail: { willNavigate } }));
      }}
    >
      {children}
    </header>
  );
}
