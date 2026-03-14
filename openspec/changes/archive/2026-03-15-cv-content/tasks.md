## 1. Baseline and source alignment

- [x] 1.1 Review current EN/ES markdown sections under `content/{en,es}/sections/*` and mark mixed-language fragments in ES sections.
- [x] 1.2 Define section-by-section rewrite scope (about, core-skills, achievements, experience, contact) preserving existing facts and metrics only.
- [x] 1.3 Verify baseline structure with `npm run verify:section-ids` before editing content.

## 2. ES locale content normalization

- [x] 2.1 Rewrite mixed-language ES bullets and summaries into consistent professional Spanish in `content/es/sections/*`.
- [x] 2.2 Normalize ES technology and skill formatting to explicit separators/list items for ATS readability.
- [x] 2.3 Verify ES locale ATS semantics with `npm run verify:cv:ats`.

## 3. Cross-locale consistency and rendering safety

- [x] 3.1 Check EN sections corresponding to modified ES entries and align wording only where parity is required by meaning.
- [x] 3.2 Confirm no section order/ID regressions after content updates.
- [x] 3.3 Verify locale pages render correctly with `npm run verify:cv-pages`.

## 4. Final quality gate

- [x] 4.1 Build frontend to ensure markdown ingestion remains stable: `npm run build:frontend`.
- [x] 4.2 Run full lint pipeline for ATS and section checks: `npm run lint`.
- [x] 4.3 Capture final reviewer checklist (locale consistency, ATS readability, factual integrity) in the change PR description.
