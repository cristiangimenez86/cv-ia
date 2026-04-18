/**
 * Maps a failed `ChatResult` to a user-facing message in the active locale.
 *
 * Kept out of `ChatPanel` so the panel only deals with React state and the
 * (often messy) error-mapping table can be read at a glance.
 */

import type { ChatResult } from "@/lib/chat/chatClient";

type Locale = "es" | "en";

type Hints = Record<Locale, Partial<Record<string, string>>>;

/** Extra hints appended to the API-provided message when we recognize the code. */
const API_CODE_HINTS: Hints = {
  es: {
    provider_auth: " Revisá la API key y la facturación en el panel del proveedor.",
    rate_limited: " Esperá un momento o revisá límites/cuota del proveedor.",
    provider_forbidden:
      " La clave restringida debe permitir el modelo configurado en el backend (p. ej. gpt-4o-mini) o usá una clave con permisos All.",
  },
  en: {
    provider_auth: " Check your API key and billing in the provider dashboard.",
    rate_limited: " Wait a moment or check usage limits with the provider.",
    provider_forbidden:
      " Allow the backend model (e.g. gpt-4o-mini) on this restricted key, or use a key with All permissions.",
  },
};

/** Generic fallback for each known status code. */
const STATUS_MESSAGES: Record<number, Record<Locale, string>> = {
  0: {
    es: "No pude conectar con el backend. ¿Está corriendo en el puerto 8080? Reiniciá el front si cambiaste .env.local.",
    en: "Couldn't reach the backend. Is it running on port 8080? Restart the dev server if you changed .env.local.",
  },
  401: {
    es: "No autorizado para usar el API (token de acceso). Revisá la configuración del sitio o del backend.",
    en: "Not authorized to call the API (access token). Check site or backend configuration.",
  },
  403: {
    es: "El proveedor rechazó la solicitud (permisos). Revisá la clave restringida y el modelo en la configuración del backend, o usá una clave con permisos All.",
    en: "The provider rejected the request (permissions). Check your restricted key and the backend chat model setting, or use a key with All permissions.",
  },
  429: {
    es: "Límite de uso alcanzado (demasiadas solicitudes). Probá de nuevo en un momento.",
    en: "Rate limit reached. Please try again in a moment.",
  },
};

const GENERIC_5XX: Record<Locale, string> = {
  es: "El servidor respondió con error. Revisá que el backend esté en marcha, la API key del proveedor y la facturación (crédito > $0).",
  en: "The server returned an error. Check that the backend is running, your provider API key, and billing (credit balance).",
};

const GENERIC_FALLBACK: Record<Locale, string> = {
  es: "No se pudo completar el chat. Revisá la consola o probá de nuevo.",
  en: "Could not complete the chat. Check the console or try again.",
};

/**
 * Returns the message body for an `ok: false` chat result. When the backend
 * provides a message, it is preferred and decorated with a hint when the API
 * `code` is recognized.
 */
export function formatChatError(
  result: Extract<ChatResult, { ok: false }>,
  locale: string,
): string {
  const lang: Locale = locale === "es" ? "es" : "en";
  const detail = result.apiMessage?.trim();
  if (detail) {
    const hint = (result.apiCode && API_CODE_HINTS[lang][result.apiCode]) ?? "";
    return `${detail}${hint}`;
  }
  const known = STATUS_MESSAGES[result.status];
  if (known) return known[lang];
  if (result.status >= 500) return GENERIC_5XX[lang];
  return GENERIC_FALLBACK[lang];
}
