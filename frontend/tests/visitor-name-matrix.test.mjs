/**
 * Exhaustive conversation-matrix harness for the visitor-name flow.
 *
 * Runs every realistic variant of an opening-message reply through the EXACT
 * same pipeline the UI uses (`detectOptOut` → `detectRename` → `extractBareName`)
 * and asserts the classification. New inputs live at the bottom — add them there,
 * not in the production detection modules.
 *
 * Categories:
 *   - "set-name"    → the UI would call visitor.setName(capturedName)
 *   - "opt-out"     → the UI would call visitor.optOut()
 *   - "passthrough" → the UI would forward the message unchanged to the backend
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const { fileURLToPath, pathToFileURL } = require("node:url");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function compileEsm(relativePath) {
  const srcPath = path.resolve(__dirname, "..", "src", "components", "chat", relativePath);
  const source = fs.readFileSync(srcPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: srcPath,
  });
  return outputText;
}

async function loadRename() {
  const tmpDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "cv-ia-matrix-"));
  const storagePath = path.join(tmpDir, "visitorNameStorage.mjs");
  fs.writeFileSync(storagePath, compileEsm("visitorNameStorage.ts"));
  const renamePath = path.join(tmpDir, "renameDetection.mjs");
  let renameCompiled = compileEsm("renameDetection.ts");
  renameCompiled = renameCompiled.replace(
    /from ["']\.\/visitorNameStorage["']/g,
    `from "${pathToFileURL(storagePath).href}"`,
  );
  fs.writeFileSync(renamePath, renameCompiled);
  return import(pathToFileURL(renamePath).href);
}

/**
 * Exact replica of the `needs-prompt` branch in ChatPanel.sendMessage, so the
 * harness cannot drift from the UI. If the UI logic ever changes, MIRROR it
 * here — otherwise this matrix stops being a safety net.
 */
function classifyFirstReply(mod, text, locale) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { kind: "passthrough", name: null };
  }
  if (mod.detectOptOut(trimmed, locale)) {
    return { kind: "opt-out", name: null };
  }
  const renameFirst = mod.detectRename(trimmed, locale);
  const bare = renameFirst ? null : mod.extractBareName(trimmed);
  const captured = renameFirst ?? bare;
  if (captured) {
    return { kind: "set-name", name: captured };
  }
  return { kind: "passthrough", name: null };
}

/**
 * Mid-chat branch (status === "has-name"): only detectRename fires; everything
 * else falls through to the backend. Mirrors the `else` branch of ChatPanel.
 */
function classifyMidChat(mod, text, locale) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { kind: "passthrough", name: null };
  }
  const newName = mod.detectRename(trimmed, locale);
  if (newName) {
    return { kind: "rename", name: newName };
  }
  return { kind: "passthrough", name: null };
}

/* ── The matrix ──────────────────────────────────────────────────────── */

