"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { CV_IA_CLOSE_CHAT_EVENT } from "./chatCloseEvents";
import type { ChatMessage } from "./types";

const VALID_LOCALES = new Set(["es", "en"]);

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
  const pathname = usePathname();

  /* Extract locale from URL path (e.g. /es/... -> "es") */
  const segment = pathname?.split("/")[1] ?? "";
  const locale = VALID_LOCALES.has(segment) ? segment : "en";
  const fabAria = FAB_ARIA[locale] ?? FAB_ARIA.en;

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
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
            locale={locale}
            messages={messages}
            setMessages={setMessages}
          />
        </>
      )}

      {!isOpen && (
        <button
          onClick={toggle}
          aria-label={fabAria.open}
          aria-expanded={false}
          aria-controls="cv-chat-panel"
          className="cv-chat-trigger"
        >
          <span className="spark"><Sparkles size={17} aria-hidden /></span>
          {locale === "es" ? "Preguntá sobre mi perfil" : "Ask about my profile"}
        </button>
      )}
    </>
  );
}
