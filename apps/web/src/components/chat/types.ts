/** Chat message roles. */
export type MessageRole = "user" | "assistant";

/** Single chat message. */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/** Suggestion chip shown before first message. */
export interface ChatChip {
  label: string;
  value: string;
}
