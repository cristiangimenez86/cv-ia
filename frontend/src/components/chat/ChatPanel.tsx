"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useChatMobileVisualViewport } from "./useChatMobileVisualViewport";
import { getChatPanelStrings } from "./chatStrings";
import { createMessageId } from "./messageId";
import { formatChatError } from "./chatErrorMessage";
import { requestChatCompletion } from "@/lib/chat/chatClient";
import type { ChatMessage } from "./types";

type ChatPanelProps = {
  onClose: () => void;
  onNavigate: () => void;
  locale: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

const CHAT_WIDTH_STORAGE_KEY = "cv-ia-chat-width";
const DEFAULT_CHAT_WIDTH = 430;
const MIN_CHAT_WIDTH = 340;
const MAX_CHAT_WIDTH = 960;

function maxChatWidth() {
  return Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, window.innerWidth - 64));
}

function clampChatWidth(width: number) {
  return Math.max(MIN_CHAT_WIDTH, Math.min(width, maxChatWidth()));
}

/** Shape of `assistantMessage()` output — the boilerplate for an assistant bubble. */
function assistantMessage(content: string): ChatMessage {
  return {
    id: createMessageId(),
    role: "assistant",
    content,
    createdAt: new Date(),
  };
}

function userMessage(content: string): ChatMessage {
  return {
    id: createMessageId(),
    role: "user",
    content,
    createdAt: new Date(),
  };
}

/**
 * Chat panel: header, scrollable messages, input bar.
 * State is in-memory only (useState). Replies come from the backend API.
 */
export function ChatPanel({ onClose, onNavigate, locale, messages, setMessages }: ChatPanelProps) {
  const mobileVv = useChatMobileVisualViewport();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [availableWidth, setAvailableWidth] = useState(MAX_CHAT_WIDTH);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ pointerId: number; startX: number; startWidth: number; width: number } | null>(null);

  const ui = getChatPanelStrings(locale);

  useFocusOnMount(inputRef);
  useFocusAfterReply(inputRef, isLoading);
  useGreetingSeed(ui.greeting, setMessages);
  useEscapeToClose(onClose);

  useLayoutEffect(() => {
    const syncWidth = () => {
      setAvailableWidth(maxChatWidth());
      setPanelWidth((width) => clampChatWidth(width));
    };

    try {
      const savedWidth = Number(window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY));
      if (Number.isFinite(savedWidth) && savedWidth >= MIN_CHAT_WIDTH) {
        setPanelWidth(clampChatWidth(savedWidth));
      }
    } catch {
      // Resizing still works when browser storage is unavailable.
    }

    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => {
      window.removeEventListener("resize", syncWidth);
      document.documentElement.classList.remove("cv-chat-resizing");
    };
  }, []);

  function saveWidth(width: number) {
    const nextWidth = clampChatWidth(width);
    setPanelWidth(nextWidth);
    try {
      window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(nextWidth));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || window.matchMedia("(max-width: 760px)").matches) return;
    event.preventDefault();
    const startWidth = panelRef.current?.getBoundingClientRect().width ?? panelWidth;
    resizeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth,
      width: startWidth,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.classList.add("cv-chat-resizing");
  }

  function moveResize(event: React.PointerEvent<HTMLDivElement>) {
    const drag = resizeRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.width = clampChatWidth(drag.startWidth + drag.startX - event.clientX);
    setPanelWidth(drag.width);
  }

  function finishResize(event: React.PointerEvent<HTMLDivElement>) {
    const drag = resizeRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    document.documentElement.classList.remove("cv-chat-resizing");
    saveWidth(drag.width);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resizeWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 40 : 16;
    const nextWidth = event.key === "ArrowLeft" ? panelWidth + step
      : event.key === "ArrowRight" ? panelWidth - step
      : event.key === "Home" ? MIN_CHAT_WIDTH
      : event.key === "End" ? maxChatWidth()
      : null;
    if (nextWidth === null) return;
    event.preventDefault();
    saveWidth(nextWidth);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [...prev, userMessage(trimmed)]);
      setInput("");

      setIsLoading(true);
      try {
        const result = await requestChatCompletion(trimmed, locale);
        const content = result.ok ? result.content : formatChatError(result, locale);
        setMessages((prev) => [...prev, assistantMessage(content)]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, locale, setMessages],
  );

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const useVvLayout = mobileVv !== null;

  return (
    <div
      id="cv-chat-panel"
      role="dialog"
      aria-modal="true"
      aria-label={ui.headerTitle}
      ref={panelRef}
      className="cv-chat-panel fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
      style={{
        "--cv-chat-width": `${panelWidth}px`,
        ...(useVvLayout ? { top: mobileVv.top, height: mobileVv.height, maxHeight: mobileVv.height } : {}),
      } as React.CSSProperties}
    >
      <div
        className="cv-chat-resize-handle"
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={locale === "es" ? "Ajustar ancho del chat" : "Resize chat width"}
        aria-valuemin={MIN_CHAT_WIDTH}
        aria-valuemax={availableWidth}
        aria-valuenow={panelWidth}
        title={locale === "es" ? "Arrastrá para ajustar el ancho" : "Drag to resize width"}
        onPointerDown={startResize}
        onPointerMove={moveResize}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={finishResize}
        onKeyDown={resizeWithKeyboard}
      />
      <ChatPanelHeader
        title={ui.headerTitle}
        closeAria={ui.closeAria}
        onClose={onClose}
      />

      <ChatMessageList
        messages={messages}
        chips={ui.chips}
        onChipClick={sendMessage}
        isLoading={isLoading}
        mobileViewportHeight={mobileVv?.height}
        locale={locale}
        onNavigate={onNavigate}
      />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isLoading}
        placeholder={ui.placeholder}
        inputRef={inputRef}
      />
    </div>
  );
}

/* ── Subcomponents ───────────────────────────────────────────────────── */

type ChatPanelHeaderProps = {
  title: string;
  closeAria: string;
  onClose: () => void;
};

function ChatPanelHeader({
  title,
  closeAria,
  onClose,
}: ChatPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeAria}
          className="cv-chat-close inline-flex h-10 w-10 items-center justify-center"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}

/* ── Hooks (panel-private) ───────────────────────────────────────────── */

function useFocusOnMount(ref: React.RefObject<HTMLTextAreaElement | null>) {
  useEffect(() => {
    const timer = setTimeout(() => ref.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [ref]);
}

/**
 * After a reply lands (loading flips true → false), restore focus to the
 * textarea on the next animation frame, since `finally` ran while the input
 * was still disabled.
 */
function useFocusAfterReply(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  isLoading: boolean,
) {
  const wasLoading = useRef(false);
  useEffect(() => {
    const previously = wasLoading.current;
    wasLoading.current = isLoading;
    if (previously && !isLoading) {
      const id = requestAnimationFrame(() => {
        ref.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isLoading, ref]);
}

function useEscapeToClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}

/** Seed one neutral greeting and translate it while it is the only message. */
function useGreetingSeed(
  greeting: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) {
  useEffect(() => {
    setMessages((previous) => {
      if (previous.length === 0) return [assistantMessage(greeting)];
      if (previous.length === 1 && previous[0].role === "assistant" && previous[0].content !== greeting) {
        return [{ ...previous[0], content: greeting }];
      }
      return previous;
    });
  }, [greeting, setMessages]);
}
