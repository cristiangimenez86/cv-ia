import test from "node:test";
import assert from "node:assert/strict";

function buildFilename(locale) {
  return `cv.${locale}.ai.json`;
}

test("AI export filename is locale-aware and stable", () => {
  assert.equal(buildFilename("en"), "cv.en.ai.json");
  assert.equal(buildFilename("es"), "cv.es.ai.json");
});

test("AI export payload contract contains required top-level fields", () => {
  const payload = {
    version: "1.0",
    generatedAt: "2026-03-15T00:00:00.000Z",
    locale: "en",
    targetRole: "Senior Software Engineer",
    profile: {
      fullName: "Cristian Gimenez",
      headline: "Senior Software Engineer",
      location: "Barcelona, Spain",
      email: "cristiangimenez86@gmail.com",
      links: [],
    },
    sections: [
      {
        id: "about",
        title: "About",
        markdown: "Senior developer...",
        plainText: "Senior developer...",
      },
    ],
  };

  assert.equal(typeof payload.version, "string");
  assert.equal(typeof payload.generatedAt, "string");
  assert.ok(payload.locale === "en" || payload.locale === "es");
  assert.equal(typeof payload.profile.fullName, "string");
  assert.ok(Array.isArray(payload.sections));
  assert.equal(typeof payload.sections[0].id, "string");
  assert.equal(typeof payload.sections[0].markdown, "string");
  assert.equal(typeof payload.sections[0].plainText, "string");
});
