import { CV_SECTION_ID_SET } from "./cvSectionIds";

const LOCALE_PATTERN = /^\/(en|es)\/?$/;

export type CvPdfChatLink = {
  /** Same-origin path + query, e.g. `/api/v1/cv?lang=es` */
  fetchPath: string;
  lang: "en" | "es";
};

/**
 * Recognizes assistant Markdown links to the CV PDF API. Returns null for any other href.
 */
export function parseCvPdfChatLink(href: string | undefined): CvPdfChatLink | null {
  if (!href?.trim()) {
    return null;
  }

  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }

  const noHash = trimmed.includes("#") ? trimmed.slice(0, trimmed.indexOf("#")) : trimmed;
  const pathQuery = noHash.startsWith("/") ? noHash : `/${noHash}`;

  try {
    const u = new URL(pathQuery, "http://localhost");
    if (u.pathname.replace(/\/$/, "") !== "/api/v1/cv") {
      return null;
    }
    const langRaw = u.searchParams.get("lang")?.toLowerCase();
    if (langRaw !== "en" && langRaw !== "es") {
      return null;
    }
    return {
      fetchPath: `/api/v1/cv?lang=${langRaw}`,
      lang: langRaw,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a safe in-app href `/{locale}#fragment` or null if the link must not navigate.
 * Allows only fragment links and home paths `/`, `/en`, `/es` with hash; rejects external URLs.
 */
export function normalizeCvSectionHref(
  href: string | undefined,
  chatLocale: string,
): string | null {
  if (!href?.trim()) {
    return null;
  }

  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes(":") && !trimmed.startsWith("/") && !trimmed.startsWith("#")) {
    return null;
  }

  let fragment = "";
  if (trimmed.startsWith("#")) {
    fragment = trimmed.slice(1).split("?")[0];
  } else if (trimmed.startsWith("/")) {
    const hashIdx = trimmed.indexOf("#");
    const pathPart = (hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed).split("?")[0];
    fragment =
      hashIdx >= 0 ? trimmed.slice(hashIdx + 1).split("?")[0] : "";
    if (!fragment) {
      return null;
    }
    const path = pathPart.replace(/\/$/, "") || "/";
    if (path !== "/" && !LOCALE_PATTERN.test(path)) {
      return null;
    }
  } else {
    return null;
  }

  if (!fragment || !CV_SECTION_ID_SET.has(fragment)) {
    return null;
  }

  const locale = chatLocale === "es" ? "es" : "en";
  return `/${locale}#${fragment}`;
}
