## ADDED Requirements

### Requirement: Frontend UI MUST be rebuilt from web implementation artifacts
The frontend MUST be reimplemented by copying canonical UI artifacts from `/web` into `/frontend`, with changes limited to import/path adaptation and content-source wiring.

#### Scenario: Canonical artifacts are copied without visual invention
- **WHEN** the rebuild is completed
- **THEN** `/frontend` contains copied equivalents of `/web/src/app/globals.css`, `/web/src/components/`, `/web/public/`, `/web/tailwind.config.ts`, and `/web/src/app/[locale]/`
- **AND** no new style system, component family, or asset set is introduced outside those canonical sources

### Requirement: Frontend visual behavior MUST follow the visual contract exactly
The rebuilt frontend MUST match `docs/product/visual-spec.md` for tokens, class-level behavior, layout constants, section composition, and responsive behavior.

#### Scenario: Visual contract validation
- **WHEN** reviewers compare rebuilt `/frontend` output against the visual contract
- **THEN** token values, layout structure, and defined interactive states are consistent with `docs/product/visual-spec.md`
- **AND** deviations are treated as defects unless explicitly approved by updated product documentation
