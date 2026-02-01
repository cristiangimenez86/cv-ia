# Gemini Instructions (CV-IA)

Follow `AGENTS.md` as the canonical project guide.

Constraints:
- Frontend: `/apps/web` (Next.js)
- Backend: `/services/CV.Api` (.NET 10)
- Content: `/content/es` and `/content/en` (Markdown/JSON)
- The public chat must be grounded only on CV content
- No secrets in the frontend; backend owns OpenAI integration

If unsure, stop and ask before making assumptions.
