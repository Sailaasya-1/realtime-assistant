# TwinMind — Live Suggestions Web App

A real-time assistant that transcribes audio, generates live AI suggestions, and answers questions via chat.

🔗 **Live Demo: https://ai-chatbot-orcin-pi.vercel.app/**

---

## Features

- **Live Transcription** — mic captures audio every 30s, transcribed via Groq Whisper
- **AI Suggestions** — auto-generates 3 suggestion cards every 30s from transcript context
- **4 card types** — Question to ask, Talking point, Answer, Fact-check
- **Chat** — click any suggestion or type a question for a detailed AI response
- **Export** — download full session as JSON (transcript + suggestions + chat)

---

## Tech Stack

- **Framework** — Next.js 14
- **State** — Zustand
- **AI** — Groq API (Whisper for transcription, openai/gpt-oss-120b for suggestions + chat)
- **Deployment** — Vercel

---

## How It Works

```
Mic → /api/transcribe → Groq Whisper → Store
                                          ↓
                              words > 10 → /api/suggestions → Groq LLM → Suggestion Cards
                                          ↓
                              Click card → /api/chat → Groq LLM → Chat Response
```

1. User clicks mic → browser captures audio chunks
2. Every 30s, audio blob sent to `/api/transcribe` → Groq Whisper returns text
3. Text saved to Zustand store → `useSuggestions` watches word count
4. Once transcript has 10+ words → fires `/api/suggestions` → 3 cards appear
5. Every 30s after → new batch of 3 cards, older batches fade
6. User clicks card or types question → `/api/chat` returns detailed answer with transcript context

---

## Getting Started

### Prerequisites
- Node.js 18+
- Groq API key — get one free at [console.groq.com](https://console.groq.com)

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/live-meeting-assistant.git
cd live-meeting-assistant

# Install dependencies
npm install

# Add your Groq API key
echo "GROQ_API_KEY=gsk_your_key_here" > .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |

---

## Deployment (Vercel)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add `GROQ_API_KEY` in Environment Variables
4. Click Deploy

---

## Project Structure

```
app/
  page.tsx              # Main 3-column layout
  layout.tsx            # Root layout + metadata
  api/
    transcribe/         # Groq Whisper transcription
    suggestions/        # AI suggestion generation
    chat/               # AI chat responses
    test-groq/          # API key validation

components/
  TranscriptPanel.tsx   # Column 1 — mic + transcript
  SuggestionsPanel.tsx  # Column 2 — suggestion batches
  SuggestionCard.tsx    # Individual suggestion card
  ChatPanel.tsx         # Column 3 — chat interface
  ExportButton.tsx      # Session export
  SettingsButton.tsx    # Prompt + context settings

lib/
  store.ts              # Zustand global state
  useChat.ts            # Chat hook
  useSuggestions.ts     # Suggestion polling hook
  SettingsStore.ts      # Settings + prompts
  types.ts              # Shared TypeScript types
```

---

## Settings

Click the ⚙ Settings button to customize:
- **Suggestion prompt** — controls what the AI generates
- **Chat prompt** — controls how the AI answers questions
- **Context lines** — how much transcript to send with each request

---

## License

MIT