/** First-reply matrix. `name` is optional — checked only when `kind === "set-name"`. */
const FIRST_REPLY_MATRIX = [
  /* ---- Bare names (ES + EN) ---- */
  { input: "Ana", locale: "es", kind: "set-name", name: "Ana" },
  { input: "Ana María", locale: "es", kind: "set-name", name: "Ana María" },
  { input: "Cristian", locale: "es", kind: "set-name", name: "Cristian" },
  { input: "Cristian Lopez", locale: "es", kind: "set-name", name: "Cristian Lopez" },
  { input: "Jean-Luc", locale: "en", kind: "set-name", name: "Jean-Luc" },
  { input: "O'Connor", locale: "en", kind: "set-name", name: "O'Connor" },
  { input: "  Sam  ", locale: "en", kind: "set-name", name: "Sam" },
  { input: "María José", locale: "es", kind: "set-name", name: "María José" },

  /* ---- Rename-phrase names (ES) ---- */
  { input: "me llamo Lucía", locale: "es", kind: "set-name", name: "Lucía" },
  { input: "mi nombre es Pedro", locale: "es", kind: "set-name", name: "Pedro" },
  { input: "soy Pedro", locale: "es", kind: "set-name", name: "Pedro" },
  { input: "llamame Ana", locale: "es", kind: "set-name", name: "Ana" },
  { input: "llámame Ana", locale: "es", kind: "set-name", name: "Ana" },
  { input: "decime Juan", locale: "es", kind: "set-name", name: "Juan" },
  { input: "mejor llamame Sam", locale: "es", kind: "set-name", name: "Sam" },
  { input: "prefiero que me llames Sam", locale: "es", kind: "set-name", name: "Sam" },
  { input: "soy Pedro y quiero saber de Azure", locale: "es", kind: "set-name", name: "Pedro" },

  /* ---- Rename-phrase names (EN) ---- */
  { input: "call me Ana", locale: "en", kind: "set-name", name: "Ana" },
  { input: "please call me Ana", locale: "en", kind: "set-name", name: "Ana" },
  { input: "you can call me Alex", locale: "en", kind: "set-name", name: "Alex" },
  { input: "my name is Jean-Luc", locale: "en", kind: "set-name", name: "Jean-Luc" },
  { input: "I'm Ana María", locale: "en", kind: "set-name", name: "Ana María" },
  { input: "im Alex", locale: "en", kind: "set-name", name: "Alex" },

  /* ---- Correction phrasings (ES + EN) ---- */
  { input: "No soy Pablo, soy Claudio", locale: "es", kind: "set-name", name: "Claudio" },
  { input: "I'm not Pablo, call me Claudio", locale: "en", kind: "set-name", name: "Claudio" },

  /* ---- Mixed-language (user on /es writes English, and vice versa) ---- */
  { input: "call me Ana", locale: "es", kind: "set-name", name: "Ana" },
  { input: "mejor llamame Ana", locale: "en", kind: "set-name", name: "Ana" },

  /* ---- Opt-out (ES) ---- */
  { input: "prefiero no decirlo", locale: "es", kind: "opt-out" },
  { input: "Prefiero no decirlo.", locale: "es", kind: "opt-out" },
  { input: "prefiero no", locale: "es", kind: "opt-out" },
  { input: "prefiero omitirlo", locale: "es", kind: "opt-out" },
  { input: "prefiero omitir mi nombre", locale: "es", kind: "opt-out" },
  { input: "no quiero decir mi nombre", locale: "es", kind: "opt-out" },
  { input: "anónimo", locale: "es", kind: "opt-out" },
  { input: "anonimo", locale: "es", kind: "opt-out" },
  { input: "Anónima por favor", locale: "es", kind: "opt-out" },
  { input: "sin nombre", locale: "es", kind: "opt-out" },
  { input: "omitir", locale: "es", kind: "opt-out" },
  { input: "saltar", locale: "es", kind: "opt-out" },

  /* ---- Opt-out (EN) ---- */
  { input: "prefer not to say", locale: "en", kind: "opt-out" },
  { input: "I'd rather not say", locale: "en", kind: "opt-out" },
  { input: "rather not", locale: "en", kind: "opt-out" },
  { input: "anonymous please", locale: "en", kind: "opt-out" },
  { input: "no name, thanks", locale: "en", kind: "opt-out" },
  { input: "skip it", locale: "en", kind: "opt-out" },
  { input: "skip this", locale: "en", kind: "opt-out" },

  /* ---- Passthrough: questions / CV topics / fillers / greetings ---- */
  { input: "hola", locale: "es", kind: "passthrough" },
  { input: "hola!", locale: "es", kind: "passthrough" },
  { input: "buenas", locale: "es", kind: "passthrough" },
  { input: "buenos días", locale: "es", kind: "passthrough" },
  { input: "Hi", locale: "en", kind: "passthrough" },
  { input: "hey", locale: "en", kind: "passthrough" },
  { input: "ok", locale: "en", kind: "passthrough" },
  { input: "okay", locale: "en", kind: "passthrough" },
  { input: "gracias", locale: "es", kind: "passthrough" },
  { input: "thanks", locale: "en", kind: "passthrough" },

  /* CV-related questions should NEVER be misparsed as a name */
  { input: "¿Cuál es tu experiencia en Azure?", locale: "es", kind: "passthrough" },
  { input: "Contame sobre Azure", locale: "es", kind: "passthrough" },
  { input: "Contame sobre tu experiencia", locale: "es", kind: "passthrough" },
  { input: "qué tecnologías manejás", locale: "es", kind: "passthrough" },
  { input: "tell me about your projects", locale: "en", kind: "passthrough" },
  { input: "what is your Azure experience?", locale: "en", kind: "passthrough" },
  { input: "how are you?", locale: "en", kind: "passthrough" },

  /* Ambiguous negations that are NOT opt-outs (should passthrough, not become a name) */
  { input: "no", locale: "es", kind: "passthrough" },
  { input: "no gracias", locale: "es", kind: "passthrough" },
  { input: "no thanks", locale: "en", kind: "passthrough" },
  { input: "nada", locale: "es", kind: "passthrough" },

  /* Edge: empty-ish / non-letter / too short */
  { input: "", locale: "es", kind: "passthrough" },
  { input: "   ", locale: "es", kind: "passthrough" },
  { input: "A", locale: "en", kind: "passthrough" },
  { input: "👋", locale: "en", kind: "passthrough" },
  { input: "¿?", locale: "es", kind: "passthrough" },
  { input: "1234", locale: "en", kind: "passthrough" },
];

