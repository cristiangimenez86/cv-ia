## 1. Frontend — shell and backdrop

- [x] 1.1 Update `ChatWidget` backdrop layer: add dimming (`bg-background/…` or equivalent) + `backdrop-blur-*`, keep click-outside-to-close and z-index ordering vs `ChatPanel`.
- [x] 1.2 Adjust `ChatPanel` container classes: `md:` fixed **600×700**; fluid `min()` sizing for `sm`–`md`; preserve current mobile full-bleed behavior below `sm`.

## 2. Frontend — Markdown and safe links

- [x] 2.1 Add dependencies (`react-markdown`, `remark-gfm`, `rehype-sanitize` or equivalent) per `design.md`; ensure bundle impact is acceptable.
- [x] 2.2 Implement assistant-only Markdown rendering (new small component or `ChatMessageList` branch) with theme-aware styles for prose elements.
- [x] 2.3 Implement URL allowlist: allowed section IDs aligned with `shared/section-ids.json`; normalize `href` to `/${locale}#id`; strip or downgrade invalid links.
- [x] 2.4 On validated link click: close chat (`onClose`) and navigate with Next.js router to `/${locale}#…`.

## 3. Backend — prompt and tone

- [x] 3.1 Extend `OpenAiChatPromptBuilder.FormatSystemPrompt`: Markdown instructions, allowed section IDs, link pattern `/{lang}#…`, no external URLs, conversational tone rules (see `design.md`).
- [x] 3.2 Default `OpenAiChat:Temperature` is **0.5** in `appsettings.json`, `OpenAiChatOptions`, and `.env.example` (done).

## 4. Tests and verification

- [x] 4.1 Update `OpenAiChatPromptBuilderTests` (or add cases) for new prompt sections: Markdown, section IDs list, link rules, tone.
- [x] 4.2 Run `dotnet test` from `backend/` (or solution root as per repo convention).
- [x] 4.3 Run `npm run build` (and `npm run lint` if present) from `frontend/`.
- [ ] 4.4 Manual smoke: open chat on `/en` and `/es`, confirm backdrop blur+dim, desktop size, Markdown render, section link closes chat and scrolls to anchor, external link in content does not navigate.
