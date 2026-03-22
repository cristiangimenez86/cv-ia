"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const HEALTH_URL = `${API_BASE_URL}/health`;

const POLL_INTERVAL_MS = 15000;
const REQUEST_TIMEOUT_MS = 3000;

type HealthState = "pending" | "healthy" | "unhealthy";

export function BackendHealthIndicator() {
  const [state, setState] = useState<HealthState>("pending");

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(HEALTH_URL, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!isMounted) {
          return;
        }

        setState(response.ok ? "healthy" : "unhealthy");
      } catch {
        if (isMounted) {
          setState("unhealthy");
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void checkHealth();
    const intervalId = window.setInterval(() => {
      void checkHealth();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (state !== "unhealthy") {
    return null;
  }

  const label = "Backend health: error — no response or unhealthy";

  return (
    <div
      className="fixed bottom-3 left-3 z-[70] inline-flex items-center justify-center"
      title={label}
      aria-label={label}
      role="status"
    >
      <span
        className="h-3 w-3 rounded-full border border-black/20 bg-red-500"
        aria-hidden
      />
    </div>
  );
}
