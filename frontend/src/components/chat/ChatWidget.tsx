"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { ChatNudge } from "./ChatNudge";
import { CV_IA_CLOSE_CHAT_EVENT } from "./chatCloseEvents";
import type { ChatMessage } from "./types";

const VALID_LOCALES = new Set(["es", "en"]);

const FAB_ARIA: Record<string, { open: string; close: string }> = {
  es: { open: "Abrir chat con Cristian", close: "Cerrar chat" },
  en: { open: "Open chat with Cristian", close: "Close chat" },
};

/**
 * Global chat widget: FAB (bottom-right) that toggles a chat panel.
 * Render once in the root layout. Does not interfere with sticky header or grid.
 * Reads locale reactively from the URL so UI strings update on locale toggle.
 *
 * Features:
 * - "AI" badge on the FAB for discoverability.
 * - One-time nudge bubble after 4 s (session-scoped, desktop only).
 * - Click outside closes panel; messages persist when reopened.
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const pathname = usePathname();

  /* Extract locale from URL path (e.g. /es/... -> "es") */
  const segment = pathname?.split("/")[1] ?? "";
  const locale = VALID_LOCALES.has(segment) ? segment : "en";
  const fabAria = FAB_ARIA[locale] ?? FAB_ARIA.en;

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setNudgeDismissed(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  /* Top bar (z-50) sits above the chat backdrop (z-40); close when user interacts with the header. */
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = () => {
      setIsOpen(false);
    };
    window.addEventListener(CV_IA_CLOSE_CHAT_EVENT, handler);
    return () => window.removeEventListener(CV_IA_CLOSE_CHAT_EVENT, handler);
  }, [isOpen]);

  const openFromNudge = useCallback(() => {
    setIsOpen(true);
    setNudgeDismissed(true);
  }, []);

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop: light dim + subtle blur (strong blur + heavy scrim strains the eyes; see prefers-reduced-motion) */}
          <div
            className="fixed inset-0 z-40 bg-background/65 backdrop-blur-sm motion-reduce:backdrop-blur-none transition-opacity"
            onClick={close}
            aria-hidden
          />
          <ChatPanel
            onClose={close}
            locale={locale}
            messages={messages}
            setMessages={setMessages}
          />
        </>
      )}

      {/* Nudge bubble — once per session, desktop only, hidden when chat open */}
      {!isOpen && !nudgeDismissed && (
        <ChatNudge onOpenChat={openFromNudge} locale={locale} />
      )}

      {/* FAB — fixed bottom-right; hidden on mobile when chat open to avoid overlapping send button.
          Uses env(safe-area-inset-*) so the button stays clear of notches / rounded corners on
          devices that report them, with a 1rem fallback otherwise. */}
      <div
        className={`fixed z-50 ${isOpen ? "sm:block hidden" : ""}`}
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={toggle}
          aria-label={isOpen ? fabAria.close : fabAria.open}
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
