# cv-chat-widget-polish Specification

## Purpose
TBD - created by archiving change chat-panel-desktop-polish. Update Purpose after archive.
## Requirements
### Requirement: Chat panel SHALL use size constraints appropriate to viewport

On non-mobile viewports the chat panel SHALL be large enough for comfortable reading; on small screens it SHALL remain usable without horizontal overflow.

#### Scenario: Desktop-sized viewport

- **WHEN** the viewport is at least the `md` breakpoint (768px)
- **THEN** the panel width SHALL be 600px and height 700px where the viewport allows
- **AND** height SHALL clamp to available viewport space so the panel does not overflow vertically

#### Scenario: Phone-sized viewport

- **WHEN** the viewport is below the `sm` breakpoint
- **THEN** the panel SHALL continue to use near-full-bleed insets with a maximum height derived from dynamic viewport height
- **AND** the layout SHALL not require horizontal scrolling for the default panel chrome

#### Scenario: Tablet between sm and md

- **WHEN** the viewport is between `sm` and `md`
- **THEN** the panel SHALL use fluid max width and height so it fits within the viewport with margin

### Requirement: Open chat SHALL dim and blur the page behind it

While the chat is open, the main page content SHALL be visually de-emphasized using a semi-transparent overlay combined with backdrop blur.

#### Scenario: Chat opens

- **WHEN** the user opens the chat panel
- **THEN** a full-viewport layer beneath the panel SHALL apply backdrop blur and dimming above the page content

#### Scenario: Chat closes

- **WHEN** the user closes the chat via the close control, clicking outside the panel, or pressing Escape
- **THEN** the blur and dim layer SHALL be removed

### Requirement: Assistant messages SHALL render Markdown with safe styling

Assistant message bodies SHALL be rendered as Markdown (including bold, italic, lists, inline code, and fenced code blocks). User messages SHALL remain plain text.

#### Scenario: Markdown typography

- **WHEN** an assistant message contains Markdown such as bold, italics, lists, or code spans
- **THEN** the UI SHALL render the corresponding styled HTML within the assistant bubble
- **AND** styling SHALL be consistent with the site theme (tokens / typography)

### Requirement: Links in assistant Markdown SHALL be restricted to CV section anchors

The renderer SHALL only allow link targets that point to the locale home path with a fragment matching a known CV section ID. All other link URLs SHALL be stripped or rendered as non-navigating text.

#### Scenario: Allowed section link

- **WHEN** the rendered assistant content includes a link to `/{locale}#experience` (or equivalent normalized form) and `experience` is an allowed section ID
- **THEN** the link SHALL be interactive and navigable

#### Scenario: Disallowed URL

- **WHEN** the assistant content includes a link to an external URL or unknown path
- **THEN** the UI SHALL not navigate to that URL (link removed or shown as plain text)

### Requirement: Following a valid section link SHALL close the chat and scroll to the section

When the user activates a validated in-app section link from the chat, the chat panel SHALL close and the application SHALL navigate to the locale home with the hash so the target section is visible.

#### Scenario: Navigate from chat

- **WHEN** the user clicks a validated in-app section link inside an assistant message
- **THEN** the chat SHALL close
- **AND** the browser SHALL show the CV page at `/{locale}` with the correct section anchor

