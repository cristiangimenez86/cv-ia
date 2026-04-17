## ADDED Requirements

### Requirement: Chat SHALL ask the visitor's preferred name conversationally on first use

On the first time the chat panel is opened in a given browser (no stored visitor name and no prior opt-out), the panel SHALL seed a single assistant message asking how the visitor would like to be called. The message SHALL make clear that answering is optional: the visitor MAY reply with a name, MAY decline explicitly with a short bilingual phrase (for example "prefer not to say" / "prefiero no decirlo"), or MAY ignore the question and ask something else — in which case the chat SHALL continue normally. The main message input SHALL remain enabled at all times; no separate form, modal, or browser prompt SHALL be used.

#### Scenario: First visit in Spanish locale

- **WHEN** the chat panel opens for the first time and the active locale is `es`
- **THEN** the panel SHALL seed a single Spanish assistant message asking the visitor how they would like to be called and indicating that declining or ignoring the question is acceptable
- **AND** the main message input SHALL be enabled so the visitor can reply with plain text

#### Scenario: First visit in English locale

- **WHEN** the chat panel opens for the first time and the active locale is `en`
- **THEN** the panel SHALL seed the equivalent English assistant message with the same affordances

#### Scenario: Visitor replies with a name

- **WHEN** the visitor's first reply contains a parseable name (either a short bare-text name such as `"Ana"` or a rename phrase such as `"call me Ana"` / `"llamame Ana"`)
- **THEN** the chat SHALL extract the name, store it in `localStorage`, and render a short personalized assistant acknowledgement that uses the captured name
- **AND** the first reply SHALL NOT be forwarded to the backend `POST /api/v1/chat/completions` endpoint

#### Scenario: Visitor explicitly declines

- **WHEN** the visitor's first reply matches a bilingual opt-out phrase (for example `"prefiero no decirlo"`, `"prefer not to say"`, `"anónimo"`, `"anonymous"`)
- **THEN** the chat SHALL store an opt-out flag in `localStorage` instead of a name
- **AND** the chat SHALL render a neutral welcome assistant message
- **AND** the first reply SHALL NOT be forwarded to the backend chat completion endpoint

#### Scenario: Visitor ignores the question and asks something else

- **WHEN** the visitor's first reply does not match a name pattern and does not match an opt-out phrase (for example a CV question, a bare greeting, or any free-form text the heuristics cannot classify)
- **THEN** the chat SHALL leave `localStorage` untouched (no name stored, no opt-out flag stored)
- **AND** the chat SHALL forward the first reply to the backend `POST /api/v1/chat/completions` endpoint as a normal chat message
- **AND** the assistant's reply to that forwarded message SHALL come from the backend as it would for any subsequent user message
- **AND** because the persisted state is unchanged, the next panel session SHALL re-seed the conversational name question (silent opt-out on an unrecognized reply was rejected as too aggressive — it would lose personalization for a benign "hola")

### Requirement: Visitor name and opt-out state SHALL persist in browser localStorage only

The chat SHALL store the captured name (or opt-out flag) in a single `localStorage` entry scoped to the site origin. The value SHALL NOT be transmitted to the backend, logged server-side, or stored in cookies.

#### Scenario: Name captured on first reply

- **WHEN** the visitor replies with a parseable name on the first opening
- **THEN** the chat SHALL write a single `localStorage` entry containing the trimmed name and an `updatedAt` timestamp
- **AND** the chat SHALL NOT include the name in any request to `POST /api/v1/chat/completions`

#### Scenario: localStorage unavailable

- **WHEN** `localStorage` throws on read or write (e.g. private mode, quota, disabled storage)
- **THEN** the chat SHALL degrade gracefully, treat the session as anonymous, not crash, and not repeatedly re-seed the name question within the same open panel

### Requirement: Returning visitor with a stored name SHALL be greeted by name on every fresh chat

When the chat panel opens with an empty message list and a non-empty visitor name is present in `localStorage`, the panel SHALL seed a single assistant greeting that addresses the visitor by name in the active locale and invites them to keep or change the name.

#### Scenario: Returning visitor in Spanish

- **WHEN** the panel opens with an empty message list, the stored name is `"Ana"`, and the locale is `es`
- **THEN** the first rendered assistant message SHALL address the visitor as `Ana` and SHALL invite them to confirm the name or provide a different one
- **AND** the greeting SHALL prompt the visitor to say how the assistant can help today

#### Scenario: Returning visitor in English

- **WHEN** the panel opens with an empty message list, the stored name is `"Ana"`, and the locale is `en`
- **THEN** the first rendered assistant message SHALL address the visitor as `Ana` in English and SHALL invite them to confirm the name or provide a different one

#### Scenario: Returning visitor who opted out

- **WHEN** the panel opens with an empty message list and the stored state indicates the visitor opted out of providing a name
- **THEN** the chat SHALL use a neutral welcome without a name and SHALL NOT re-seed the name question

#### Scenario: Greeting is not re-seeded on locale toggle mid-chat

- **WHEN** the message list already contains at least one message and the locale changes
- **THEN** the chat SHALL NOT replace or duplicate the initial greeting or name question

### Requirement: Chat SHALL detect rename phrases in user messages and update the stored name

Before each user message is sent to the backend, the chat SHALL run a bilingual heuristic to detect common rename intents (for example `"call me …"`, `"my name is …"`, `"mejor llamame …"`, `"prefiero que me llames …"`). When a rename is detected mid-chat (i.e. after the initial name question has already been resolved), the chat SHALL update the stored name in `localStorage`, synthesize a short assistant confirmation addressing the new name, and still forward the original user message to the backend so the conversation continues normally.

#### Scenario: Rename in Spanish mid-chat

- **WHEN** the visitor sends a message whose text matches a Spanish rename pattern (for example `"mejor llamame Ana"`) after the initial name flow is already resolved
- **THEN** the chat SHALL extract `"Ana"`, update `localStorage` to use the new name, and render a short assistant confirmation in Spanish acknowledging the new name
- **AND** the chat SHALL still send the original user message to `POST /api/v1/chat/completions`

#### Scenario: Rename in English mid-chat

- **WHEN** the visitor sends a message whose text matches an English rename pattern (for example `"please call me Sam"`) after the initial name flow is already resolved
- **THEN** the chat SHALL extract `"Sam"`, update `localStorage`, and render a short English confirmation
- **AND** the chat SHALL still send the original user message to the backend

#### Scenario: Extracted name is invalid

- **WHEN** the rename heuristic matches but the captured value is empty, a single character, digits-only, or longer than the allowed maximum of 40 characters
- **THEN** the chat SHALL NOT update the stored name
- **AND** the chat SHALL forward the user message to the backend unchanged

### Requirement: Visitor SHALL be able to forget the stored name preference from within the chat panel

The chat panel SHALL expose a visible control that clears the stored name and opt-out flag, returning the chat to the first-use state the next time it is opened. The control SHALL be available both when a name is stored and when the visitor opted out, because either state represents a preference the visitor may want to reset.

#### Scenario: Visitor clears a stored name

- **WHEN** the visitor activates the "forget my name" control while a name is stored
- **THEN** the chat SHALL remove the visitor-name entry from `localStorage`
- **AND** the next time the panel opens with an empty message list, the first-use name question SHALL be seeded again

#### Scenario: Visitor clears an opt-out

- **WHEN** the visitor activates the "forget my name" control while only an opt-out flag is stored
- **THEN** the chat SHALL remove the visitor-name entry from `localStorage`
- **AND** the next time the panel opens with an empty message list, the first-use name question SHALL be seeded again
