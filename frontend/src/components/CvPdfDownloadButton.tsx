"use client";

import { useCallback, useState } from "react";
import { Download } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { downloadCvPdfClient } from "@/lib/cvPdfDownload";

type CvPdfDownloadButtonProps = {
  /** Absolute path on same origin (e.g. `/api/v1/cv?lang=en`) or full URL to the API. */
  fetchUrl: string;
  locale: Locale;
  /** When `fetchUrl` points at the public API host, optional bearer (typically `NEXT_PUBLIC_API_ACCESS_TOKEN`). */
  accessToken?: string;
  /** Visual variant: full-width card button or compact header control. */
  variant: "profile" | "header";
  downloadLabel: string;
};

/**
 * Programmatic PDF download so `Authorization: Bearer` can be sent (not possible with raw `<a href>` to another origin).
 */
export function CvPdfDownloadButton({
  fetchUrl,
  locale,
  accessToken = "",
  variant,
  downloadLabel,
}: CvPdfDownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await downloadCvPdfClient(fetchUrl, `cv-${locale}`, accessToken);
    } finally {
      setBusy(false);
    }
  }, [busy, fetchUrl, accessToken, locale]);

  if (variant === "profile") {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className="cv-button cv-button-primary disabled:opacity-60"
        aria-label={downloadLabel}
      >
        {downloadLabel}
      </button>
    );
  }

  /* Icon-only until `lg`: phone landscape often exceeds `md` (768px) width, which hid the icon+label tradeoff. */
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className="cv-button disabled:opacity-60"
      aria-label={downloadLabel}
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden />
      <span>{downloadLabel}</span>
    </button>
  );
}
