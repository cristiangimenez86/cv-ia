import {
  killPortListeners,
  spawnInherited,
  spawnNpmInherited,
  waitForExit,
  waitForHttpOk
} from "./lib/process-utils.mjs";
import { access } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.CV_BASE_URL ?? "http://localhost:3000";
const parsedBaseUrl = new URL(baseUrl);
const targetPort =
  Number(parsedBaseUrl.port) || (parsedBaseUrl.protocol === "https:" ? 443 : 80);
const locales = ["en", "es"];
const requiredSectionIds = [
  "about",
  "core-skills",
  "key-achievements",
  "experience",
  "education",
  "certifications",
  "languages",
  "contact"
];

const frontendDir = path.resolve(process.cwd(), "frontend");
const standaloneServerCandidates = [
  path.join(frontendDir, ".next", "standalone", "server.js"),
  path.join(frontendDir, ".next", "standalone", "frontend", "server.js")
];

const fileExists = async (targetPath) => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

let server = null;
let shuttingDown = false;

const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  if (server && server.exitCode === null && !server.killed) {
    server.kill("SIGINT");
    await waitForExit(server, 5000);
  }

  if (server && server.exitCode === null && !server.killed) {
    server.kill("SIGTERM");
    await waitForExit(server, 3000);
  }

  // Fallback cleanup in case child process tree leaves listeners behind.
  await killPortListeners(targetPort, { excludePids: [process.pid] });
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(130));
});
process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(143));
});

try {
  await killPortListeners(targetPort, { excludePids: [process.pid] });
  const standaloneServerPath = (
    await Promise.all(
      standaloneServerCandidates.map(async (candidate) =>
        (await fileExists(candidate)) ? candidate : null
      )
    )
  ).find(Boolean);

  if (standaloneServerPath) {
    server = spawnInherited("node", [standaloneServerPath], {
      cwd: frontendDir,
      env: {
        ...process.env,
        PORT: String(targetPort)
      }
    });
  } else {
    server = spawnNpmInherited(["--prefix", "frontend", "run", "start"]);
  }
  await waitForHttpOk(`${baseUrl}/en`);

  for (const locale of locales) {
    const response = await fetch(`${baseUrl}/${locale}`);
    const html = await response.text();
    if (!html.includes(`<html lang="${locale}">`)) {
      throw new Error(`Missing html lang="${locale}" on /${locale}`);
    }
    if (!html.toLowerCase().includes("<h1")) {
      throw new Error(`Missing H1 heading on /${locale}`);
    }
    for (const sectionId of requiredSectionIds) {
      if (!html.includes(`id="${sectionId}"`)) {
        throw new Error(`Missing section id "${sectionId}" on /${locale}`);
      }
    }
  }

  console.log("Locale page validation passed.");
} finally {
  await shutdown();
}
