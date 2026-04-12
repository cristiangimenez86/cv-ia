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
  es: "Pregúntale a Cristian",
  en: "Ask Cristian",
};

const CLOSE_ARIA: Record<string, string> = {
  es: "Cerrar chat",
  en: "Close chat",
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `msg-${nextId}-${Date.now()}`;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const DIRECT_API_ACCESS_TOKEN = (
  process.env.NEXT_PUBLIC_API_ACCESS_TOKEN ?? ""
).trim();

/** Retries upstream 429 responses (often transient). */
const MAX_429_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get("retry-after");
  if (!raw) {
    return null;
  }
  const sec = Number.parseInt(raw, 10);
  if (!Number.isFinite(sec) || sec < 0) {
    return null;
  }
  return Math.min(sec * 1000, 60_000);
}

type ChatResult =
  | { ok: true; content: string }
  | { ok: false; status: number; apiMessage?: string; apiCode?: string };

function parseApiErrorBody(text: string): { message?: string; code?: string } {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const msg = j.message ?? j.Message;
    const code = j.code ?? j.Code;
    return {
      message: typeof msg === "string" ? msg : undefined,
      code: typeof code === "string" ? code : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Fetches chat completion without throwing on HTTP errors — avoids Next.js dev overlay
 * on expected failures (4xx/5xx). Retries 429 a few times with backoff.
 */
async function requestChatCompletion(userText: string, locale: string): Promise<ChatResult> {
  const url = API_BASE_URL
    ? `${API_BASE_URL}/api/v1/chat/completions`
    : "/api/v1/chat/completions";
  const body = JSON.stringify({
    lang: locale,
    messages: [{ role: "user", content: userText }],
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_BASE_URL && DIRECT_API_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${DIRECT_API_ACCESS_TOKEN}`;
  }

  let attempt = 0;

  while (true) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });
    } catch {
      return { ok: false, status: 0 };
    }

    if (response.ok) {
      try {
        const payload = (await response.json()) as {
          message?: { content?: string };
        };
        const content = payload.message?.content?.trim() || "No response content.";
        return { ok: true, content };
      } catch {
        return { ok: false, status: 502 };
      }
    }

    if (response.status === 429 && attempt < MAX_429_RETRIES) {
      const waitMs = retryAfterMs(response) ?? 1500 * (attempt + 1);
      await sleep(waitMs);
      attempt += 1;
      continue;
    }

    const errText = await response.text();
    const { message: apiMessage, code: apiCode } = parseApiErrorBody(errText);
    return { ok: false, status: response.status, apiMessage, apiCode };
  }
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
  /** Previous `isLoading` — used to detect true → false (request finished). */
  const wasLoadingRef = useRef(false);

  const chips = CHIPS[locale] ?? CHIPS.en;
  const placeholder = PLACEHOLDER[locale] ?? PLACEHOLDER.en;
  const headerTitle = HEADER_TITLE[locale] ?? HEADER_TITLE.en;
  const closeAria = CLOSE_ARIA[locale] ?? CLOSE_ARIA.en;

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

  /* After the assistant finishes (loading ends), focus the textarea — `finally` ran while input was still disabled. */
  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = isLoading;
    if (wasLoading && !isLoading) {
      const id = requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isLoading]);

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
        const result = await requestChatCompletion(trimmed, locale);

        if (result.ok) {
          const assistantMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: result.content,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const status = result.status;
          const detail = result.apiMessage?.trim();
          let fallback: string;
          if (detail) {
            const hintEs =
              result.apiCode === "provider_auth"
                ? " Revisá la API key y la facturación en el panel del proveedor."
                : result.apiCode === "rate_limited"
                  ? " Esperá un momento o revisá límites/cuota del proveedor."
                  : result.apiCode === "provider_forbidden"
                    ? " La clave restringida debe permitir el modelo configurado en el backend (p. ej. gpt-4o-mini) o usá una clave con permisos All."
                    : "";
            const hintEn =
              result.apiCode === "provider_auth"
                ? " Check your API key and billing in the provider dashboard."
                : result.apiCode === "rate_limited"
                  ? " Wait a moment or check usage limits with the provider."
                  : result.apiCode === "provider_forbidden"
                    ? " Allow the backend model (e.g. gpt-4o-mini) on this restricted key, or use a key with All permissions."
                    : "";
            fallback =
              locale === "es"
                ? `${detail}${hintEs}`
                : `${detail}${hintEn}`;
          } else if (status === 429) {
            fallback =
              locale === "es"
                ? "Límite de uso alcanzado (demasiadas solicitudes). Probá de nuevo en un momento."
                : "Rate limit reached. Please try again in a moment.";
          } else if (status >= 500) {
            fallback =
              locale === "es"
                ? "El servidor respondió con error. Revisá que el backend esté en marcha, la API key del proveedor y la facturación (crédito > $0)."
                : "The server returned an error. Check that the backend is running, your provider API key, and billing (credit balance).";
          } else if (status === 0) {
            fallback =
              locale === "es"
                ? "No pude conectar con el backend. ¿Está corriendo en el puerto 8080? Reiniciá el front si cambiaste .env.local."
                : "Couldn't reach the backend. Is it running on port 8080? Restart the dev server if you changed .env.local.";
          } else if (status === 403) {
            fallback =
              locale === "es"
                ? "El proveedor rechazó la solicitud (permisos). Revisá la clave restringida y el modelo en la configuración del backend, o usá una clave con permisos All."
                : "The provider rejected the request (permissions). Check your restricted key and the backend chat model setting, or use a key with All permissions.";
          } else if (status === 401) {
            fallback =
              locale === "es"
                ? "No autorizado para usar el API (token de acceso). Revisá la configuración del sitio o del backend."
                : "Not authorized to call the API (access token). Check site or backend configuration.";
          } else {
            fallback =
              locale === "es"
                ? "No se pudo completar el chat. Revisá la consola o probá de nuevo."
                : "Could not complete the chat. Check the console or try again.";
          }
          const assistantMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: fallback,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } finally {
        setIsLoading(false);
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
        sm:inset-auto sm:bottom-20 sm:right-4
        sm:w-[min(600px,calc(100vw-2rem))] sm:h-[min(700px,calc(100dvh-5rem))] sm:max-h-none
        md:w-[600px] md:h-[min(700px,calc(100dvh-5rem))]"
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
          aria-label={closeAria}
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
        locale={locale}
        onClose={onClose}
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
