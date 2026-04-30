# Changelog

All notable changes to suppa-agent are documented here. Format inspired by [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

Things in development for the next release. See `ROADMAP.md` for the full plan.

---

## [v0.001] — Initial public release

The "MVP starter kit" for self-hosted private AI chat apps powered by Gemini.

### Added
- Complete Vite + React frontend in `starter/web/` with:
  - Google login flow with whitelist validation
  - Conversation history sidebar
  - Real-time chat synced with Firestore
  - Code Tester floating console (bottom-right)
  - "Not authorized" gate for non-whitelisted emails
  - Version constants in `constants.js` (1 of 7 sync points)
- Complete admin frontend in `starter/admin/` with:
  - Authorized users management table
  - Role toggling (user ↔ admin)
  - User activity table (last seen, etc.)
  - Same Code Tester
- Firebase Cloud Function in `starter/functions/index.js`:
  - `chatWithGemini` callable with Gemini 2.5 Pro by default
  - Authorization check against `authorizedUsers/`
  - Full chat history loaded into context (1M tokens)
  - Atomic batch writes for messages
  - Logs every operation to `testerLogs/`
  - `healthCheck` callable for liveness probing
- Multi-site Firebase Hosting (`web` + `admin` targets)
- Firestore Security Rules covering:
  - `authorizedUsers/` (admin-only writes)
  - `users/` (per-user)
  - `chats/` and subcollection (owner-only, server-side writes for messages)
  - `testerLogs/` (read-only for authorized users)
- `MANUAL.pdf` — full step-by-step build manual (English).
- `WIZARD.md` — specification for Claude.ai to generate the interactive setup wizard.
- `README.md` with three install paths (wizard, manual, fork).
- Documentation in `docs/`:
  - `architecture.md` — system overview with diagrams
  - `why-gemini.md` — context window argument
  - `customization.md` — how to specialize the app
  - `deployment.md` — concrete deploy guide
  - `troubleshooting.md` — common errors and fixes
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE` (MIT).
- GitHub issue templates and PR template in `.github/`.
- `.github/FUNDING.yml` for donation/sponsorship configuration (GitHub Sponsors, Ko-fi, custom URLs).
- `docs/funding-setup.md` — step-by-step guide for fork maintainers to enable donations (with Spain-specific tax notes).

### Stack
- Frontend: Vite + React (JavaScript, no TypeScript)
- Backend: Node.js 20 Cloud Functions
- Database: Firestore (region `eur3`)
- Functions region: `europe-west1`
- AI Model: Gemini 2.5 Pro (1M tokens context, multimodal)
- Auth: Firebase Authentication with Google provider
- Hosting: Firebase Hosting (multi-site)

### Cost profile
- Stays within Firebase + Gemini free tiers for typical personal use.
- $5/month spending alarm setup documented.

---

[Unreleased]: ../../compare/v0.001...HEAD
[v0.001]: ../../releases/tag/v0.001
