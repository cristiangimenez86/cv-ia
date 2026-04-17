import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * We compile the two pure modules on-the-fly with the TypeScript compiler.
 * This avoids adding test infra (ts-node, vitest) just to cover a few functions.
 */
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

async function loadModule(relativePath) {
  const compiled = compileEsm(relativePath);
  /* Dependencies between the two files: rewrite bare specifier imports
     to a tempfile URL so evaluated modules can resolve them. */
  const tmpDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "cv-ia-test-"));
  const storagePath = path.join(tmpDir, "visitorNameStorage.mjs");
  fs.writeFileSync(storagePath, compileEsm("visitorNameStorage.ts"));

  const renamePath = path.join(tmpDir, "renameDetection.mjs");
  let renameCompiled = compileEsm("renameDetection.ts");
  renameCompiled = renameCompiled.replace(
    /from ["']\.\/visitorNameStorage["']/g,
    `from "${pathToFileURL(storagePath).href}"`,
  );
  fs.writeFileSync(renamePath, renameCompiled);

  if (relativePath === "visitorNameStorage.ts") {
    return import(pathToFileURL(storagePath).href);
  }
  return import(pathToFileURL(renamePath).href);
}

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

function installWindow(storage) {
  globalThis.window = { localStorage: storage };
}
function uninstallWindow() {
  delete globalThis.window;
}

test("visitorNameStorage: normalize trims and clamps", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  assert.equal(mod.normalizeVisitorName("  Ana  "), "Ana");
  assert.equal(mod.normalizeVisitorName(""), null);
  assert.equal(mod.normalizeVisitorName("   \u0000   "), null);
  assert.equal(mod.normalizeVisitorName("x".repeat(100)).length, mod.VISITOR_NAME_MAX_LENGTH);
});

test("visitorNameStorage: write → read roundtrip", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  const storage = new MemoryStorage();
  installWindow(storage);
  try {
    mod.writeVisitorName("Ana María");
    const read = mod.readVisitorNameRecord();
    assert.ok(read);
    assert.equal(read.name, "Ana María");
    assert.equal(read.optedOut, false);
  } finally {
    uninstallWindow();
  }
});

test("visitorNameStorage: opt-out persists with null name", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  const storage = new MemoryStorage();
  installWindow(storage);
  try {
    mod.writeOptOut();
    const read = mod.readVisitorNameRecord();
    assert.ok(read);
    assert.equal(read.name, null);
    assert.equal(read.optedOut, true);
  } finally {
    uninstallWindow();
  }
});

test("visitorNameStorage: clear removes the entry", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  const storage = new MemoryStorage();
  installWindow(storage);
  try {
    mod.writeVisitorName("Sam");
    mod.clearVisitorName();
    assert.equal(mod.readVisitorNameRecord(), null);
  } finally {
    uninstallWindow();
  }
});

test("visitorNameStorage: corrupt JSON returns null", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  const storage = new MemoryStorage();
  storage.setItem(mod.VISITOR_NAME_STORAGE_KEY, "{not json");
  installWindow(storage);
  try {
    assert.equal(mod.readVisitorNameRecord(), null);
  } finally {
    uninstallWindow();
  }
});

test("visitorNameStorage: throwing storage does not crash", async () => {
  const mod = await loadModule("visitorNameStorage.ts");
  const throwing = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
    removeItem() {
      throw new Error("denied");
    },
  };
  installWindow(throwing);
  try {
    assert.equal(mod.readVisitorNameRecord(), null);
    mod.writeVisitorName("Ana");
    mod.clearVisitorName();
  } finally {
    uninstallWindow();
  }
});

test("detectRename: Spanish positives", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectRename("mejor llamame Ana", "es"), "Ana");
  assert.equal(mod.detectRename("Llamame Ana María por favor", "es"), "Ana María");
  assert.equal(mod.detectRename("prefiero que me llames Sam", "es"), "Sam");
  assert.equal(mod.detectRename("decime Juan", "es"), "Juan");
  assert.equal(mod.detectRename("mi nombre es Lucía.", "es"), "Lucía");
  assert.equal(mod.detectRename("soy Pedro", "es"), "Pedro");
});

