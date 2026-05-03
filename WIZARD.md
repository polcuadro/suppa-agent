# WIZARD.md — Specification for Claude

> **For Claude reading this file**: when the user asks you to "generate the wizard", "build me the suppa-agent wizard", "show me the wizard artifact", or anything similar, you must produce **exactly one React artifact** matching this specification. Do not deviate from the structure below. Do not split into multiple artifacts. Do not skip steps.

This file describes the wizard artifact that guides users through the **complete** configuration of their suppa-agent app inside a Claude.ai conversation. The wizard collects the user's choices, walks them through Firebase Console setup, collects the real firebaseConfig values, validates everything, and produces a final configuration JSON. After the wizard is completed, Claude generates the actual project files using that JSON — with real config values, zero placeholders.

---

## Artifact requirements

- **Type**: React component (single file, default export, no required props).
- **Stored data**: use `window.storage` for persistence across sessions.
- **Storage key**: `suppa-agent:wizard:state`.
- **Styling**: Tailwind core utilities only.
- **Mobile-friendly**: works at 375px width minimum.
- **No external API calls**: everything is local state.
- **No localStorage**: only `window.storage`.
- **Sandbox-safe**: never use `alert()`, `confirm()`, or `navigator.clipboard` as primary action. Use inline toasts, inline confirmation dialogs, `sendPrompt()` for sending to Claude, and selectable textarea as fallback.

---

## Wizard structure: 11 steps

### Steps 1–6: Configuration collection

#### Step 1 — Welcome
#### Step 2 — App naming (slug + appName)
#### Step 3 — Google account (ownerEmail)
#### Step 4 — Gemini API key
#### Step 5 — Authorized users
#### Step 6 — Configuration review (intermediate summary before Firebase)

### Steps 7–10: Firebase Console setup (guided)

#### Step 7 — Create Firebase project + Blaze + budget alert (3 checkboxes)
#### Step 8 — Activate services: Auth, Firestore eur3, Hosting multi-site, Functions (5 checkboxes)
#### Step 9 — Get firebaseConfig: add web app, paste 6 values with validation
#### Step 10 — CLI setup: firebase-tools, login, use --add, secrets:set (4 checkboxes)

### Step 11 — Final summary & generate

Full summary + Send to Claude with complete JSON including firebaseConfig.

---

## JSON shape (v0.002)

```json
{
  "version": "v0.002",
  "appName": "...",
  "slug": "...",
  "ownerEmail": "...",
  "geminiApiKey": "AIza...",
  "geminiModel": "gemini-2.5-pro",
  "authorizedUsers": [{ "email": "...", "role": "admin" }],
  "firestoreRegion": "eur3",
  "functionsRegion": "europe-west1",
  "firebaseConfig": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

---

## After the wizard

Claude receives the complete JSON and generates all project files with real values — zero placeholders. Delivered as zips with Claude Code commands.
