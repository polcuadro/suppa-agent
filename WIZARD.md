# WIZARD.md — Specification for Claude (v0.001)

> **For Claude reading this file**: when the user asks you to "generate the wizard", produce **exactly one React artifact** matching this specification. When the user sends the JSON from Step 11, generate **all project files** as described below.

## What this builds

A private AI chat app deployed on Firebase with:
- Google login (whitelist-only access)
- Persistent chat with Gemini 2.5 Flash (1M token context, free tier)
- Brain panel: manage users + 42-language i18n + context viewer with token usage bar
- Mobile responsive sidebar
- Retry with exponential backoff + fallback to gemini-2.0-flash on 503/429
- $0/year cost for personal use

## What's new in v0.001

- **gemini-2.5-flash is the default model** — Flash is free tier. Pro requires paid billing. The pitch is $0/year.
- **Brain panel** replaces "Manage Users": 3 tabs (Users, Language, Context). Context shows all chat history as editable text with token usage bar (% of 1M window).
- **42-language i18n** — auto-detects browser language, stored in localStorage.
- **Mobile responsive** — sidebar collapses to hamburger on screens < 768px.
- **Retry + fallback** — 3 retries with 2s/5s/8s delays for 503/429 errors, then falls back to gemini-2.0-flash.
- **saveBrainContext** Cloud Function — admin-only, saves system instruction to Firestore.
- **No admin site** — admin is a modal inside the main app.
- **Node.js 22** — Node 20 deprecated April 2026.
- **Sandbox-proof** — no alert/confirm/clipboard as primary. Uses sendPrompt(), inline confirms, fallback textarea.
- **Firebase Console direct URLs** — Steps 7-8 use direct links, works in any language.

## 11-step wizard structure

1. Welcome + language selector (12 wizard languages: en, es, ca, fr, de, it, pt, nl, ja, ko, zh, ru)
2. App naming (slug + appName)
3. Google account (ownerEmail)
4. Gemini API key (default: **gemini-2.5-flash**, selector shows Pro with "⚠️ requires paid billing")
5. Authorized users
6. Config review
7. Create Firebase project + Blaze + budget alert (3 checkboxes)
8. Activate services via direct URLs (4 checkboxes: Auth, Firestore, Hosting, Functions)
9. Paste firebaseConfig (6 validated fields)
10. CLI setup (6 checkboxes): Node.js 22+ installed, Firebase CLI installed, Logged in (⚠️ same account warning), Project linked, Secret Manager API enabled (direct GCP Console link), Gemini API key saved as secret
11. Final summary + Send to Claude (JSON v0.001 with all config)

## JSON shape (v0.001)

```json
{
  "version": "v0.001",
  "appName": "...",
  "slug": "...",
  "ownerEmail": "...",
  "geminiApiKey": "AIza...",
  "geminiModel": "gemini-2.5-flash",
  "authorizedUsers": [{ "email": "...", "role": "admin" }],
  "firestoreRegion": "eur3",
  "functionsRegion": "europe-west1",
  "firebaseConfig": { "apiKey":"...", "authDomain":"...", "projectId":"...", "storageBucket":"...", "messagingSenderId":"...", "appId":"..." }
}
```

## What Claude generates from the JSON

When the user sends the JSON from Step 11, Claude generates ALL project files as a downloadable zip. Every file uses REAL values from the JSON — zero placeholders.

### File structure

```
{slug}/
├── web/
│   ├── public/
│   │   ├── favicon.png
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx          # Chat with seq ordering, i18n
│   │   │   └── BrainPanel.jsx    # 3 tabs: Users, Language, Context
│   │   ├── hooks/
│   │   │   └── useAuth.js        # Google login + authorization check
│   │   ├── services/
│   │   │   └── firebase.js       # Firebase config (real values from JSON)
│   │   ├── i18n.js               # 42 languages, 30 keys each
│   │   ├── App.jsx               # Root: login/chat/brain routing, mobile responsive
│   │   ├── constants.js          # VER, APP_NAME
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json              # React 18, Vite, Firebase SDK
│   └── vite.config.js
├── functions/
│   ├── index.js                  # chatWithGemini (retry+fallback) + saveBrainContext + healthCheck
│   └── package.json              # Node 22, firebase-functions, @google/generative-ai
├── firebase.json                 # Single-site hosting
├── .firebaserc                   # Project alias
├── firestore.rules               # Rules for chats, authorizedUsers, brain, users
├── firestore.indexes.json        # chats composite index (ownerId ASC + updatedAt DESC)
└── CLAUDE.md                     # Post-deploy instructions
```

