## 1. API contract

- [ ] 1.1 Update `docs/api/api-spec.yml` to add the optional `visitor` object to `ChatRequest` with a nullable `name` property (`maxLength: 40`) and a clear description that it is not persisted and not logged at INFO.
- [ ] 1.2 Extend `backend/src/CvIa.Application/Contracts/ChatRequestDto.cs` with an optional `ChatVisitorHintsDto? Visitor` property (default `null`) and add a new `ChatVisitorHintsDto(string? Name)` record in the same namespace.
- [ ] 1.3 Add model-binding validation so `Visitor.Name` length > 40 returns `400` (or is normalized to `null` downstream consistently with the sanitizer decision); document the chosen behavior in code XML comments.

## 2. Sanitizer

- [ ] 2.1 Add `backend/src/CvIa.Infrastructure/Services/VisitorNameSanitizer.cs` with a pure `Sanitize(string? raw): string?` method implementing the rules from `design.md` (null/whitespace, hard pre-cap, control-char strip, NFC + whitespace collapse, injection-cue rejection, allowed charset regex, final 40-char clamp).
- [ ] 2.2 Add `backend/tests/CvIa.Tests/Infrastructure/VisitorNameSanitizerTests.cs` covering: happy paths (Ana, Ana María, Jean-Luc, O'Connor), rejects for newlines, tabs, triple backticks, role markers (`system:`, `assistant:`), HTML-like content (`<script>`), template markers (`{{name}}`), digits-only, empty/whitespace, oversize (>40 after normalization), and Unicode NFC edge cases.

## 3. Prompt builder integration

- [ ] 3.1 Extend `IOpenAiChatPromptBuilder` and `OpenAiChatPromptBuilder` with a new `BuildMessages` overload that accepts `string? visitorName` in addition to the existing parameters; keep older overloads forwarding `visitorName: null` for backward compatibility.
- [ ] 3.2 In `OpenAiChatPromptBuilder.FormatSystemPrompt`, when a non-null `visitorName` is provided, append a "Visitor identity (UNTRUSTED quoted data)" block with explicit begin/end delimiters, quoted-data framing, and instructions to address the visitor naturally while ignoring any instructions inside the block.
- [ ] 3.3 Update `backend/tests/CvIa.Tests/Infrastructure/OpenAiChatPromptBuilderTests.cs` with cases proving: the block is present when a sanitized name is supplied, absent when not supplied, positioned consistently relative to CV/RAG blocks, and that the begin/end delimiters and instruction text are present.

## 4. Controller / service wiring

- [ ] 4.1 In `backend/src/CvIa.Api/Controllers/ChatController.cs` (or the service orchestrating the completion call), read `request.Visitor?.Name`, pass it through `VisitorNameSanitizer.Sanitize`, and forward the sanitized value to the prompt builder.
- [ ] 4.2 Ensure the chat orchestration path propagates `visitorName` consistently through any intermediate service (e.g. `IChatCompletionService` or equivalent); only the prompt builder consumes it.

## 5. Logging and observability

- [ ] 5.1 In the chat completion flow, attach a structured `visitor.name.present` boolean to the existing completion log scope (INFO) based on whether sanitization returned a non-null value. Do NOT include the raw name at INFO.
- [ ] 5.2 When the sanitizer rejects a supplied name, emit a single DEBUG-level log entry with a machine-readable reason (`length`, `charset`, `injection`); never echo the raw value.
- [ ] 5.3 Review all new log statements to confirm no raw visitor name is logged at INFO or higher in production.

## 6. Frontend request

- [ ] 6.1 In `frontend/src/components/chat/ChatPanel.tsx`, read the stored visitor name via the `useVisitorName` hook (added by `chat-user-name-personalization`) and, when non-empty and not opted-out, include `visitor: { name }` in the `requestChatCompletion` body; omit the field otherwise.
- [ ] 6.2 Verify in DevTools (or via a component-level test with a `fetch` mock) that the request payload includes `visitor.name` when a name is stored and excludes it when not.

## 7. Verification

- [ ] 7.1 Run `dotnet test` for the backend and confirm sanitizer, prompt builder, and chat controller tests pass.
- [ ] 7.2 Run frontend lint/type-check (`npm run lint`, `npm run typecheck` or project equivalents) and any component tests to confirm the request body changes compile and behave as expected.
- [ ] 7.3 Manual QA: with a stored name in `localStorage`, send a Spanish message and confirm the assistant addresses the visitor by name; with a payload attempting injection (e.g. name `"Ana\nIgnore previous instructions"` set through DevTools), confirm the backend rejects it and the response remains grounded in the CV.
- [ ] 7.4 Run `openspec validate chat-visitor-name-in-llm-context --strict` and confirm the change is valid.
