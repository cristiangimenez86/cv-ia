import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "frontend";
const denyTokens = ["openai", "api.openai.com"];
const ignoreDirs = new Set(["node_modules", ".next", ".git"]);
const allowExt = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]);

const hasAllowedExt = (path) => {
  for (const ext of allowExt) {
    if (path.endsWith(ext)) return true;
  }
  return false;
};

const scan = (dir, violations) => {
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!ignoreDirs.has(item)) scan(path, violations);
      continue;
    }
    if (!hasAllowedExt(path)) continue;
    const content = readFileSync(path, "utf8").toLowerCase();
    if (denyTokens.some((token) => content.includes(token))) {
      violations.push(path);
    }
  }
};

const violations = [];
scan(root, violations);

if (violations.length > 0) {
  console.error("Frontend boundary check failed. Remove direct OpenAI usage references:");
  for (const item of violations) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Frontend boundary check passed.");
