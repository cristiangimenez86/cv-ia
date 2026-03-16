"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import type { ChatMessage, ChatChip } from "./types";

type ChatPanelProps = {
  onClose: () => void;
  locale: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

/* ── Bilingual UI strings ────────────────────────────────────────────── */

const CHIPS: Record<string, ChatChip[]> = {
  es: [
    { label: "Experiencia en Azure", value: "Contame sobre tu experiencia en Azure" },
    { label: "Proyectos principales", value: "¿Cuáles son tus proyectos principales?" },
    { label: "Stack .NET", value: "¿Qué tecnologías .NET manejás?" },
    { label: "Disponibilidad", value: "¿Cuál es tu disponibilidad?" },
  ],
  en: [
    { label: "Azure experience", value: "Tell me about your Azure experience" },
    { label: "Main projects", value: "What are your main projects?" },
    { label: ".NET stack", value: "What .NET technologies do you use?" },
    { label: "Availability", value: "What is your availability?" },
  ],
};

const PLACEHOLDER: Record<string, string> = {
  es: "Escribí tu pregunta…",
  en: "Type your question…",
};

const HEADER_TITLE: Record<string, string> = {
  es: "Preguntale al CV",
  en: "Ask the CV",
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `msg-${nextId}-${Date.now()}`;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

async function requestChatCompletion(userText: string, locale: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lang: locale,
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    message?: { content?: string };
  };

  return payload.message?.content?.trim() || "No response content.";
}

/* ── Component ───────────────────────────────────────────────────────── */

/**
 * Chat panel: header, scrollable messages, input bar.
 * State is in-memory only (useState). Replies come from backend API.
 */
export function ChatPanel({ onClose, locale, messages, setMessages }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chips = CHIPS[locale] ?? CHIPS.en;
  const placeholder = PLACEHOLDER[locale] ?? PLACEHOLDER.en;
  const headerTitle = HEADER_TITLE[locale] ?? HEADER_TITLE.en;

  /* Focus input on mount */
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Escape key closes panel */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const reply = await requestChatCompletion(trimmed, locale);
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: reply,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const fallback =
          locale === "es"
            ? "No pude obtener respuesta del backend en este momento."
            : "I couldn't get a response from the backend right now.";
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: fallback,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        console.error(error);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, locale],
  );

  const handleSend = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleChipClick = useCallback(
    (value: string) => {
      sendMessage(value);
    },
    [sendMessage],
  );

  return (
    <div
      className="card flex flex-col overflow-hidden
        fixed z-50
        inset-3 max-h-[calc(100dvh-1.5rem)]
        sm:inset-auto sm:bottom-20 sm:right-4 sm:w-[380px] sm:h-[520px] sm:max-h-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {headerTitle}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <ChatMessageList
        messages={messages}
        chips={chips}
        onChipClick={handleChipClick}
        isLoading={isLoading}
      />

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isLoading}
        placeholder={placeholder}
        inputRef={inputRef}
      />
    </div>
  );
}
