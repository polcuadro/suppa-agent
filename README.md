<p align="center">
  <img src="docs/images/suppa-agent-hero.png" alt="suppa-agent mascot" width="280">
</p>

# 🤖 suppa-agent

> **The AI agent with the largest context window on the market — running on your own infrastructure, at zero cost for personal use.**

Built on Google's Gemini 2.5 Pro (1 million tokens of context), self-hosted on your own Firebase, and assembled in ~30 minutes by following a single PDF manual with Claude as your interactive build guide.

[![Cost](https://img.shields.io/badge/cost-%240%2Fyear-brightgreen)]()
[![Context](https://img.shields.io/badge/context-1M%20tokens-blue)]()
[![Stack](https://img.shields.io/badge/stack-Firebase%20%2B%20Gemini%20%2B%20React-orange)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey)]()
[![Built with](https://img.shields.io/badge/built%20with-Claude-purple)]()

---

## What this is

**suppa-agent** is a starter kit for building your own private AI chat application. Not a SaaS, not a hosted service — *your* app, on *your* Google account, accessible only to *people you authorize*.

What you get:

- 🧠 **1 million tokens of context** (Gemini 2.5 Pro). Conversations never lose memory. ChatGPT standard has 128k. You have 8x that.
- 🖼️ **Multimodal natively** — text, images, audio, short videos in the same chat.
- 🔒 **Whitelist authentication** — only emails you add can log in. Family, team, friends. Nobody else.
- 💾 **Your data, your database** — everything lives in your Firestore. Not in OpenAI's servers, not in anyone else's.
- 📊 **Real-time monitoring** — built-in Code Tester console shows what's happening inside the app, live.
- 🆓 **$0/year for personal use** — stays within Firebase + Gemini free tiers comfortably.
- 🏗️ **Built with Claude** — the entire stack is designed to be assembled with Claude.ai (Pro plan) as your interactive guide.

---

## Why this exists

LLM chat apps are everywhere. Why build your own?

| Concern | Hosted services (ChatGPT, etc.) | suppa-agent |
|---------|--------------------------------|-------------|
| Context window | 128k–1M tokens (varies by tier) | **1M tokens, always** |
| Where your conversations live | Their servers | **Your Firestore** |
| Who can read them | Their employees + AI training | **Only you** |
| Monthly cost (personal use) | $20+ | **$0** |
| Customization | Limited | **Full source code** |
| Privacy of users | Email collected | **Whitelist you control** |

If you have a small circle (family, team, study group, customers) and want a private AI tool with **massive context**, this is the simplest path to get there.

---

## Quick start (30 minutes)

You have three paths. Pick one.

### Path 1 — The Wizard (easiest, recommended for non-technical users)

1. Have a [Claude.ai Pro plan](https://claude.ai) ready.
2. Download [`MANUAL.pdf`](./MANUAL.pdf) and [`WIZARD.md`](./WIZARD.md) from this repo.
3. Open a new conversation in Claude.ai and **upload both files**.
4. Send this message:

> *"I just uploaded the suppa-agent manual and wizard. Generate the wizard artifact and walk me through it."*

5. Claude generates an interactive wizard (rendered live in the chat) that asks you 6 short questions.
6. At the end, Claude generates all the project files for you, then guides you through deploying them.

**Time:** ~30 minutes. **Technical knowledge required:** none.

### Path 2 — The Manual (full control, fastest if you have prior experience)

1. Download [`MANUAL.pdf`](./MANUAL.pdf).
2. Open Claude.ai, upload the PDF, and follow the starter prompt described in the manual's first section.
3. Work phase by phase.

**Time:** 1-3 hours depending on experience. **Technical knowledge required:** copy-paste, terminal basics.

### Path 3 — Fork the starter (for developers)

1. Fork this repo.
2. `cd starter/` and follow `starter/README.md`.
3. Ship.

**Time:** under 1 hour if you've used Firebase before.

---

## What you'll have at the end

A web app at `https://your-app-name.web.app` that:

- Asks for Google login.
- Lets only authorized emails in.
- Shows a chat interface with conversation history (sidebar like ChatGPT).
- Talks to Gemini 2.5 Pro with full context retention per conversation.
- Has a separate admin URL (`your-app-name-admin.web.app`) where you manage authorized users.
- Has a real-time Code Tester console at the bottom-right showing every backend operation.

Plus a private GitHub repo with all the source code, fully yours.

---

## Cost breakdown (typical personal use)

| Service | Free tier limit | Likely usage | Cost |
|---------|----------------|--------------|------|
| Firebase Hosting | 5 GB transfer/month | < 1 GB | $0 |
| Firestore Database | 50k reads, 20k writes/day | well under | $0 |
| Cloud Functions | 2M invocations/month | a few thousand | $0 |
| Gemini API | Free tier exists | depends | $0 (with free key) |
| **Total monthly** | — | — | **$0** |

We configure a $5/month spending alarm during setup so you'll never get a surprise bill.

---

## Stack

- **Frontend:** Vite + React (no TypeScript, kept simple)
- **Backend:** Firebase Cloud Functions (Node.js 20)
- **Database:** Firestore (real-time, EU region)
- **Auth:** Firebase Authentication with Google provider
- **AI:** Google Gemini 2.5 Pro (with Flash and 3 Pro alternatives)
- **Hosting:** Firebase Hosting (multi-site: app + admin)
- **Source control:** GitHub (private by default)
- **Build tool:** Claude.ai + Claude Code

---

## Code philosophy

> **One file, one feature. Never a monolithic `App.jsx`.**

This repo is structured so that:

- Every component lives in its own file (`Chat.jsx`, `CodeTester.jsx`, `AdminPanel.jsx`, etc.).
- Every backend operation logs to a `testerLogs` collection visible in real-time on the Code Tester.
- The architecture is designed to be **modified with Claude** (chat + Code Tools).
- You add new features by **creating new files**, not by inflating existing ones.

If your `App.jsx` ever exceeds 150 lines, you've drifted off. Extract pieces into new components.

---

## Workflow philosophy

This entire project is built around an efficient division of labor between three tools:

| Tool | Role | Cost |
|------|------|------|
| **Claude.ai chat** | Architect — designs, decides, writes new code | Plan messages |
| **Claude Code (terminal)** | Executor — installs, builds, deploys, commits | Plan messages (cheap) |
| **Code Tester (built-in)** | Eyes — real-time logs in your app | $0 |

This division is what lets you build the entire app within a Claude Pro plan's limits. Read the manual's "The Claude workflow" section for details.

---

## Roadmap

| Version | Features | Status |
|---------|----------|--------|
| **v0.001** | Auth + chat + admin + Code Tester (this release) | ✅ Released |
| v0.010 | Image input fully integrated | 🔜 Next |
| v0.020 | Voice input (Web Speech API) | Planned |
| v0.030 | Embedded knowledge base per chat (basic RAG) | Planned |
| v0.040 | Conversation export (PDF, Markdown) | Planned |
| v0.100 | Plugin system for community extensions | Planned |
| v0.200 | Theming and custom branding system | Planned |
| v1.000 | Stable, with curated example apps | Planned |

The roadmap is open — see [`ROADMAP.md`](./ROADMAP.md) and feel free to open issues.

---

## Examples (community templates — coming)

The plan is to grow a library of `examples/` folders, each one being a `suppa-agent` clone customized for a specific use case:

- `examples/cooking/` — recipe assistant with image input for ingredients
- `examples/study/` — study buddy with note storage
- `examples/parents/` — family helper with simplified UI for elders
- `examples/medical/` — caregiver companion (NOT for diagnosis)
- `examples/legal/` — document Q&A assistant for non-lawyers

Each example is a `systemInstruction` change + a few UI tweaks — pure modular fork from the base.

---

## How this was built

The entire `suppa-agent` codebase was assembled using Claude.ai as the lead architect and Claude Code as the executor, following the workflow documented in `MANUAL.pdf`. The manual itself was iterated through 6 versions in the same Claude conversation that built the code.

This is intentional: **we're using suppa-agent to demonstrate that Claude is currently the best agent on the market for shipping real software**. The repo is itself a proof-of-concept of that workflow.

---

## 💜 Support the project

`suppa-agent` is free and open source, and stays that way. If it saved you time, helped you build something useful, or you just want to see it keep growing, you can support development directly:

- **GitHub Sponsors** — click the 💜 Sponsor button at the top of this repo (0% platform fees, monthly or one-time).
- **Ko-fi** — for one-off contributions, no GitHub account required.
- **PayPal** — universal fallback, also one-off.

The exact links depend on this fork's maintainer — see the Sponsor button or `.github/FUNDING.yml`. Every contribution, even €1, is genuinely appreciated and helps us decide where to invest time next.

Not in a position to donate? Three other ways to help, all free:
- ⭐ **Star the repo** — that's how visibility grows.
- 🐛 **Report bugs** — clear bug reports save hours.
- 💡 **Share what you built** — open an example PR or just tell us in Discussions. Your variant might inspire ten others.

For maintainers thinking about enabling donations on their fork, see [`docs/funding-setup.md`](./docs/funding-setup.md).

---

## License

[MIT](./LICENSE) — do whatever you want with it. Commercial use included. No attribution required, but appreciated.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Short version: open an issue first, fork, branch, PR. Be kind. Catalan, Spanish, English all welcome in issues.

---

## Credits

- Built by the community. Initial scaffolding by [@polcuadro](https://github.com/polcuadro).
- Powered by Google Gemini, Firebase, and the Claude family of models.
- Inspired by the realization that the best AI infrastructure is *yours*, not someone else's.

---

## ⭐ If this helped you ship something, star the repo

That's how we know it's worth maintaining.
