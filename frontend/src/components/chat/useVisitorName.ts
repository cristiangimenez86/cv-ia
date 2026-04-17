"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearVisitorName,
  readVisitorNameRecord,
  writeOptOut,
  writeVisitorName,
  type VisitorNameRecord,
} from "./visitorNameStorage";
import { detectRename } from "./renameDetection";

export type VisitorNameStatus = "loading" | "needs-prompt" | "has-name" | "opted-out";

export type UseVisitorNameResult = {
  /** Current stored name (null when the visitor opted out or never submitted). */
  name: string | null;
  /** True when the visitor chose "prefer not to say". */
  optedOut: boolean;
  /** Coarse state that callers use to decide what UI to render. */
  status: VisitorNameStatus;
  /** Persist a new name (trims + normalizes internally). */
  setName: (name: string) => void;
  /** Persist the "prefer not to say" choice. */
  optOut: () => void;
  /** Clear the stored value so the first-use prompt shows again next time. */
  forget: () => void;
  /** Pure helper: inspect a user message and return a new name when a rename intent is detected. */
  detectRename: (text: string, locale: "es" | "en") => string | null;
};

function statusFromRecord(record: VisitorNameRecord | null): VisitorNameStatus {
  if (!record) {
    return "needs-prompt";
  }
  if (record.optedOut) {
    return "opted-out";
  }
  if (record.name && record.name.length > 0) {
    return "has-name";
  }
  return "needs-prompt";
}

/**
 * React hook that wraps visitor-name storage + rename detection.
 *
 * SSR-safe: storage access is deferred to `useEffect`, so the initial render
 * returns `status: "loading"` on the server and hydrates to the real value on
 * the client without producing a hydration mismatch warning.
 */
export function useVisitorName(): UseVisitorNameResult {
  const [record, setRecord] = useState<VisitorNameRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecord(readVisitorNameRecord());
    setHydrated(true);
  }, []);

  const setName = useCallback((next: string) => {
    const written = writeVisitorName(next);
    if (written) {
      setRecord(written);
    }
  }, []);

  const optOut = useCallback(() => {
    setRecord(writeOptOut());
  }, []);

  const forget = useCallback(() => {
    clearVisitorName();
    setRecord(null);
  }, []);

  const status: VisitorNameStatus = hydrated ? statusFromRecord(record) : "loading";

  return {
    name: record?.name ?? null,
    optedOut: record?.optedOut === true,
    status,
    setName,
    optOut,
    forget,
    detectRename,
  };
}
