import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const spawnInherited = (command, args, options = {}) =>
  spawn(command, args, {
    stdio: "inherit",
    ...options
  });

export const spawnNpmInherited = (args, options = {}) => {
  if (process.platform === "win32") {
    return spawnInherited(
      process.env.ComSpec || "cmd.exe",
      ["/d", "/s", "/c", "npm", ...args],
      options
    );
  }
  return spawnInherited("npm", args, options);
};

const parseWindowsNetstat = (stdout, port) => {
  const pids = new Set();
  const lines = stdout.split(/\r?\n/);
  for (const line of lines) {
    const normalized = line.trim();
    if (!normalized.startsWith("TCP")) continue;
    if (!normalized.includes(`:${port}`)) continue;
    if (!normalized.includes("LISTENING")) continue;
    const parts = normalized.split(/\s+/);
    const pid = Number(parts.at(-1));
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }
  return [...pids];
};

const parseLsof = (stdout) => {
  const pids = new Set();
  for (const line of stdout.split(/\r?\n/)) {
    const pid = Number(line.trim());
    if (Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }
  return [...pids];
};

const parseSs = (stdout, port) => {
  const pids = new Set();
  const lines = stdout.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes(`:${port}`)) continue;
    const matches = line.matchAll(/pid=(\d+)/g);
    for (const match of matches) {
      const pid = Number(match[1]);
      if (Number.isInteger(pid) && pid > 0) {
        pids.add(pid);
      }
    }
  }
  return [...pids];
};

export const getListeningPids = async (port) => {
  if (process.platform === "win32") {
    try {
      const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"]);
      return parseWindowsNetstat(stdout, port);
    } catch {
      return [];
    }
  }

  try {
    const { stdout } = await execFileAsync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]);
    const pids = parseLsof(stdout);
    if (pids.length > 0) {
      return pids;
    }
  } catch {}

  try {
    const { stdout } = await execFileAsync("ss", ["-ltnp"]);
    return parseSs(stdout, port);
  } catch {
    return [];
  }
};

const isPidAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

export const waitForExit = (child, timeoutMs = 5000) =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.killed) {
      resolve();
      return;
    }

    const onExit = () => {
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      child.off("exit", onExit);
      resolve();
    }, timeoutMs);

    child.once("exit", onExit);
  });

export const terminatePid = async (pid, { gracefulMs = 3000 } = {}) => {
  if (!Number.isInteger(pid) || pid <= 0) return;
  if (!isPidAlive(pid)) return;

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }

  const deadline = Date.now() + gracefulMs;
  while (Date.now() < deadline) {
    if (!isPidAlive(pid)) return;
    await sleep(150);
  }

  if (!isPidAlive(pid)) return;
  try {
    process.kill(pid, "SIGKILL");
  } catch {}
};

export const killPortListeners = async (port, { excludePids = [] } = {}) => {
  const exclusions = new Set(excludePids.filter((pid) => Number.isInteger(pid) && pid > 0));
  const pids = await getListeningPids(port);
  for (const pid of pids) {
    if (exclusions.has(pid)) continue;
    await terminatePid(pid);
  }
  return pids.filter((pid) => !exclusions.has(pid));
};

export const waitForHttpOk = async (url, { timeoutMs = 60000, pollMs = 1500 } = {}) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(pollMs);
  }
  throw new Error(`Timed out waiting for HTTP 200 from ${url}`);
};
