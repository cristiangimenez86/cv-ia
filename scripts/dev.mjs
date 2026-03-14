import { spawnInherited, spawnNpmInherited, waitForExit } from "./lib/process-utils.mjs";

const run = (label, command, args) => {
  const child = spawnInherited(command, args);
  return withExitCode(label, child);
};

const runNpm = (label, args) => {
  const child = spawnNpmInherited(args);
  return withExitCode(label, child);
};

const withExitCode = (label, child) => {
  child.on("exit", (code) => {
    if (code !== 0) {
      process.exitCode = code ?? 1;
    }
  });
  return { label, child };
};

const procs = [
  run("backend", "dotnet", ["run", "--project", "backend/CvIa.Backend.csproj"]),
  runNpm("frontend", ["--prefix", "frontend", "run", "dev"])
];

let shuttingDown = false;

const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const proc of procs) {
    if (proc.child.exitCode === null && !proc.child.killed) {
      proc.child.kill("SIGINT");
    }
  }

  await Promise.all(procs.map((proc) => waitForExit(proc.child, 5000)));

  for (const proc of procs) {
    if (proc.child.exitCode === null && !proc.child.killed) {
      proc.child.kill("SIGTERM");
    }
  }
};

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
