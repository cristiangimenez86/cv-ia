import { spawn } from "node:child_process";
import { execSync } from "node:child_process";

const baseUrl = process.env.CV_BASE_URL ?? "http://localhost:3000";
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  const timeoutMs = 60000;
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/en`);
      if (response.ok) return;
    } catch {}
    await sleep(1500);
  }
  throw new Error("Timed out waiting for Next.js server.");
};

const npmCommand = process.platform === "win32" ? "powershell.exe" : "npm";
const npmArgs =
  process.platform === "win32"
    ? ["-NoProfile", "-Command", "npm --prefix frontend run start"]
    : ["--prefix", "frontend", "run", "start"];

try {
  const output = execSync("powershell -NoProfile -Command \"$conn=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if($conn){$conn.OwningProcess}\"", { encoding: "utf8" }).trim();
  if (output.length > 0) {
    execSync(`powershell -NoProfile -Command "Stop-Process -Id ${output} -Force"`, { stdio: "ignore" });
  }
} catch {}

const server = spawn(npmCommand, npmArgs, { stdio: "inherit" });

const shutdown = () => {
  if (server.exitCode === null && !server.killed) {
    server.kill("SIGINT");
  }
  try {
    const output = execSync("powershell -NoProfile -Command \"$conn=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if($conn){$conn.OwningProcess}\"", { encoding: "utf8" }).trim();
    if (output.length > 0) {
      execSync(`powershell -NoProfile -Command "Stop-Process -Id ${output} -Force"`, { stdio: "ignore" });
    }
  } catch {}
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await waitForServer();

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
  shutdown();
}
