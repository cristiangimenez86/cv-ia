"use client";

import { useEffect, useRef } from "react";
import { ChatAssistantMarkdown } from "./ChatAssistantMarkdown";
import type { ChatMessage, ChatChip } from "./types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  chips?: ChatChip[];
  onChipClick?: (value: string) => void;
  isLoading?: boolean;
  mobileViewportHeight?: number;
  locale: string;
  onNavigate: () => void;
};

/**
 * Scrollable message list with user/assistant bubbles.
 * Shows suggestion chips below the initial greeting.
 */
export function ChatMessageList({
  messages,
  chips,
  onChipClick,
  isLoading,
  mobileViewportHeight,
  locale,
  onNavigate,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to bottom on new messages or loading state change */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (mobileViewportHeight === undefined) return;
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [mobileViewportHeight]);

  return (
    <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
      {/* Message bubbles */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                : "border border-border bg-surface-2 text-foreground"
            }`}
          >
            {msg.role === "user" ? (
              msg.content
            ) : (
              <ChatAssistantMarkdown
                content={msg.content}
                locale={locale}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>
      ))}

      {/* Suggestion chips — visible until the visitor sends a message */}
      {messages.length <= 1 && chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {chips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              disabled={isLoading}
              onClick={() => onChipClick?.(chip.value)}
              className="profile-card-btn inline-flex min-h-9 items-center rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-surface-2 text-muted border border-border rounded-xl px-4 py-2.5 text-sm flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
              ·
            </span>
            <span
              className="animate-bounce"
              style={{ animationDelay: "150ms" }}
            >
              ·
            </span>
            <span
              className="animate-bounce"
              style={{ animationDelay: "300ms" }}
            >
              ·
            </span>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
