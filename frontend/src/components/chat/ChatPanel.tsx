"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, UserX, X } from "lucide-react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useChatMobileVisualViewport } from "./useChatMobileVisualViewport";
import { useVisitorName, type UseVisitorNameResult } from "./useVisitorName";
import { detectOptOut, extractBareName } from "./renameDetection";
import { formatWithName, getVisitorNameStrings } from "./visitorNameStrings";
import { getChatPanelStrings } from "./chatStrings";
import { createMessageId } from "./messageId";
import { formatChatError } from "./chatErrorMessage";
import { requestChatCompletion } from "@/lib/chat/chatClient";
import type { ChatMessage } from "./types";

type ChatPanelProps = {
  onClose: () => void;
  locale: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

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
export function ChatPanel({ onClose, locale, messages, setMessages }: ChatPanelProps) {
  const mobileVv = useChatMobileVisualViewport();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const visitor = useVisitorName();
  const visitorStrings = getVisitorNameStrings(locale);
  const ui = getChatPanelStrings(locale);

  /* Never disable the input for the name prompt: the name flow is conversational,
     so the visitor must always be able to reply (with a name, an opt-out phrase,
     or any other message). */
  const inputDisabled = isLoading;

  useFocusOnMount(inputRef);
  useFocusAfterReply(inputRef, isLoading);
  useGreetingSeed({ visitor, visitorStrings, messages, setMessages });
  useEscapeToClose(onClose);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setMessages((prev) => [...prev, userMessage(trimmed)]);
      setInput("");

      const renameLocale: "es" | "en" = locale === "es" ? "es" : "en";

      const handled = handleNameFlow({
        text: trimmed,
        renameLocale,
        visitor,
        visitorStrings,
        appendAssistant: (content) =>
          setMessages((prev) => [...prev, assistantMessage(content)]),
      });
      if (handled === "consumed") {
        /* The user message was about the name itself: nothing to forward. */
        return;
      }

      setIsLoading(true);
      try {
        const result = await requestChatCompletion(trimmed, locale);
        const content = result.ok ? result.content : formatChatError(result, locale);
        setMessages((prev) => [...prev, assistantMessage(content)]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, locale, setMessages, visitor, visitorStrings],
  );

  const handleSend = useCallback(() => sendMessage(input), [input, sendMessage]);

  const useVvLayout = mobileVv !== null;

  return (
    <div
      className={`card flex flex-col overflow-hidden fixed z-50
        ${useVvLayout ? "left-3 right-3 max-w-none" : "inset-3 max-h-[calc(100dvh-1.5rem)]"}
        sm:inset-auto sm:bottom-20 sm:right-4
        sm:w-[min(600px,calc(100vw-2rem))] sm:h-[min(700px,calc(100dvh-5rem))] sm:max-h-none
        md:w-[600px] md:h-[min(700px,calc(100dvh-5rem))]`}
      style={
        useVvLayout
          ? { top: mobileVv.top, height: mobileVv.height, maxHeight: mobileVv.height }
          : undefined
      }
    >
      <ChatPanelHeader
        title={ui.headerTitle}
        closeAria={ui.closeAria}
        onClose={onClose}
        showForget={visitor.status === "has-name" || visitor.status === "opted-out"}
        onForget={visitor.forget}
        forgetLabel={visitorStrings.forget.label}
        forgetAria={visitorStrings.forget.ariaLabel}
      />

      <ChatMessageList
        messages={messages}
        chips={ui.chips}
        onChipClick={sendMessage}
        isLoading={isLoading}
        locale={locale}
        onClose={onClose}
      />

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={inputDisabled}
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
  showForget: boolean;
  onForget: () => void;
  forgetLabel: string;
  forgetAria: string;
};

function ChatPanelHeader({
  title,
  closeAria,
  onClose,
  showForget,
  onForget,
  forgetLabel,
  forgetAria,
}: ChatPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="flex items-center gap-1">
        {showForget && (
          <button
            onClick={onForget}
            aria-label={forgetAria}
            title={forgetLabel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
          >
            <UserX className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onClose}
          aria-label={closeAria}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
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

type GreetingSeedDeps = {
  visitor: UseVisitorNameResult;
  visitorStrings: ReturnType<typeof getVisitorNameStrings>;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
};

/**
 * Seeds a single opening assistant message on the first render with a resolved
 * visitor state and an empty message list. Runs at most once per panel mount;
 * reopening the panel triggers a fresh mount so the seed happens again with
 * the latest visitor state.
 */
function useGreetingSeed({
  visitor,
  visitorStrings,
  messages,
  setMessages,
}: GreetingSeedDeps) {
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    if (visitor.status === "loading") return;
    if (messages.length > 0) {
      seeded.current = true;
      return;
    }

    const content = pickGreeting(visitor, visitorStrings);
    setMessages((prev) => (prev.length > 0 ? prev : [...prev, assistantMessage(content)]));
    seeded.current = true;
    /* Locale-at-mount: we never replace the initial message mid-conversation, by design. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitor.status, visitor.name, messages.length, setMessages]);
}

function pickGreeting(
  visitor: UseVisitorNameResult,
  strings: ReturnType<typeof getVisitorNameStrings>,
): string {
  if (visitor.status === "needs-prompt") return strings.askForName.message;
  if (visitor.status === "has-name" && visitor.name) {
    return formatWithName(strings.greeting.returning, visitor.name);
  }
  /* Opted-out, fresh session: there is no prior user message to "ack", so use
     the neutral hello. The conversational "¡Dale!" variant is only used right
     after the user opts out in the current session. */
  return strings.greeting.anonymousReturning;
}

/* ── Name-flow handler ───────────────────────────────────────────────── */

type NameFlowOutcome = "consumed" | "passthrough";

type NameFlowDeps = {
  text: string;
  renameLocale: "es" | "en";
  visitor: UseVisitorNameResult;
  visitorStrings: ReturnType<typeof getVisitorNameStrings>;
  appendAssistant: (content: string) => void;
};

/**
 * Handles the visitor-name conversational flow.
 *
 * - First message after the prompt: opt-out → store + neutral welcome (consumed);
 *   recognized name → store + personalized ack (consumed); anything else → passthrough
 *   (do NOT touch storage; the question will be re-seeded next session — this is
 *   intentional, see `tasks.md` for the rationale).
 * - Mid-chat: a rename phrase ("call me Ana") updates storage and synthesizes a
 *   confirmation, but the original user text is still passed to the backend.
 *
 * Order matters: opt-out runs FIRST so phrases like "prefer not to say" are not
 * misclassified as a bare name by `extractBareName`.
 */
function handleNameFlow({
  text,
  renameLocale,
  visitor,
  visitorStrings,
  appendAssistant,
}: NameFlowDeps): NameFlowOutcome {
  if (visitor.status === "needs-prompt") {
    if (detectOptOut(text, renameLocale)) {
      visitor.optOut();
      appendAssistant(visitorStrings.greeting.anonymous);
      return "consumed";
    }
    const renameName = visitor.detectRename(text, renameLocale);
    const captured = renameName ?? extractBareName(text);
    if (captured) {
      visitor.setName(captured);
      appendAssistant(formatWithName(visitorStrings.greeting.firstTime, captured));
      return "consumed";
    }
    return "passthrough";
  }

  /* Rename intent mid-chat (e.g. "call me Ana"). */
  const newName = visitor.detectRename(text, renameLocale);
  if (newName && newName !== visitor.name) {
    visitor.setName(newName);
    appendAssistant(formatWithName(visitorStrings.rename.confirmation, newName));
  }
  return "passthrough";
}
