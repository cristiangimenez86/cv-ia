# OpenAI backend setup (cv-ia)

## Why you might see `401` / “AI provider authentication failed”

1. **Project keys (`sk-proj-...`)** need **both**:
   - **`OpenAiChat:OpenAiProjectId`** — `proj_...` from **OpenAI → Projects**
   - **`OpenAiChat:OpenAiOrganizationId`** — `org_...` from **OpenAI → Settings → Organization → General**  
   The backend sends `Authorization`, `OpenAI-Project`, and `OpenAI-Organization` (see [OpenAI authentication docs](https://platform.openai.com/docs/api-reference/authentication)).
2. Copy **IDs exactly** (one wrong character ⇒ 401).
3. Prefer a **classic** `sk-...` user key (not `sk-proj-`) if you want zero project/org headers during local dev.

## Local config (recommended)

1. Copy `backend/src/CvIa.Api/appsettings.Development.example.json` → `appsettings.Development.json` (gitignored).
2. Fill in:
   - `ApiKey` — your `sk-proj-...` or `sk-...` key  
   - `OpenAiProjectId` — `proj_...` from the Projects table  
   - `OpenAiOrganizationId` — only if OpenAI docs/account require it  
   - `UseStubChatService`: `false`
3. Restart `dotnet run` / `npm run dev:backend`.

## Environment variables (alternative)

```powershell
$env:OpenAiChat__ApiKey="sk-proj-..."
$env:OpenAiChat__OpenAiProjectId="proj_..."
$env:OpenAiChat__OpenAiOrganizationId="org_..."   # optional
$env:OpenAiChat__UseStubChatService="false"
```

## “Missing scopes: model.request” (401) — restricted keys

OpenAI returns **401** with a message like *You have insufficient permissions… Missing scopes: **model.request*** when the key is **restricted** and does not include the **`model.request`** scope.

That scope is **not** implied only by “Chat completions → Request” in the dashboard. In the **restricted key** editor you must also set **Model capabilities** (or equivalent) so that model access is allowed — otherwise `model.request` is missing and every chat call fails. See the [OpenAI developer forum discussion](https://community.openai.com/t/api-key-permissions-ui-model-request-scope-only-appears-when-model-capabilities-is-set-to-request/1374480).

**Fastest local fix**

- Create a **new** secret key with **All** permissions (dev only), **or**
- Edit the restricted key: enable **Chat completions** and ensure **model / Model capabilities** allows **Request** for the model you use in `OpenAiChat:Model` (e.g. `gpt-4o-mini`), then **Save**.

**After changing backend code**, restart `dotnet run` so the API returns updated error codes (`provider_forbidden` vs `provider_auth`).

## If it still fails

- Revoke and create a **new** API key if it was ever pasted into chat or committed.
- Confirm **Billing** and **Usage limits** on OpenAI.
- Prefer a **classic** user key (`sk-...` without `proj`) for simpler setup — then `OpenAiProjectId` can stay empty.
- Confirm **org/project roles** (Reader/Writer/Owner; Member or Owner on the project) if OpenAI still mentions roles in the error.

## CV markdown used in chat

The assistant’s CV context comes from `CvSectionIds.json` and `content/{lang}/sections/*.md` (see `CvApi` in `appsettings.json`). That content is **read once when the API starts** and held in memory. If you edit those files, **restart the backend** so chat uses the new text (same as after OpenAI config changes). Details: `docs/architecture/openai-chat-backend.md`.
