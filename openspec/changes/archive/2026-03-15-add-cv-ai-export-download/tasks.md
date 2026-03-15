## 1. Export schema and serialization

- [x] 1.1 Define TypeScript types for AI export payload (`version`, `generatedAt`, `locale`, `profile`, `sections`).
- [x] 1.2 Implement a frontend serializer utility that converts loaded site config + section content into the export schema.
- [x] 1.3 Add plain-text normalization for section markdown to include both `markdown` and `plainText` in each section entry.

## 2. Profile card download wiring

- [x] 2.1 Replace the visual-only "Download JSON" button with a functional client action in `ProfileCard`.
- [x] 2.2 Implement browser download flow using Blob + object URL with locale-aware filename `cv.<locale>.ai.json`.
- [x] 2.3 Ensure export uses active locale data from the rendered page and does not introduce synthetic claims.

## 3. Validation and quality checks

- [x] 3.1 Add or update lightweight tests for export structure and filename behavior.
- [x] 3.2 Verify manual behavior on both `/en` and `/es` pages (download starts and JSON shape is correct).
- [x] 3.3 Run verification commands: `npm run lint:frontend` and `npm run verify:section-ids`.
