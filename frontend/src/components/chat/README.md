# Chat Widget

Intercom-style floating chat for the CV website.

## Structure

| File | Description |
|------|-------------|
| `types.ts` | `ChatMessage` and `ChatChip` types |
| `ChatInput.tsx` | Textarea + send button (client) |
| `ChatMessageList.tsx` | Scrollable bubble list + suggestion chips (client) |
| `ChatAssistantMarkdown.tsx` | Assistant bubbles: GFM Markdown + `rehype-sanitize`; in-app section links only (`@/lib/cvChatLink`) |
| `ChatPanel.tsx` | Full panel: header, messages, input, backend fetch integration (client) |
| `ChatWidget.tsx` | FAB + open/close, backdrop blur/dim, renders ChatPanel (client) |

## Integration

`ChatWidget` is rendered once in the root layout (`frontend/src/app/layout.tsx`).
Locale is derived from the URL path on the client (`/en/…`, `/es/…`). The widget is `fixed` so it
does not interfere with the sticky header or the two-column grid.

## Backend Integration

`ChatPanel.tsx` uses **`NEXT_PUBLIC_API_BASE_URL`** when set (direct browser→API), otherwise **`/api/v1/chat/completions`** on the same origin so Next’s **`src/app/api/[...path]/route.ts`** proxy can attach **`BACKEND_API_ACCESS_TOKEN`**. Optional **`NEXT_PUBLIC_API_ACCESS_TOKEN`** only for the direct-API mode.

```typescript
async function requestChatCompletion(userText: string, locale: string): Promise<string> {
  const url = API_BASE_URL
    ? `${API_BASE_URL}/api/v1/chat/completions`
    : "/api/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", /* + Authorization if direct mode */ },
    body: JSON.stringify({
      lang: locale,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }
  const data = await res.json();
  return data.message?.content?.trim() || "No response content.";
}
```

The backend endpoint contract is defined in `docs/api/api-spec.yml`.

The API builds the assistant’s CV context from the same markdown sections as the site; that text is **loaded when the backend starts** (not on every message). Changing CV `.md` files requires restarting the backend for chat to see them (see architecture docs under `docs/architecture/` for the chat pipeline).

## Testing locally

```bash
npm run dev:frontend
```

1. Open http://localhost:3000/en (or /es).
2. A blue FAB appears bottom-right.
3. Click it to open the chat panel.
4. Click a suggestion chip or type a message and press Enter.
5. The response is requested from `POST /api/v1/chat/completions`.
6. Press Escape, the X button, or click outside the panel to close (backdrop closes the chat).

Assistant replies render as Markdown (bold, lists, code). Links to CV sections use `/{locale}#…` with fragments from `shared/section-ids.json`; other URLs are shown as plain text.