### Critical implementation details for Claude

**functions/index.js must include:**
- `chatWithGemini`: retry loop (3 attempts, 2s/5s/8s delays) for 503/429/Service Unavailable/overloaded/high demand/RESOURCE_EXHAUSTED. After 3 failures, fallback to `gemini-2.0-flash`. Reads `brain/context` as `systemInstruction`. Saves token usage to `brain/usage`.
- `saveBrainContext`: admin-only, saves text to `brain/context`.
- `healthCheck`: returns version + timestamp.
- All functions: region `europe-west1`, firebase-functions/v2 `onCall`.

**BrainPanel.jsx must include:**
- Tab "Users": add/remove authorized users (same as old AdminPanel)
- Tab "Language": grid of 42 languages, click to switch, stored in localStorage
- Tab "Context": loads ALL messages from ALL user's chats into an editable textarea. Shows token usage bar (% of 1M). User can delete old text and save to reduce context. Calls `saveBrainContext` to persist.

**App.jsx must include:**
- Mobile responsive: `useIsMobile()` hook at 768px breakpoint
- Sidebar slides in/out on mobile with backdrop
- Hamburger button in mobile header
- All strings via `t()` from i18n
- Button label: "Brain" (no emoji)

**i18n.js must include:**
- 42 languages: ar, bg, bn, ca, cs, da, de, el, en, es, et, fa, fi, fr, hi, hr, hu, id, it, ja, ko, lt, lv, ms, nl, no, pl, pt, ro, ru, sa, sk, sl, sv, sw, th, tl, tr, uk, ur, vi, zh
- Keys: loading, loginGoogle, notAuth, notOnList, logout, newChat, selectChat, startMsg, typePlaceholder, send, brain, users, language, add, remove, user, admin, validEmail, exists, noSelfRemove, dismiss, tagline, context, contextWindow, save, clear, saved, noData
- Auto-detect browser language, fallback to English
- Persist in localStorage as `sa-lang`

**firestore.rules must include:**
- `chats/{chatId}`: read/write if auth.uid == resource.data.ownerId
- `chats/{chatId}/messages/{msgId}`: read/write if parent chat ownerId matches
- `authorizedUsers/{email}`: read if authenticated, write if admin
- `brain/{docId}`: read if authenticated, write if admin
- `users/{uid}`: read/write if auth.uid == uid

**firestore.indexes.json must include:**
- Composite index: collection `chats`, fields `ownerId ASC` + `updatedAt DESC`

## CLAUDE.md (post-deploy instructions)

The generated CLAUDE.md must contain these exact steps:

```
# Post-deploy checklist for {appName}

## Deploy commands
cd web && npm install
cd ../functions && npm install
cd ..
firebase deploy

## After deploy (REQUIRED)

### 1. Create Firestore composite index
Open the app in browser. You'll see an error with a link.
Click the link → Create index → Wait 2-3 minutes.

### 2. Add Cloud Run invoker permissions
Go to Google Cloud Console → Cloud Run.
For EACH of these 3 services: chatWithGemini, healthCheck, saveBrainContext
→ Click service → Security tab → Add "allUsers" with role "Cloud Run Invoker"

### 3. Create first admin user
Go to Firebase Console → Firestore → Create document:
- Collection: authorizedUsers
- Document ID: {ownerEmail}
- Field: role = "admin"

### 4. Verify
Reload the app → Login with {ownerEmail} → Send a test message → Verify response appears.
Open Brain → Check Users tab shows you as admin.
Open Brain → Context tab → Should show your test message.
```

## Critical rules

- **gemini-2.5-flash MUST be the default model.** Pro requires paid billing.
- **Node.js 22+** — Node 20 deprecated April 2026.
- **Secret Manager API** must be enabled in GCP Console BEFORE `firebase functions:secrets:set`.
- **firebase login** must use the SAME Google account that owns the Firebase project.
- **Gen 2 Cloud Functions** run on Cloud Run — `allUsers` must be added as `roles/run.invoker` for ALL 3 functions.
- **First admin** must be created manually in Firestore.
- **Composite index** on chats — created via error link on first load.
- **Sandbox-proof wizard**: No `alert()`, `confirm()`, `navigator.clipboard` as primary.
- **Unique filenames**: Never deliver two files with the same name.
