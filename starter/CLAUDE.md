# CLAUDE.md — suppa-agent starter

## Code philosophy (READ BEFORE TOUCHING ANYTHING)

**One file, one feature.** Never inflate App.jsx or other components.
Add new features to their own files inside `web/src/components/` or
`web/src/hooks/`.

Every important backend operation must call `logTester(...)` so it
appears in the Code Tester.

## Workflow

- **Claude chat (claude.ai)** designs and writes new code. Generates zips.
- **You (Claude Code)** execute: unzip, build, deploy, git. NO feature dev.
- **Code Tester** reads testerLogs/ autonomously on the frontend.
- The human deploys manually for visual verification.

## Stack

- Frontend: Vite + React (JavaScript)
- Backend: Cloud Functions Node.js 20
- Firestore: region eur3
- Functions: region europe-west1
- Auth: Google only
- AI Model: Gemini 2.5 Pro (1M tokens context, multimodal)

## Structure

- `web/` — user frontend
- `admin/` — admin frontend
- `functions/` — Cloud Functions
- `firestore.rules` — security rules
- `firebase.json` — global Firebase config

## Versioning — 7 locations to sync on every bump

Format: `v0001` (constants.js, html), `0.001.0` (functions/index.js), `0.0.1` (functions/package.json).

1. `web/src/constants.js` → `export const VER = "v0001";`
2. `web/package.json` → `"version": "0.001.0"`
3. `web/index.html` → `<meta name="version" content="v0.001">`
4. `admin/src/constants.js` → `export const VER = "v0001";`
5. `admin/package.json` → `"version": "0.001.0"`
6. `functions/index.js` → `const VERSION = '0.001.0';`
7. `functions/package.json` → `"version": "0.0.1"`

## Commands

### Windows (PowerShell)
- Sequential. One command per line. **Never `&&`**.

### macOS / Linux
- Bash/zsh. Can chain with `&&`.

## Working style

- Surgeon, not bulldozer. Precise targeted changes.
- Never modify anything unauthorized.
- Always explain reasoning before implementing.
- Don't invent fixes. If unsure, ask before acting.
