"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "cv_chat_nudge_seen";
const DELAY_MS = 4000;

type ChatNudgeProps = {
  onOpenChat: () => void;
  locale: string;
};

const TEXTS: Record<string, { message: string; cta: string }> = {
  es: {
    message: "¿Quieres un resumen rápido de mi perfil?",
    cta: "Abrir chat",
  },
  en: {
    message: "Want a quick overview of my profile?",
    cta: "Open chat",
  },
};

/**
 * One-time nudge bubble next to the FAB.
 * Shows after DELAY_MS, only once per session (sessionStorage).
 * Hidden on viewports < 640px (sm breakpoint).
 */
export function ChatNudge({ onOpenChat, locale }: ChatNudgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Skip if already seen this session */
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const handleOpen = () => {
    dismiss();
    onOpenChat();
  };

  if (!visible) return null;

  const t = TEXTS[locale] ?? TEXTS.en;

  return (
    /* Hidden on mobile (< sm); positioned to the left of the FAB */
    <div className="hidden sm:flex fixed bottom-5 right-18 z-50 items-end animate-in">
      <div className="card px-4 py-3 max-w-[240px] shadow-lg">
        <div className="flex items-start gap-2">
          <p className="text-sm text-foreground leading-snug flex-1">
            {t.message}
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={handleOpen}
          className="mt-2 text-xs font-semibold text-primary hover:underline"
        >
          {t.cta}
        </button>
      </div>
      {/* Arrow pointing right toward FAB */}
      <div
        className="w-2 h-2 bg-surface border-r border-b border-border rotate-[-45deg] -mr-1 mb-4 shrink-0"
        aria-hidden
      />
    </div>
  );
}
