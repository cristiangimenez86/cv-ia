## MODIFIED Requirements

### Requirement: Locale CV pages MUST render from markdown content source
The frontend MUST render `/en` and `/es` CV pages from `/content/{en|es}/sections/*.md` and locale metadata in `content/site.json`, without hardcoded CV body content in UI components, and MUST preserve single-language consistency within each locale content file.

#### Scenario: Locale page build with markdown source
- **WHEN** the frontend builds or server-renders a locale CV route
- **THEN** section bodies are derived from locale markdown files and section order/profile metadata are derived from `content/site.json`
- **AND** the rendered page does not depend on client-side data fetching to populate core CV content
- **AND** each rendered section for a locale reflects content authored in that same locale language

### Requirement: Content structure MUST preserve stable section mapping
The rendering pipeline MUST map markdown files to stable section IDs, preserve the required section order for both locales, and maintain parser-friendly list structures for skills and technology keywords.

#### Scenario: Stable section mapping across locales
- **WHEN** EN and ES locale pages are rendered
- **THEN** both pages include the same section ID set and canonical ordering required by product docs
- **AND** missing or mismatched section IDs fail verification
- **AND** skill and technology lists remain machine-readable through explicit markdown list or separator formatting
