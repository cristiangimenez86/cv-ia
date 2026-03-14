## MODIFIED Requirements

### Requirement: Core CV content MUST be ATS-compliant in initial HTML
The frontend MUST deliver CV sections as SSR/SSG-rendered semantic HTML so ATS parsers can extract content without client-side execution, and locale-authored content MUST remain faithful to source markdown semantics after rendering.

#### Scenario: ATS parser reads locale page response
- **WHEN** an ATS parser requests `/en` or `/es`
- **THEN** core CV sections and text content are present in the initial HTML response
- **AND** content is not hidden behind client-only rendering patterns
- **AND** lists and bullet structures used for skills and achievements are represented in semantic HTML elements

### Requirement: Locale semantics MUST remain valid and accessible
The frontend MUST set locale-correct document language, preserve semantic heading/list structure for all required CV sections, and reject mixed-language section authoring within a single locale route.

#### Scenario: Locale semantic validation
- **WHEN** validation checks inspect `/en` and `/es` HTML output
- **THEN** each route has the correct language semantics for its locale
- **AND** required section headings and list semantics are present and machine-readable
- **AND** sections for one locale do not contain mixed-language sentence fragments from another locale
