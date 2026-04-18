/**
 * Bilingual copy for the visitor-name personalization flows.
 * Kept in a single module so translators / editors only touch one file.
 */

export type VisitorNameLocale = "es" | "en";

type GreetingStrings = {
  /** First-time greeting right after the visitor just told us their name. `{name}` placeholder. */
  firstTime: string;
  /** Returning-visitor greeting on a fresh chat where we already had a stored name. `{name}` placeholder. */
  returning: string;
  /**
   * Conversational ack used IN THE SAME SESSION right after the visitor types an opt-out phrase.
   * It reads as a direct reply to what the user just said, so it starts with "¡Dale!" / "Sounds good!".
   */
  anonymous: string;
  /**
   * Fresh-session greeting when we load the chat and find a stored opt-out preference. There is
   * no prior user message in this conversation, so the copy must be a neutral hello, not an ack.
   */
  anonymousReturning: string;
};

type AskForNameStrings = {
  /** Conversational assistant message seeded on the very first open when no name / opt-out is stored. */
  message: string;
};

type RenameStrings = {
  /** `{name}` is replaced with the new captured name. */
  confirmation: string;
};

type ForgetStrings = {
  label: string;
  ariaLabel: string;
};

export type VisitorNameStrings = {
  askForName: AskForNameStrings;
  greeting: GreetingStrings;
  rename: RenameStrings;
  forget: ForgetStrings;
};

const DICTIONARY: Record<VisitorNameLocale, VisitorNameStrings> = {
  es: {
    askForName: {
      message:
        "¡Hola! Antes de arrancar, ¿cómo te gustaría que te llame? Podés decirme tu nombre, escribir *“prefiero no decirlo”*, o directamente preguntarme lo que quieras y seguimos.",
    },
    greeting: {
      firstTime:
        "¡Un gusto, **{name}**! ¿En qué te puedo ayudar hoy? Podés preguntarme sobre mi experiencia, proyectos o tecnologías.",
      returning:
        "Hola **{name}**, ¿puedo seguir llamándote **{name}**? Si preferís otro nombre, decime *“mejor llamame …”*. ¿En qué te puedo ayudar hoy?",
      anonymous:
        "¡Dale! ¿En qué te puedo ayudar hoy? Podés preguntarme sobre mi experiencia, proyectos o tecnologías.",
      anonymousReturning:
        "¡Hola! ¿En qué te puedo ayudar hoy? Podés preguntarme sobre mi experiencia, proyectos o tecnologías.",
    },
    rename: {
      confirmation: "¡Listo! A partir de ahora te llamo **{name}**.",
    },
    forget: {
      label: "Olvidar mi nombre",
      ariaLabel: "Olvidar la preferencia de nombre guardada en este navegador",
    },
  },
  en: {
    askForName: {
      message:
        "Hi there! Before we start, what should I call you? You can tell me your name, type *“prefer not to say”*, or just ask me anything and we'll keep going.",
    },
    greeting: {
      firstTime:
        "Nice to meet you, **{name}**! What can I help you with today? Feel free to ask about my experience, projects, or tech stack.",
      returning:
        "Hi **{name}**, should I keep calling you **{name}**? If you prefer a different name, just say *“call me …”*. What can I help you with today?",
      anonymous:
        "Sounds good! What can I help you with today? Feel free to ask about my experience, projects, or tech stack.",
      anonymousReturning:
        "Hi there! What can I help you with today? Feel free to ask about my experience, projects, or tech stack.",
    },
    rename: {
      confirmation: "Got it! I'll call you **{name}** from now on.",
    },
    forget: {
      label: "Forget my name",
      ariaLabel: "Forget the name preference stored in this browser",
    },
  },
};

export function getVisitorNameStrings(locale: string): VisitorNameStrings {
  return locale === "es" ? DICTIONARY.es : DICTIONARY.en;
}

/** Replace the `{name}` placeholder in a template string. */
export function formatWithName(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}
