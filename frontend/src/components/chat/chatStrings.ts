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
    greeting: "¡Hola! ¿Querés conocer mejor mi trabajo? Preguntame sobre mi experiencia, mis proyectos o cómo desarrollo con IA. Podés empezar con una de estas preguntas:",
    chips: [
      { label: "¿Cómo desarrollás con IA?", value: "¿Cómo desarrollás con IA?" },
      { label: "¿En qué proyectos trabajaste?", value: "¿En qué proyectos trabajaste?" },
    ],
    placeholder: "Escribí tu pregunta…",
    headerTitle: "Pregúntale a Cristian",
    closeAria: "Cerrar chat",
  },
  en: {
    greeting: "Hi! Want to learn more about my work? Ask me about my experience, projects, or how I develop with AI. You can start with one of these questions:",
    chips: [
      { label: "How do you develop with AI?", value: "How do you develop with AI?" },
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
