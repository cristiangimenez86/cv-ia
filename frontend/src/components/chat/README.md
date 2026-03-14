# Chat Widget

Intercom-style floating chat for the CV website.

## Structure

| File | Description |
|------|-------------|
| `types.ts` | `ChatMessage` and `ChatChip` types |
| `ChatInput.tsx` | Textarea + send button (client) |
| `ChatMessageList.tsx` | Scrollable bubble list + suggestion chips (client) |
| `ChatPanel.tsx` | Full panel: header, messages, input, mock backend (client) |
| `ChatWidget.tsx` | FAB button + open/close state, renders ChatPanel (client) |

## Integration

`ChatWidget` is rendered once in the root layout (`apps/web/src/app/layout.tsx`).
It receives `locale` as a prop from the server layout and is positioned `fixed` so it
does not interfere with the sticky header or the two-column grid.

## Connecting the real backend

The mock function lives in `ChatPanel.tsx`:

```typescript
async function mockChatCompletion(_userText: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 400));
  return "(Mock) ...";
}
```

Replace it with a fetch call to the .NET backend:

```typescript
async function chatCompletion(userText: string, locale: string): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText, lang: locale }),
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const data = await res.json();
  return data.reply;
}
```

The backend endpoint contract is defined in `docs/api/api-spec.yml`.

## Testing locally

```bash
cd apps/web
yarn dev
```

1. Open http://localhost:3000/en (or /es).
2. A blue FAB appears bottom-right.
3. Click it to open the chat panel.
4. Click a suggestion chip or type a message and press Enter.
5. The mock response appears after ~400 ms.
6. Press Escape or the X button to close.
