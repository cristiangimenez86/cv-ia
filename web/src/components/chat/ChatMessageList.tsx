"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, ChatChip } from "./types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  chips?: ChatChip[];
  onChipClick?: (value: string) => void;
  isLoading?: boolean;
};

/**
 * Scrollable message list with user/assistant bubbles.
 * Shows suggestion chips when no messages yet.
 */
export function ChatMessageList({
  messages,
  chips,
  onChipClick,
  isLoading,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll to bottom on new messages or loading state change */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
      {/* Suggestion chips — visible only before first message */}
      {messages.length === 0 && chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {chips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => onChipClick?.(chip.value)}
              className="profile-card-btn inline-flex items-center rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted hover:border-primary/50"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Message bubbles */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-foreground border border-border"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

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
