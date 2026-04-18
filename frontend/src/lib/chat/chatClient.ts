/**
 * Browser-side client for `POST /api/v1/chat/completions`.
 *
 * - Returns a discriminated `ChatResult` instead of throwing, so the UI does
 *   not have to wrap calls in `try/catch` just to render expected 4xx/5xx
 *   responses (and the Next dev overlay does not flash on them).
 * - Retries 429 a couple of times honoring `Retry-After`.
 */

import { publicApiBearer, publicApiUrl } from "@/lib/publicApi";

export type ChatResult =
  | { ok: true; content: string }
  | { ok: false; status: number; apiMessage?: string; apiCode?: string };

const MAX_429_RETRIES = 2;
const RETRY_AFTER_CAP_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parses a `Retry-After` header in seconds. Returns null when missing/invalid. */
function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get("retry-after");
  if (!raw) return null;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.min(seconds * 1000, RETRY_AFTER_CAP_MS);
}

function parseApiErrorBody(text: string): { message?: string; code?: string } {
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    const message = j.message ?? j.Message;
    const code = j.code ?? j.Code;
    return {
      message: typeof message === "string" ? message : undefined,
      code: typeof code === "string" ? code : undefined,
    };
  } catch {
    return {};
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = publicApiBearer();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Sends one user message to the chat completions endpoint. */
export async function requestChatCompletion(
  userText: string,
  locale: string,
): Promise<ChatResult> {
  const url = publicApiUrl("/api/v1/chat/completions");
  const body = JSON.stringify({
    lang: locale,
    messages: [{ role: "user", content: userText }],
  });
  const headers = buildHeaders();

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers, body });
    } catch {
      return { ok: false, status: 0 };
    }

    if (response.ok) {
      try {
        const payload = (await response.json()) as { message?: { content?: string } };
        const content = payload.message?.content?.trim() || "No response content.";
        return { ok: true, content };
      } catch {
        return { ok: false, status: 502 };
      }
    }

    if (response.status === 429 && attempt < MAX_429_RETRIES) {
      await sleep(retryAfterMs(response) ?? 1500 * (attempt + 1));
      continue;
    }

    const errText = await response.text();
    const { message: apiMessage, code: apiCode } = parseApiErrorBody(errText);
    return { ok: false, status: response.status, apiMessage, apiCode };
  }
}
