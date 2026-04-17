/**
 * Heuristic bilingual rename detection.
 *
 * Looks for phrases like "call me Ana", "my name is Ana", "llamame Ana",
 * "prefiero que me llames Ana", "mejor decime Ana" in the user's message.
 * The match is conservative on purpose: we only take 1 to 3 whitespace-separated
 * tokens after the trigger, strip trailing punctuation/connectors, and reject
 * empty, single-character, or digits-only captures.
 *
 * False positives are accepted (the visitor can always fix it via "forget my
 * name" or a new rename phrase) in exchange for zero runtime cost and no
 * dependency on the LLM.
 */

import { normalizeVisitorName, VISITOR_NAME_MAX_LENGTH } from "./visitorNameStorage";

const TRIGGERS: Record<"es" | "en", RegExp> = {
  es: /(?:prefiero que me llames|mejor ll[aá]mame|mejor dec[ií]me|ll[aá]mame|dec[ií]me|me llamo|mi nombre es|soy)\s+([^\n\r]{1,120})/iu,
  en: /(?:please call me|you can call me|call me|my name is|i am|i'm|im)\s+([^\n\r]{1,120})/iu,
};

/** Phrases that mean "I'd rather not share my name". */
const OPT_OUT_PATTERNS: Record<"es" | "en", RegExp> = {
  es: /(?:prefiero no\b|no quiero decir|prefier[oa] omitir|an[óo]nim[oa]|sin nombre|omitir|saltar)/iu,
  en: /(?:prefer not|rather not|anonymous|no name|skip it|skip this|omit)/iu,
};

/**
 * Returns `true` when the text expresses an explicit opt-out from providing a name
 * (e.g. "prefer not to say", "prefiero no decirlo", "anónimo").
 *
 * Conservative by design: short generic words like "no" or "skip" alone are NOT treated
 * as opt-out to avoid false positives on a chat where they may mean something else.
 */
export function detectOptOut(text: string, locale: "es" | "en"): boolean {
  if (typeof text !== "string") {
    return false;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 200) {
    return false;
  }
  const order: ReadonlyArray<"es" | "en"> = locale === "es" ? ["es", "en"] : ["en", "es"];
  for (const lang of order) {
    if (OPT_OUT_PATTERNS[lang].test(trimmed)) {
      return true;
    }
  }
  return false;
}

const BARE_NAME_REGEX = /^[\p{L}\p{M}][\p{L}\p{M}'’\-\s.]{0,39}$/u;
const COMMON_FILLERS = new Set([
  "hola",
  "holi",
  "hello",
  "hi",
  "hey",
  "buenas",
  "buenos días",
  "buenas tardes",
  "buenas noches",
  "good morning",
  "good afternoon",
  "good evening",
  "ok",
  "okay",
  "sure",
  "claro",
  "dale",
  "si",
  "sí",
  "yes",
  "no",
  "gracias",
  "thanks",
  "thank you",
]);

/**
 * Returns a cleaned-up name when the text looks like a bare name reply
 * (for example the user just types "Ana" or "Ana María"), otherwise `null`.
 *
 * Rejects common greetings / fillers ("hola", "hi", "thanks") so those don't get
 * mistakenly stored as a visitor name when the user is just being polite.
 */
export function extractBareName(text: string): string | null {
  if (typeof text !== "string") {
    return null;
  }
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return null;
  }
  if (trimmed.includes("?") || trimmed.includes("¿")) {
    return null;
  }
  if (/\d/.test(trimmed)) {
    return null;
  }
  if (COMMON_FILLERS.has(trimmed.toLowerCase())) {
    return null;
  }
  if (!BARE_NAME_REGEX.test(trimmed)) {
    return null;
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length > 3) {
    return null;
  }
  return trimmed;
}

const TRAILING_NOISE =
  /(?:[\s.,;:!?]+(?:por favor|porfa|please|thanks|gracias)?[\s.,;:!?]*)$/iu;

function cleanCandidate(raw: string): string | null {
  let value = raw.trim();
  value = value.replace(TRAILING_NOISE, "");
  const tokens = value.split(/\s+/).filter(Boolean).slice(0, 3);
  value = tokens.join(" ").trim();
  value = value.replace(/[.,;:!?]+$/u, "").trim();

  const normalized = normalizeVisitorName(value);
  if (!normalized) {
    return null;
  }
  if (normalized.length < 2) {
    return null;
  }
  if (/^\d+$/.test(normalized)) {
    return null;
  }
  if (!/\p{L}/u.test(normalized)) {
    return null;
  }
  return normalized.slice(0, VISITOR_NAME_MAX_LENGTH);
}

/**
 * Returns the extracted new name when the text matches a rename intent,
 * otherwise `null`. The check is locale-aware but falls back to the other
 * locale's patterns when the primary one does not match, because users often
 * mix languages in the chat.
 */
export function detectRename(text: string, locale: "es" | "en"): string | null {
  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }
  const order: ReadonlyArray<"es" | "en"> = locale === "es" ? ["es", "en"] : ["en", "es"];
  for (const lang of order) {
    const match = TRIGGERS[lang].exec(text);
    if (match && match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (candidate) {
        return candidate;
      }
    }
  }
  return null;
}
