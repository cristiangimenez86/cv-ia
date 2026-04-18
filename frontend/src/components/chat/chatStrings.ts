/**
 * Bilingual UI strings + suggestion chips for the chat panel.
 * Lives next to the chat components so translators only touch this file.
 */

import type { ChatChip } from "./types";

type Locale = "es" | "en";

type ChatPanelStrings = {
  chips: ChatChip[];
  placeholder: string;
  headerTitle: string;
  closeAria: string;
};

const STRINGS: Record<Locale, ChatPanelStrings> = {
  es: {
    chips: [
      { label: "Experiencia en Azure", value: "Contame sobre tu experiencia en Azure" },
      { label: "Proyectos principales", value: "¿Cuáles son tus proyectos principales?" },
      { label: "Stack .NET", value: "¿Qué tecnologías .NET manejás?" },
      { label: "Disponibilidad", value: "¿Cuál es tu disponibilidad?" },
    ],
    placeholder: "Escribí tu pregunta…",
    headerTitle: "Pregúntale a Cristian",
    closeAria: "Cerrar chat",
  },
  en: {
    chips: [
      { label: "Azure experience", value: "Tell me about your Azure experience" },
      { label: "Main projects", value: "What are your main projects?" },
      { label: ".NET stack", value: "What .NET technologies do you use?" },
      { label: "Availability", value: "What is your availability?" },
    ],
    placeholder: "Type your question…",
    headerTitle: "Ask Cristian",
    closeAria: "Close chat",
  },
};

export function getChatPanelStrings(locale: string): ChatPanelStrings {
  return locale === "es" ? STRINGS.es : STRINGS.en;
}
