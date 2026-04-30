# Why Gemini

When choosing the AI model for suppa-agent, we evaluated the major commercial options. Gemini 2.5 Pro won for three concrete, measurable reasons. This document explains them.

## Reason 1 — Context window: 1 million tokens

A "context window" is the amount of text the model can consider in a single response. Bigger context = the AI remembers more of your conversation, more of your documents, more of your history.

| Model (early 2026) | Context window |
|--------------------|----------------|
| **Gemini 2.5 Pro** | **1,000,000 tokens** |
| **Gemini 1.5 Pro (via API)** | **2,000,000 tokens** |
| **Gemini 3 Pro** | 1,000,000 tokens |
| Claude Opus 4.6 / Sonnet 4.6 | 1,000,000 tokens (Max plan only) |
| GPT-5 | 400,000 tokens |
| GPT-4.1 | 1,000,000 tokens |
| Llama 4 Scout | 10,000,000 tokens (open source, but harder to host) |

For comparison: 1 million tokens is roughly **1,500 pages of text**, **30,000 lines of code**, or **75 hours of audio transcript**.

### Why this matters for suppa-agent

Suppa-agent's Cloud Function loads the **entire conversation history** into context on every message. This is unusual. Most chat apps truncate or summarize old messages because their backend models couldn't handle the full thread.

With Gemini 2.5 Pro, we don't need to. Every conversation, no matter how long, retains full memory. Ask about something from message 1 in message 500 — the AI still has it.

For specialized variants (cooking app with a 200-recipe knowledge base, study buddy with full course material, caregiver app with a patient's history), this is the difference between **"vaguely useful"** and **"genuinely smart"**.

## Reason 2 — Native multimodality

Gemini accepts text, images, audio, and short video in the same request, with the same model, without conversion.

| Operation | Other models | Gemini |
|-----------|-------------|--------|
| User uploads a photo to ask about it | Need separate vision model + retry | Single request |
| Audio transcription + analysis | Whisper + GPT-4 + custom plumbing | Single request |
| Video frame extraction + Q&A | Multiple services + manual coordination | Single request |

For suppa-agent, this means the **same starter code** that handles text chat handles all the multimodal cases too. We just append parts to the request:

```javascript
const parts = [{ text: userMessage }];
if (imageBase64) {
  parts.push({ inlineData: { mimeType, data: imageBase64 } });
}
const result = await chat.sendMessage(parts);
```

That's the whole change. No model swap. No separate API call. No coordination layer.

## Reason 3 — Free tier and integration

Gemini API offers a generous free tier:

- Free API key from Google AI Studio in ~30 seconds.
- No separate billing account needed (uses your existing Google account).
- Integrates natively with Firebase (same Google Cloud project).
- Secret manager support out of the box.

Compare with the alternatives:

| Provider | Setup complexity | Free tier? |
|----------|------------------|-----------|
| Google Gemini | Single API key from AI Studio | Yes, generous |
| OpenAI | Account + billing required | Limited free credits |
| Anthropic Claude API | Account + billing required | Limited free credits |
| Llama (self-hosted) | GPU infrastructure required | Free but expensive to host |

For a personal project that should cost $0/year, this matters enormously.

## What we don't claim

- **"Gemini is smarter than Claude/GPT."** It depends on the task. Claude is excellent at code; GPT excels at certain reasoning tasks; Gemini's strength is context volume + multimodality + price. For suppa-agent's purpose, that combination wins.
- **"Gemini is the best for everyone."** If you're building a coding assistant and don't need 1M context, Claude or GPT might suit you better. Suppa-agent is a starter — you're free to swap.

## Switching the model

If you want to try a different Gemini variant (Flash, 3 Pro, 3 Flash), it's one line:

```javascript
// In starter/functions/index.js
model: 'gemini-2.5-pro',  // ← change this
```

Options:
- `gemini-2.5-pro` (default) — 1M context, multimodal, best balance.
- `gemini-2.5-flash` — faster, cheaper, slightly less capable. Good for high-volume.
- `gemini-3-pro` — most capable, more expensive. For complex tasks.
- `gemini-3-flash` — newest fast option.
- `gemini-1.5-pro` — only one with 2M context, slower.

## Switching to a different provider entirely

If you want to use Claude or GPT instead of Gemini, you'll need to:

1. Replace `@google/generative-ai` with the relevant SDK (`@anthropic-ai/sdk` or `openai`).
2. Update the message format in the Cloud Function (each provider has slightly different conventions).
3. Lose the multimodal-by-default behavior (you'll need separate image-handling logic).
4. Manage a separate billing account.

It's possible. We don't gate against it. But you'll lose some of what makes suppa-agent simple. Forks doing this swap are welcome — open an issue and we'll link them in the README.

## When Gemini fails (rare but possible)

Like all LLM providers, Gemini has occasional outages. Suppa-agent doesn't include a fallback model in v0.001 because:
- Outages are rare (typically minutes per month).
- Adding a fallback adds complexity for marginal benefit at this scale.
- For mission-critical use, you should be using a more robust setup anyway.

If your app is going down because Gemini is down, you'll see the error in the Code Tester immediately. The user-facing message is generic ("Something went wrong, please try again"), but the Code Tester shows the underlying cause.

If you need fallback support, see `examples/with-fallback/` (planned for a future release).

---

## Summary

We picked Gemini because it offers:
1. The largest context window with practical 1M+ availability.
2. Native multimodality (text + images + audio + video in one model).
3. Free tier and trivial setup.

For suppa-agent's mission — *the AI agent with the largest context window on the market, at zero cost for personal use* — these three reasons are the entire pitch.
