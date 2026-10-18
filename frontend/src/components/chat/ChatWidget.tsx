"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { CV_IA_CLOSE_CHAT_EVENT, type ChatCloseEventDetail } from "./chatCloseEvents";
import type { ChatMessage } from "./types";

const VALID_LOCALES = new Set(["es", "en"]);
const CHAT_HISTORY_KEY = "__cvIaChat";

function currentUrl() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function isChatHistoryEntry() {
  const state = window.history.state as Record<string, unknown> | null;
  return state !== null && typeof state === "object" && state[CHAT_HISTORY_KEY] === currentUrl();
}

const FAB_ARIA: Record<string, { open: string; close: string }> = {
  es: { open: "Abrir chat con Cristian", close: "Cerrar chat" },
  en: { open: "Open chat with Cristian", close: "Close chat" },
};

/**
 * Global chat trigger that opens the chat drawer on request.
 * Render once in the root layout.
 * Reads locale reactively from the URL so UI strings update on locale toggle.
 *
 * Click outside closes the drawer; messages persist when reopened.
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const closingHistoryRef = useRef(false);
  const pathname = usePathname();

  /* Extract locale from URL path (e.g. /es/... -> "es") */
  const segment = pathname?.split("/")[1] ?? "";
  const locale = VALID_LOCALES.has(segment) ? segment : "en";
  const fabAria = FAB_ARIA[locale] ?? FAB_ARIA.en;

  useEffect(() => {
    // Remove names saved by the retired personalization flow.
    try {
      window.localStorage.removeItem("cv-ia:visitor-name");
    } catch {
      // The chat remains usable when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const syncWithHistory = () => {
      closingHistoryRef.current = false;
      setIsOpen(isChatHistoryEntry());
    };
    syncWithHistory();
    window.addEventListener("popstate", syncWithHistory);
    return () => window.removeEventListener("popstate", syncWithHistory);
  }, []);

  const open = useCallback(() => {
    closingHistoryRef.current = false;
    if (!isChatHistoryEntry()) {
      // Give browser Back a same-page entry to return to while closing the chat.
      const state = window.history.state;
      window.history.pushState(
        { ...(state && typeof state === "object" ? state : {}), [CHAT_HISTORY_KEY]: currentUrl() },
        "",
        window.location.href,
      );
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (closingHistoryRef.current) return;
    setIsOpen(false);
    if (isChatHistoryEntry()) {
      closingHistoryRef.current = true;
      window.history.back();
    }
  }, []);

  const dismissForNavigation = useCallback(() => setIsOpen(false), []);

  /* Top bar (z-50) sits above the chat backdrop (z-40); close when user interacts with the header. */
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ChatCloseEventDetail>).detail;
      if (detail?.willNavigate) dismissForNavigation();
      else close();
    };
    window.addEventListener(CV_IA_CLOSE_CHAT_EVENT, handler);
    return () => window.removeEventListener(CV_IA_CLOSE_CHAT_EVENT, handler);
  }, [isOpen, close, dismissForNavigation]);

  return (
    <>
      {isOpen && (
        <>
          {/* The backdrop fades in with the drawer and keeps outside clicks dismissible. */}
          <div
            className="cv-chat-backdrop fixed inset-0 z-40"
            onClick={close}
            aria-hidden
          />
          <ChatPanel
            onClose={close}
            onNavigate={dismissForNavigation}
            locale={locale}
            messages={messages}
            setMessages={setMessages}
          />
        </>
      )}

      {!isOpen && (
        <button
          onClick={open}
          aria-label={fabAria.open}
          aria-expanded={false}
          aria-controls="cv-chat-panel"
          className="cv-chat-trigger"
        >
          <MessageCircle className="chat-icon" size={19} strokeWidth={1.8} aria-hidden />
          {locale === "es" ? "Preguntá sobre mi perfil" : "Ask about my profile"}
        </button>
      )}
    </>
  );
}
