## Context

`cv-static` is a frontend rebuild change, not an incremental polish. The live CV visual behavior is already implemented in `/web` and fully specified in `docs/product/visual-spec.md`; `/frontend` must be reimplemented from that canonical source while preserving ATS constraints and markdown-driven bilingual content from `/content/{en|es}/sections/`.

This is cross-cutting because it touches frontend architecture, asset pipeline, locale routing, content loading, and verification workflows consumed by both local contributors and CI.

## Goals / Non-Goals

**Goals:**
- Recreate `/frontend` visual/UI behavior by copying implementation artifacts from `/web` with minimal adaptation.
- Keep `/content` as the single source of truth for rendered CV data (EN/ES markdown + `content/site.json`).
- Preserve SSR/SSG-only rendering for core CV content and semantic HTML required for ATS parsing.
- Keep frontend/backend contract assumptions stable (section IDs, readiness checks, verification workflows).

**Non-Goals:**
- Inventing new visual styles, component patterns, or interaction behavior.
- Building new backend features or changing API surface beyond compatibility checks.
- Introducing client-side-only rendering for CV content.

## Decisions

1. **`/web` as implementation baseline, not inspiration**
   - Decision: Copy CSS/components/public assets/layout routes directly from `/web`; only adapt import paths and content-loader integration.
   - Rationale: Eliminates design drift and enforces parity with live production behavior.
   - Alternative considered: rebuild from docs only. Rejected due to avoidable mismatch risk.

2. **Server-rendered markdown content pipeline remains authoritative**
   - Decision: Locale pages in `/frontend` load from `/content/{en|es}/sections/` and `content/site.json` at server/build time.
   - Rationale: Meets ATS requirement that critical content exists in initial HTML.
   - Alternative considered: client-side hydration pipeline. Rejected (ATS non-compliant).

3. **Verification-first migration**
   - Decision: Update verification scripts/CI to assert locale routes, ATS-safe patterns, and section-ID contract compatibility during and after migration.
   - Rationale: Full rebuild needs regression guardrails before archive.
   - Alternative considered: visual/manual validation only. Rejected due to higher regression risk.

## Risks / Trade-offs

- [Risk] Import/path mismatches during direct copy from `/web` -> Mitigation: migrate by domain (styles, components, assets, routes) with compile checks at each step.
- [Risk] Hidden behavior differences between `/web` and `/frontend` runtime assumptions -> Mitigation: enforce parity checks (`build`, locale page validation, ATS checks) in CI.
- [Risk] Content parser inconsistencies for bilingual markdown -> Mitigation: retain server-side loader contract and fail-fast on missing/invalid sections.

## Migration Plan

1. Copy global styles/tokens and tailwind config from `/web` into `/frontend`.
2. Copy component tree and public assets from `/web`; adapt imports only.
3. Copy locale app routes/layout structure and wire to `/content` loader paths.
4. Reconnect verification workflow (ATS checks, locale rendering checks, section-id checks).
5. Run full lint/build/test/verification suite and validate EN/ES parity in generated HTML.

## Open Questions

- Should chat widget ship in phase one of the `/frontend` rebuild or remain behind a feature flag while preserving layout parity?
- Are there any `/web` dependencies currently absent in `/frontend` that should be mirrored exactly versus shimmed temporarily?
