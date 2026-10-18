/**
 * Bilingual UI strings + suggestion chips for the chat panel.
 * Lives next to the chat components so translators only touch this file.
 */

import type { ChatChip } from "./types";

type Locale = "es" | "en";

type ChatPanelStrings = {
  chips: ChatChip[];
  greeting: string;
  placeholder: string;
  headerTitle: string;
  closeAria: string;
};

const STRINGS: Record<Locale, ChatPanelStrings> = {
  es: {
    greeting: "¡Hola! ¿Querés conocer mejor mi trabajo? Preguntame sobre mi experiencia, mis proyectos o las tecnologías que uso. Podés empezar con una de estas preguntas:",
    chips: [
      { label: "¿Cuál es tu experiencia?", value: "¿Cuál es tu experiencia?" },
      { label: "¿En qué proyectos trabajaste?", value: "¿En qué proyectos trabajaste?" },
    ],
    placeholder: "Escribí tu pregunta…",
    headerTitle: "Pregúntale a Cristian",
    closeAria: "Cerrar chat",
  },
  en: {
    greeting: "Hi! Want to learn more about my work? Ask me about my experience, projects, or the technologies I use. You can start with one of these questions:",
    chips: [
      { label: "What's your experience?", value: "What's your experience?" },
      { label: "Which projects have you worked on?", value: "Which projects have you worked on?" },
    ],
    placeholder: "Type your question…",
    headerTitle: "Ask Cristian",
    closeAria: "Close chat",
  },
};

export function getChatPanelStrings(locale: string): ChatPanelStrings {
  return locale === "es" ? STRINGS.es : STRINGS.en;
}
