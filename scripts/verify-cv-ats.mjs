import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [
  "frontend/src/app/[locale]",
  "frontend/src/components/Section.tsx",
  "frontend/src/components/CoreSkillsSection.tsx",
  "frontend/src/components/KeyAchievementsSection.tsx",
  "frontend/src/components/ExperienceSection.tsx",
  "frontend/src/components/EducationSection.tsx",
  "frontend/src/components/CertificationsSection.tsx",
  "frontend/src/components/LanguagesSection.tsx",
  "frontend/src/components/ContactSection.tsx"
];
const forbiddenSnippets = [
  "\"use client\"",
  "<details",
  "role=\"tab\"",
  "display:none",
  "visibility:hidden"
];

const violations = [];

const walk = (dir) => {
  const metadata = statSync(dir);
  if (!metadata.isDirectory()) {
    const content = readFileSync(dir, "utf8");
    for (const snippet of forbiddenSnippets) {
      if (content.includes(snippet)) {
        violations.push(`${dir}: contains forbidden ATS pattern "${snippet}"`);
      }
    }
    return;
  }

  for (const entry of readdirSync(dir)) {
    const filePath = join(dir, entry);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath);
      continue;
    }
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx") && !filePath.endsWith(".css")) {
      continue;
    }
    const content = readFileSync(filePath, "utf8");
    for (const snippet of forbiddenSnippets) {
      if (content.includes(snippet)) {
        violations.push(`${filePath}: contains forbidden ATS pattern "${snippet}"`);
      }
    }
  }
};

for (const root of roots) {
  if (!existsSync(root)) {
    violations.push(`${root}: path not found for ATS compliance scan`);
    continue;
  }
  walk(root);
}

if (violations.length > 0) {
  console.error("ATS compliance check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("ATS compliance source check passed.");
