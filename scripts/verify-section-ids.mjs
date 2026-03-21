import { readFileSync } from "node:fs";

const shared = JSON.parse(readFileSync("shared/section-ids.json", "utf8"));
/** Must match CvIa.Infrastructure.Services.CvMarkdownSectionIds.Ordered */
const backendOrderedIds = [
  "about",
  "core-skills",
  "key-achievements",
  "experience",
  "education",
  "certifications",
  "languages",
  "contact",
];
const site = JSON.parse(readFileSync("content/site.json", "utf8"));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

if (!equals(shared, backendOrderedIds)) {
  fail("Section ID mismatch between shared and backend CvMarkdownSectionIds (see backend CvMarkdownSectionIds.cs).");
}

if (!equals(shared, site.sectionsOrder)) {
  fail("Section ID mismatch between shared contract and content site.sectionsOrder.");
}

if (!equals(shared, site.requiredSections.map((section) => section.id))) {
  fail("Section ID mismatch between shared contract and content requiredSections.");
}

console.log("Section ID contract check passed.");
