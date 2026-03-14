## ADDED Requirements

### Requirement: Locale content quality MUST be consistent and ATS-readable
The content source under `content/{lang}/sections/*` MUST preserve single-language consistency per locale, use parser-friendly markdown list formatting, and keep claims factual and verifiable from existing profile evidence.

#### Scenario: ES locale content quality verification
- **WHEN** validation inspects markdown files under `content/es/sections/*`
- **THEN** each section uses Spanish consistently without mixed-language sentence fragments
- **AND** skill/technology entries are represented with explicit separators or list items suitable for ATS parsing

#### Scenario: Claim integrity preservation during rewrite
- **WHEN** content rewrite updates achievement or experience bullets
- **THEN** rewritten text preserves original factual claims, entities, and scope
- **AND** no new metrics, achievements, or unverifiable outcomes are introduced
