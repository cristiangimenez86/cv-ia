"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { ChatNudge } from "./ChatNudge";

const VALID_LOCALES = new Set(["es", "en"]);

/**
 * Global chat widget: FAB (bottom-right) that toggles a chat panel.
 * Render once in the root layout. Does not interfere with sticky header or grid.
 * Reads locale reactively from the URL so UI strings update on locale toggle.
 *
 * Features:
 * - "AI" badge on the FAB for discoverability.
 * - One-time nudge bubble after 4 s (session-scoped, desktop only).
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const pathname = usePathname();

  /* Extract locale from URL path (e.g. /es/... -> "es") */
  const segment = pathname?.split("/")[1] ?? "";
  const locale = VALID_LOCALES.has(segment) ? segment : "en";

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setNudgeDismissed(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const openFromNudge = useCallback(() => {
    setIsOpen(true);
    setNudgeDismissed(true);
  }, []);

  return (
    <>
      {isOpen && <ChatPanel onClose={close} locale={locale} />}

      {/* Nudge bubble — once per session, desktop only, hidden when chat open */}
      {!isOpen && !nudgeDismissed && (
        <ChatNudge onOpenChat={openFromNudge} locale={locale} />
      )}

      {/* FAB — fixed bottom-right, above content */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggle}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          className="profile-card-btn profile-card-btn-primary relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}

          {/* "AI" badge — top-right corner of the FAB */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-primary border border-border shadow-sm px-1">
              AI
            </span>
          )}
        </button>
      </div>
    </>
  );
}