test("detectRename: English positives", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectRename("please call me Ana", "en"), "Ana");
  assert.equal(mod.detectRename("call me Sam, thanks", "en"), "Sam");
  assert.equal(mod.detectRename("my name is Jean-Luc", "en"), "Jean-Luc");
  assert.equal(mod.detectRename("I'm Ana María", "en"), "Ana María");
  assert.equal(mod.detectRename("you can call me Alex", "en"), "Alex");
});

test("detectRename: rejects empty, single-char, digits-only", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectRename("call me", "en"), null);
  assert.equal(mod.detectRename("call me A", "en"), null);
  assert.equal(mod.detectRename("call me 1234", "en"), null);
  assert.equal(mod.detectRename("", "en"), null);
});

test("detectRename: returns null when no rename intent", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectRename("What is your Azure experience?", "en"), null);
  assert.equal(mod.detectRename("Contame sobre tus proyectos", "es"), null);
});

test("detectRename: fallback to the other locale", async () => {
  const mod = await loadModule("renameDetection.ts");
  /* User is on /en but writes in Spanish */
  assert.equal(mod.detectRename("mejor llamame Ana", "en"), "Ana");
});

test("detectRename: clamps to max length", async () => {
  const mod = await loadModule("renameDetection.ts");
  const long = "call me " + "x".repeat(60);
  const result = mod.detectRename(long, "en");
  assert.ok(result);
  assert.ok(result.length <= 40);
});

test("detectOptOut: Spanish phrases", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectOptOut("prefiero no decirlo", "es"), true);
  assert.equal(mod.detectOptOut("prefiero no", "es"), true);
  assert.equal(mod.detectOptOut("no quiero decir mi nombre", "es"), true);
  assert.equal(mod.detectOptOut("anónimo", "es"), true);
  assert.equal(mod.detectOptOut("anonimo", "es"), true);
  assert.equal(mod.detectOptOut("sin nombre", "es"), true);
});

test("detectOptOut: English phrases", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectOptOut("prefer not to say", "en"), true);
  assert.equal(mod.detectOptOut("I'd rather not say", "en"), true);
  assert.equal(mod.detectOptOut("anonymous please", "en"), true);
  assert.equal(mod.detectOptOut("no name, thanks", "en"), true);
  assert.equal(mod.detectOptOut("skip this", "en"), true);
});

test("detectOptOut: conservative — does not match 'no' alone", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.detectOptOut("no", "en"), false);
  assert.equal(mod.detectOptOut("no thanks", "en"), false);
  assert.equal(mod.detectOptOut("Ana", "es"), false);
  assert.equal(mod.detectOptOut("What is your Azure experience?", "en"), false);
  assert.equal(mod.detectOptOut("", "en"), false);
});

test("extractBareName: valid names", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.extractBareName("Ana"), "Ana");
  assert.equal(mod.extractBareName("Ana María"), "Ana María");
  assert.equal(mod.extractBareName("Jean-Luc"), "Jean-Luc");
  assert.equal(mod.extractBareName("O'Connor"), "O'Connor");
  assert.equal(mod.extractBareName("  Sam  "), "Sam");
});

test("extractBareName: rejects fillers and greetings", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.extractBareName("hola"), null);
  assert.equal(mod.extractBareName("Hi"), null);
  assert.equal(mod.extractBareName("thanks"), null);
  assert.equal(mod.extractBareName("ok"), null);
  assert.equal(mod.extractBareName("sí"), null);
  assert.equal(mod.extractBareName("no"), null);
});

test("extractBareName: rejects questions, digits, too long, wrong charset", async () => {
  const mod = await loadModule("renameDetection.ts");
  assert.equal(mod.extractBareName("What is your experience?"), null);
  assert.equal(mod.extractBareName("¿Cómo estás?"), null);
  assert.equal(mod.extractBareName("user1234"), null);
  assert.equal(mod.extractBareName("Ana <script>"), null);
  assert.equal(mod.extractBareName("x".repeat(50)), null);
  assert.equal(mod.extractBareName("A"), null);
  assert.equal(mod.extractBareName(""), null);
  assert.equal(mod.extractBareName("Ana Maria Luisa Sofia"), null);
});
