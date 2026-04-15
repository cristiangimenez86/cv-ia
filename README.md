# CV + AI Chat (cv-ia) 🧑‍💻🤖

A **web CV** you can actually interact with:

- 🌍 A clean, bilingual CV website (EN/ES)
- 💬 A chat powered by AI so recruiters or tech leads can ask questions and get **grounded answers based on the CV content**

This repo is meant to be a **public, reviewable “living CV”**: not just a PDF, but a small product showcasing engineering quality, UX, and safe AI integration.

## Quickstart 🚀

- **Run locally**: start here → `docs/local-integration.md`
- **Frontend env**: `frontend/.env.example`
- **Backend config**: `backend/src/CvIa.Api/appsettings.json`

## What you can do here ✨

- ✅ **Browse the CV** like a modern website (fast, readable, ATS-friendly)
- 📄 **Download the CV as PDF**
- 🔎 **Ask questions in chat** (“What projects did you build with Azure?”, “What’s your experience with microservices?”) and get answers constrained to the CV

## AI (Chat) 🤖

- 🧠 The current provider is **OpenAI**
- 🧩 The backend is designed so the chat capability can be extended to **other providers** without rewriting the whole product (provider integration is isolated behind a service boundary)
- 🛡️ The chat is built with **safety and predictability** in mind (scope-limited to the CV and with server-side guardrails)

## CV content 📝

All website text lives in **Markdown** (plus a small `site.json` for profile/navigation). This keeps the CV:

- ✍️ **Easy to edit/review** in PRs
- 🌐 **Bilingual-friendly** (EN/ES)
- 🔎 **Machine-readable** so the chat/AI can answer using the CV text as its grounding source

## Repository map 🧭

- 🗂️ **`content/`**: CV content (EN/ES) as markdown + `site.json` (profile, navigation, links)
  - `content/{en|es}/sections/*.md`
  - `content/site.json`
- 🎨 **`frontend/`**: the CV website UI (renders the content, sections, download button, locale/theme)
- 🧱 **`backend/`**: the API that serves the CV + chat endpoint
- 🐳 **`infra/`**: local infrastructure dependencies (Docker Compose)
- 🧾 **`openspec/`**: spec-driven development artifacts (proposals, designs, specs, tasks)
- 📚 **`docs/`**: product/architecture notes and “how things work”

## Specs & product docs 📌

- 🧩 **OpenSpec changes (work items)** live under `openspec/changes/`
- 🧠 **Shared specs** live under `openspec/specs/`
- 🏗️ **Product/architecture docs** live under `docs/`

## Want to run it locally? 🧪

If you want the technical setup, start here:

- `docs/local-integration.md`
- `frontend/.env.example`
- `backend/src/CvIa.Api/appsettings.json`