/** Mid-chat matrix (visitor already has a stored name). */
const MID_CHAT_MATRIX = [
  { input: "mejor llamame Sofía", locale: "es", kind: "rename", name: "Sofía" },
  { input: "call me Alex from now on", locale: "en", kind: "rename", name: "Alex" },
  { input: "my name is Jean-Luc", locale: "en", kind: "rename", name: "Jean-Luc" },
  { input: "¿cómo estás?", locale: "es", kind: "passthrough" },
  { input: "tell me about Azure", locale: "en", kind: "passthrough" },
  { input: "contame sobre Azure", locale: "es", kind: "passthrough" },
  { input: "hola", locale: "es", kind: "passthrough" },
  { input: "prefiero no decirlo", locale: "es", kind: "passthrough" },
];

/* ── Execution ───────────────────────────────────────────────────────── */

test("first-reply conversation matrix", async () => {
  const mod = await loadRename();
  const failures = [];
  for (const row of FIRST_REPLY_MATRIX) {
    const got = classifyFirstReply(mod, row.input, row.locale);
    const kindOk = got.kind === row.kind;
    const nameOk = row.kind !== "set-name" || got.name === row.name;
    if (!kindOk || !nameOk) {
      failures.push({
        input: row.input,
        locale: row.locale,
        expected: row.kind + (row.name ? ` (${row.name})` : ""),
        got: got.kind + (got.name ? ` (${got.name})` : ""),
      });
    }
  }
  if (failures.length > 0) {
    const pretty = failures
      .map((f) => `  - [${f.locale}] "${f.input}" → expected ${f.expected}, got ${f.got}`)
      .join("\n");
    assert.fail(`\n${failures.length} first-reply mismatch(es):\n${pretty}`);
  }
});

test("mid-chat conversation matrix", async () => {
  const mod = await loadRename();
  const failures = [];
  for (const row of MID_CHAT_MATRIX) {
    const got = classifyMidChat(mod, row.input, row.locale);
    const kindOk = got.kind === row.kind;
    const nameOk = row.kind !== "rename" || got.name === row.name;
    if (!kindOk || !nameOk) {
      failures.push({
        input: row.input,
        locale: row.locale,
        expected: row.kind + (row.name ? ` (${row.name})` : ""),
        got: got.kind + (got.name ? ` (${got.name})` : ""),
      });
    }
  }
  if (failures.length > 0) {
    const pretty = failures
      .map((f) => `  - [${f.locale}] "${f.input}" → expected ${f.expected}, got ${f.got}`)
      .join("\n");
    assert.fail(`\n${failures.length} mid-chat mismatch(es):\n${pretty}`);
  }
});
