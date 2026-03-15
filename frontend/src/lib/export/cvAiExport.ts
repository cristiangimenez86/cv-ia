import type { Locale, Profile, SectionContent } from "@/lib/content/types";

export interface CvAiExportSection {
  id: string;
  title: string;
  markdown: string;
  plainText: string;
}

export interface CvAiExportDocument {
  version: string;
  generatedAt: string;
  locale: Locale;
  targetRole?: string;
  profile: {
    fullName: string;
    headline: string;
    location: string;
    email: string;
    phone?: string;
    links: Array<{ label: string; href: string }>;
  };
  sections: CvAiExportSection[];
}

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function buildCvAiExportDocument(input: {
  locale: Locale;
  profile: Profile;
  headline: string;
  location: string;
  targetRole?: string;
  sections: SectionContent[];
}): CvAiExportDocument {
  const { locale, profile, headline, location, targetRole, sections } = input;

  return {
    version: "1.0",
    generatedAt: new Date().toISOString(),
    locale,
    targetRole,
    profile: {
      fullName: profile.fullName,
      headline,
      location,
      email: profile.email,
      phone: profile.phone,
      links: profile.links ?? [],
    },
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      markdown: section.body ?? "",
      plainText: markdownToPlainText(section.body ?? ""),
    })),
  };
}

export function getCvAiExportFilename(locale: Locale): string {
  return `cv.${locale}.ai.json`;
}

export function toDownloadDataUrl(payload: CvAiExportDocument): string {
  const json = JSON.stringify(payload, null, 2);
  return `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
}
