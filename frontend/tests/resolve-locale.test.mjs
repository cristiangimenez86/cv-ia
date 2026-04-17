import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Compiles the pure `resolveLocale` module on the fly and materialises the
 * output inside the `frontend/` tree so Node can resolve the runtime bare
 * imports (`negotiator`, `@formatjs/intl-localematcher`) from
 * `frontend/node_modules`.
 */
const ts = require("typescript");
const fs = require("node:fs");
const path = require("node:path");
const { fileURLToPath, pathToFileURL } = require("node:url");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_PATH = path.resolve(
  __dirname,
  "..",
  "src",
  "lib",
  "locale",
  "resolveLocale.ts",
);

let cachedModulePromise = null;

function loadResolveLocale() {
  if (cachedModulePromise) {
    return cachedModulePromise;
  }
  const source = fs.readFileSync(SRC_PATH, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    },
    fileName: SRC_PATH,
  });

  const tmpDir = fs.mkdtempSync(path.join(__dirname, ".tmp-resolve-locale-"));
  const tmpFile = path.join(tmpDir, "resolveLocale.mjs");
  fs.writeFileSync(tmpFile, outputText);
  cachedModulePromise = import(pathToFileURL(tmpFile).href);
  return cachedModulePromise;
}

const SUPPORTED = ["es", "en"];

test("cookie takes precedence over Accept-Language when supported", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "en-US,en;q=0.9",
    cookieValue: "es",
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "es");
});

test("Spanish browser, no cookie → es", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "es-AR,es;q=0.9,en;q=0.8",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "es");
});

test("English browser, no cookie → en", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "en-US,en;q=0.9",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("unknown cookie value is ignored and falls back to Accept-Language", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "es-ES,es;q=0.9",
    cookieValue: "fr",
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "es");
});

test("empty Accept-Language falls back to default", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("missing Accept-Language (null) falls back to default", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: null,
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("unsupported Accept-Language falls back to default", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "fr-FR,fr;q=0.9",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("wildcard-only Accept-Language falls back to default", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "*",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("malformed Accept-Language does not throw and falls back", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: ";;;garbage,,,q=not-a-number",
    cookieValue: null,
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "en");
});

test("empty-string cookie is treated as no cookie", async () => {
  const { resolveLocale } = await loadResolveLocale();
  const result = resolveLocale({
    acceptLanguage: "es-ES",
    cookieValue: "",
    supported: SUPPORTED,
    fallback: "en",
  });
  assert.equal(result, "es");
});
