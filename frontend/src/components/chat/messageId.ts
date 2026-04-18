/**
 * Generates a unique id for a chat message.
 *
 * Prefers `crypto.randomUUID` (available in all modern browsers and Node 19+).
 * Falls back to a counter + timestamp when the API is missing so unit tests
 * and very old environments still work.
 */

let fallbackCounter = 0;

export function createMessageId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return `msg-${c.randomUUID()}`;
  }
  fallbackCounter += 1;
  return `msg-${fallbackCounter}-${Date.now()}`;
}
