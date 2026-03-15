# CV AI Export Download Specification

## Purpose
Define requirements for exporting locale CV content as a stable, machine-readable JSON payload for external AI consumers.

## Requirements
### Requirement: Locale CV page SHALL provide AI-oriented JSON export
The frontend SHALL provide a functional JSON download action from the profile card that exports the currently active locale CV content as a machine-readable payload.

#### Scenario: User downloads locale JSON export
- **WHEN** a user clicks the "Download JSON" action on `/en` or `/es`
- **THEN** the browser downloads a JSON file for the active locale
- **AND** the filename follows `cv.<locale>.ai.json`

### Requirement: Export payload SHALL use stable AI schema
The exported JSON SHALL include top-level metadata (`version`, `generatedAt`, `locale`), profile information, and section data with both raw markdown and normalized plain text.

#### Scenario: Consumer parses exported JSON
- **WHEN** an external AI tool reads the downloaded file
- **THEN** all required top-level fields are present with deterministic names
- **AND** each exported section includes `id`, `title`, `markdown`, and `plainText`

### Requirement: Export content SHALL remain locale-consistent and factual
The export generator SHALL use the same locale-configured content already loaded for page rendering and SHALL not inject derived claims not present in source content.

#### Scenario: Export matches rendered locale content
- **WHEN** the user downloads JSON from a locale page
- **THEN** exported profile and sections correspond to that locale's rendered content
- **AND** no additional achievements, metrics, or synthetic claims are added
