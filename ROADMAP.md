# Roadmap

This document outlines the planned evolution of `suppa-agent`. It's a living document — propose changes via issues.

## Philosophy

The core stays minimal. Specialized features go to `examples/` as forks. The core release cadence is intentionally slow (~one minor version per month) to keep the starter stable for forks.

## Versioning

Format: `vMAJOR.MINOR.PATCH`

- **MAJOR**: breaking changes to the architecture or stack.
- **MINOR**: new core features (e.g., voice input added to base).
- **PATCH**: bug fixes, doc improvements, dependency bumps.

The very first public release is `v0.001` (intentionally low — we expect rapid iteration in the early months).

---

## ✅ v0.001 — Initial release

The "MVP starter kit". Contains everything needed to deploy a private AI chat app.

**Features:**
- Google authentication
- Whitelist of authorized users (Firestore-backed)
- Chat interface with conversation history
- Cloud Function calling Gemini 2.5 Pro with full context per chat
- Admin panel (separate domain) for user management
- Code Tester live console (real-time `testerLogs/` viewer)
- Multi-site Firebase Hosting (web + admin)
- Security Rules covering all collections
- Budget alert configuration guidance
- Full deployment manual (`MANUAL.pdf`) — bilingual versions in repo history

**Documentation:**
- README with three install paths (wizard, manual, fork).
- Manual as PDF.
- Wizard specification (`WIZARD.md`) for Claude.ai.
- Architecture, customization, and "why Gemini" docs.

---

## 🔜 v0.010 — Image input (next)

Bring the multimodal capabilities of Gemini fully into the UI.

**Planned:**
- Image upload button in `Chat.jsx`.
- Backend handles `inlineData` parts cleanly.
- File size validation (4 MB cap).
- Visual indicator on messages that contain images.
- `hasImage: true` field in Firestore for filtering.
- Updated security rules to support optional image storage in Firebase Storage (for retention).

**Estimated release:** ~1 month after v0.001.

---

## v0.020 — Voice input

Web Speech API for voice-to-text on supported browsers.

**Planned:**
- Microphone button in `Chat.jsx`.
- Live transcription preview before send.
- Per-language picker (10 default languages).
- Vocabulary correction dictionaries (configurable).
- Hands-free mode with voice command "send".
- Graceful fallback when API unavailable.

---

## v0.030 — Embedded knowledge base (basic RAG)

Per-chat or global knowledge documents that get injected into context.

**Planned:**
- New collection `knowledge/{docId}` with `title, content, scope: 'global' | 'chat:<id>'`.
- Admin UI to upload markdown/text documents.
- Cloud Function attaches relevant knowledge to context before calling Gemini.
- Token budget management — never overflow the 1M context.
- Optional simple embedding-based retrieval (not strictly required at 1M context).

---

## v0.040 — Conversation export

Let users save their conversations.

**Planned:**
- Export single chat to Markdown or PDF (client-side rendering).
- Export all chats as a zip.
- Copy single message to clipboard.

---

## v0.050 — System prompt customization

Per-user or per-app system prompts editable from the admin panel.

**Planned:**
- New collection `appConfig/systemPrompts/{name}`.
- Admin UI to create/edit prompts.
- Per-user default prompt selection.
- Per-chat override.

---

## v0.060 — Streaming responses

Stream Gemini output token-by-token instead of waiting for the full response.

**Planned:**
- Cloud Function returns a stream (HTTP).
- Frontend displays partial response as it arrives.
- Cancel button mid-stream.
- Code Tester shows streaming progress.

---

## v0.070 — Theming and branding

Allow easy visual customization without forking the codebase.

**Planned:**
- Theme tokens in a single config file.
- Light/dark/system mode toggle.
- Custom logo and favicon support.
- Three preset themes (default, minimal, retro-terminal).

---

## v0.100 — Plugin architecture

Allow extending the chat with optional modules without touching the core.

**Planned:**
- Plugin manifest format.
- Plugin loader.
- First-party plugins (e.g., calendar integration, weather, web search).
- Plugin marketplace structure (community-managed).

---

## v0.200 — Multi-language UI

Translate the UI itself (login, errors, admin panel, etc.).

**Planned:**
- i18n framework integration.
- Initial languages: English, Spanish, Catalan, French, German, Italian, Portuguese.
- Per-user language preference.
- Right-to-left support (Arabic, Hebrew).

---

## 🎯 v1.000 — Stable

The first version we'd recommend without caveats for non-personal-use scenarios (small businesses, schools, NGOs).

**Criteria for v1.000:**
- All features above shipped and battle-tested.
- Test suite (Playwright for E2E, Vitest for unit).
- Security audit completed.
- Performance benchmarks documented.
- 50+ forks with positive feedback in `examples/`.
- 1+ year of stability with no breaking changes.

---

## Examples gallery (parallel track)

Independent of core versions, we want to grow `examples/`:

- `examples/cooking/` — recipe assistant with image input for ingredients
- `examples/study/` — study buddy with note storage and quiz mode
- `examples/parents/` — family helper with simplified UI for elders
- `examples/medical/` — caregiver companion (NOT for diagnosis)
- `examples/legal/` — document Q&A for non-lawyers
- `examples/customer-support/` — internal team support agent
- `examples/games/` — interactive fiction / D&D dungeon master

Each example is a `systemInstruction` change + minor UI tweaks. Submit via PR — see CONTRIBUTING.md.

---

## What's NOT on the roadmap (and why)

- **Native mobile apps** — the web app already works perfectly on mobile via the browser. Native is too much maintenance for a starter.
- **Multi-AI backend** — supporting GPT, Claude, etc. as alternatives. We're committed to Gemini for the context window advantage. Forks are welcome to swap.
- **Real-time collaboration on chats** — out of scope. Different product.
- **End-to-end encryption** — Firebase Auth + Firestore rules are sufficient for the threat model (private apps for trusted circles). True E2EE is a different project.
- **Self-hosting outside Firebase** — Firebase is the value proposition (zero-ops, real-time, integrated auth). Forks are welcome to migrate.

---

## How to influence this roadmap

- **Open an issue** with the tag `roadmap`.
- **Make a PR** for `examples/` — those don't need roadmap approval.
- **Fork** and ship your own variant. If it's good, we'll feature it.
