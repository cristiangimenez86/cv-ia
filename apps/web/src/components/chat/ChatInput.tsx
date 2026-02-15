"use client";

import type { KeyboardEvent, RefObject } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
};

/**
 * Chat input bar: textarea + send button.
 * Enter sends; Shift+Enter inserts newline.
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  inputRef,
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 px-3 py-3 border-t border-border">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send"
        className="profile-card-btn profile-card-btn-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
