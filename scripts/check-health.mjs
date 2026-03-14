const healthUrl = process.env.BACKEND_HEALTH_URL ?? "http://localhost:8080/health";
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS ?? "60000");
const pollMs = Number(process.env.HEALTH_POLL_MS ?? "1500");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startedAt = Date.now();
let lastError = "unknown error";

while (Date.now() - startedAt < timeoutMs) {
  try {
    const response = await fetch(healthUrl);
    if (response.ok) {
      const body = await response.json();
      if (body && typeof body.status === "string") {
        console.log(`Health check passed: ${body.status}`);
        process.exit(0);
      }
      lastError = "response missing status field";
    } else {
      lastError = `unexpected HTTP status ${response.status}`;
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }
  await sleep(pollMs);
}

console.error(`Health check failed for ${healthUrl}: ${lastError}`);
process.exit(1);
