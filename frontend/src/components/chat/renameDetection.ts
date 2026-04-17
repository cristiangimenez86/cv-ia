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

/*
 * Triggers are global (`g`) + case-insensitive + Unicode so we can iterate every
 * occurrence in a user message and pick the LAST valid one. That handles common
 * corrections like "No soy Pablo, soy Claudio" → Claudio, because:
 *
 *   - the negative lookbehind rejects the first trigger when it is preceded by
 *     a negation ("no " in ES, "not " in EN);
 *   - the capture group excludes commas/semicolons, so we never swallow
 *     two comma-separated clauses as a single name;
 *   - we keep iterating via `exec()` and return the LAST cleaned candidate.
 */
const TRIGGERS: Record<"es" | "en", RegExp> = {
  es: /(?<!\bno\s)(?:prefiero que me llames|mejor ll[aá]mame|mejor dec[ií]me|ll[aá]mame|dec[ií]me|me llamo|mi nombre es|soy)\s+([^\n\r,;]{1,80})/giu,
  en: /(?<!\bnot\s)(?:please call me|you can call me|call me|my name is|i am|i'm|im)\s+([^\n\r,;]{1,80})/giu,
};

/**
 * Connective stopwords. When any of these appears AFTER the triggered name we
 * treat the sentence as "continues with unrelated content" and truncate the
 * candidate before the stopword. Examples of what this prevents:
 *   - "soy Claudio y tengo dudas" → "Claudio" (not "Claudio y tengo")
 *   - "call me Sam but later" → "Sam" (not "Sam but later")
 */
const FOLLOW_UP_STOPWORD = /\s+(?:pero|y|e|o|u|que|porque|cuando|but|and|or|who|because|when|then|so)\s+/iu;

/**
 * Words that should NEVER appear inside a captured name. Their presence is a
 * strong signal that the regex captured two clauses or an unrelated phrase.
 * Rejecting such captures is safer than trying to fix them heuristically.
 */
const INTERNAL_TRIGGER_OR_CONNECTOR = /\b(?:soy|ll[aá]mame|dec[ií]me|llamo|nombre|call|name|am|i'm|im|pero|but|and|or)\b/iu;

/**
 * If the captured text opens with a negation ("not Pablo", "no Pablo",
 * "n't Pablo"), the trigger was semantically negated and must be rejected.
 * This covers cases where the negation sits AFTER the trigger, which the
 * regex lookbehind cannot catch (e.g. "I'm not Pablo").
 */
const LEADING_NEGATION = /^(?:no|not|n['']t)\s+/iu;

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

  // Reject captures that open with a negation ("I'm not Pablo" style).
  if (LEADING_NEGATION.test(value)) {
    return null;
  }

  // Truncate at the first connective stopword (" y ", " pero ", " but ", …).
  const stopMatch = FOLLOW_UP_STOPWORD.exec(value);
  if (stopMatch && stopMatch.index !== undefined) {
    value = value.slice(0, stopMatch.index).trim();
  }

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
  // Reject captures that still contain trigger words or connectors — these are
  // a signal that we swallowed two clauses ("Pablo soy Claudio", "Ana pero …").
  if (INTERNAL_TRIGGER_OR_CONNECTOR.test(normalized)) {
    return null;
  }
  return normalized.slice(0, VISITOR_NAME_MAX_LENGTH);
}

/**
 * Returns the extracted new name when the text matches a rename intent,
 * otherwise `null`. The check is locale-aware but falls back to the other
 * locale's patterns when the primary one does not match, because users often
 * mix languages in the chat.
 *
 * When multiple triggers appear in the same message (e.g. "No soy Pablo, soy
 * Claudio"), the LAST valid match wins — users typically use a second clause
 * to correct a first one ("no X, Y").
 */
export function detectRename(text: string, locale: "es" | "en"): string | null {
  if (typeof text !== "string" || text.trim().length === 0) {
    return null;
  }
  const order: ReadonlyArray<"es" | "en"> = locale === "es" ? ["es", "en"] : ["en", "es"];
  for (const lang of order) {
    /* Clone the regex to avoid cross-call `lastIndex` state bleed. */
    const pattern = new RegExp(TRIGGERS[lang].source, TRIGGERS[lang].flags);
    let lastCandidate: string | null = null;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        const candidate = cleanCandidate(match[1]);
        if (candidate) {
          lastCandidate = candidate;
        }
      }
      /* Safety net: guarantee forward progress on zero-width matches. */
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex += 1;
      }
    }
    if (lastCandidate) {
      return lastCandidate;
    }
  }
  return null;
}
