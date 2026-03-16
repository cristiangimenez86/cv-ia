"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const HEALTH_URL = `${API_BASE_URL}/health`;

const POLL_INTERVAL_MS = 15000;
const REQUEST_TIMEOUT_MS = 3000;

export function BackendHealthIndicator() {
  const [isHealthy, setIsHealthy] = useState(false);

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

        setIsHealthy(response.ok);
      } catch {
        if (isMounted) {
          setIsHealthy(false);
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

  const title = useMemo(
    () => (isHealthy ? "Backend health: OK" : "Backend health: Error"),
    [isHealthy],
  );

  return (
    <div
      className="fixed bottom-3 left-3 z-[70] inline-flex items-center justify-center"
      title={title}
      aria-label={title}
      role="status"
    >
      <span
        className={`h-3 w-3 rounded-full border border-black/20 ${
          isHealthy ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </div>
  );
}

