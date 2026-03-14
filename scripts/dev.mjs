import { spawn } from "node:child_process";

const run = (label, command, args) => {
  const child = spawn(command, args, { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (code !== 0) {
      process.exitCode = code ?? 1;
    }
  });
  return { label, child };
};

const procs = [
  run("backend", "dotnet", ["run", "--project", "backend/CvIa.Backend.csproj"]),
  run("frontend", "npm", ["--prefix", "frontend", "run", "dev"])
];

const shutdown = () => {
  for (const proc of procs) {
    if (!proc.child.killed) {
      proc.child.kill("SIGINT");
    }
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
