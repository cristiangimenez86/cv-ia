/**
 * Visitor-name persistence helpers.
 *
 * Stores one JSON value under a single localStorage key so the chat can tell apart:
 *   - "never asked"       → no entry
 *   - "opted out"         → { optedOut: true, name: null }
 *   - "has a name"        → { optedOut: false, name: "Ana" }
 *
 * Every storage access is wrapped in try/catch because localStorage can throw
 * in private mode, in cross-origin contexts, or when disabled by the user.
 * On any failure we treat the visitor as anonymous for the current session and
 * never crash the chat.
 */

export const VISITOR_NAME_STORAGE_KEY = "cv-ia:visitor-name";

/** Max length of the stored display name. Matches the backend future contract. */
export const VISITOR_NAME_MAX_LENGTH = 40;

const STORAGE_SCHEMA_VERSION = 1;

export type VisitorNameRecord = {
  v: number;
  name: string | null;
  optedOut: boolean;
  updatedAt: string;
};

/**
 * Trim, strip ASCII control characters, and clamp to {@link VISITOR_NAME_MAX_LENGTH}.
 * Returns `null` when the result is empty; callers treat `null` as "no name".
 *
 * The backend is the authoritative sanitizer once the LLM-context change lands;
 * this client-side pass only keeps obviously-broken input out of localStorage.
 */
export function normalizeVisitorName(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const stripped = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (stripped.length === 0) {
    return null;
  }
  return stripped.slice(0, VISITOR_NAME_MAX_LENGTH);
}

function safeGetStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

function parseRecord(raw: string | null): VisitorNameRecord | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const candidate = parsed as Partial<VisitorNameRecord>;
    const name = typeof candidate.name === "string" ? normalizeVisitorName(candidate.name) : null;
    const optedOut = candidate.optedOut === true;
    const updatedAt = typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString();
    return { v: STORAGE_SCHEMA_VERSION, name, optedOut, updatedAt };
  } catch {
    return null;
  }
}

/** Read the stored record; returns `null` if missing, corrupt, or storage unavailable. */
export function readVisitorNameRecord(): VisitorNameRecord | null {
  const storage = safeGetStorage();
  if (!storage) {
    return null;
  }
  try {
    return parseRecord(storage.getItem(VISITOR_NAME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeRecord(record: VisitorNameRecord): void {
  const storage = safeGetStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(VISITOR_NAME_STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable; fall back to in-memory state in the hook */
  }
}

/** Store a name (sets opted-out=false). Silently ignores empty/invalid input. */
export function writeVisitorName(name: string): VisitorNameRecord | null {
  const normalized = normalizeVisitorName(name);
  if (!normalized) {
    return null;
  }
  const record: VisitorNameRecord = {
    v: STORAGE_SCHEMA_VERSION,
    name: normalized,
    optedOut: false,
    updatedAt: new Date().toISOString(),
  };
  writeRecord(record);
  return record;
}

/** Record that the visitor declined to share a name. */
export function writeOptOut(): VisitorNameRecord {
  const record: VisitorNameRecord = {
    v: STORAGE_SCHEMA_VERSION,
    name: null,
    optedOut: true,
    updatedAt: new Date().toISOString(),
  };
  writeRecord(record);
  return record;
}

/** Clear the stored record so the next open shows the first-use prompt again. */
export function clearVisitorName(): void {
  const storage = safeGetStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(VISITOR_NAME_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
