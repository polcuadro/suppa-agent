# Architecture

This document describes the system architecture of suppa-agent at the v0.001 level. Diagrams in ASCII because they survive copy-paste, mobile reading, and version control beautifully.

## System overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                          │
│                                                                  │
│   ┌───────────────────────┐      ┌───────────────────────┐       │
│   │ my-app.web.app        │      │ my-app-admin.web.app  │       │
│   │  (Vite + React)       │      │  (Vite + React)       │       │
│   │                       │      │                       │       │
│   │  • Login              │      │  • Login              │       │
│   │  • Chat list          │      │  • Authorized users   │       │
│   │  • Active chat        │      │  • User activity      │       │
│   │  • CodeTester (live)  │      │  • CodeTester (live)  │       │
│   └───────────┬───────────┘      └───────────┬───────────┘       │
│               │                              │                   │
└───────────────┼──────────────────────────────┼───────────────────┘
                │                              │
                │ HTTPS, Firebase SDK          │
                │                              │
┌───────────────┼──────────────────────────────┼───────────────────┐
│               ▼                              ▼                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                  FIREBASE AUTHENTICATION                  │   │
│  │           (Google sign-in, JWT tokens issued)             │   │
│  └─────────────┬─────────────────────────────┬───────────────┘   │
│                │                             │                   │
│                ▼                             ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    FIRESTORE DATABASE                       │ │
│  │                       (region: eur3)                        │ │
│  │                                                             │ │
│  │  Collections:                                               │ │
│  │   • authorizedUsers/{email}     — whitelist                 │ │
│  │   • users/{uid}                 — profile data              │ │
│  │   • chats/{chatId}              — conversations             │ │
│  │     └ messages/{msgId}          — subcollection             │ │
│  │   • testerLogs/{logId}          — live event stream         │ │
│  │                                                             │ │
│  │  Access: governed by firestore.rules                        │ │
│  │   • Whitelisted users only                                  │ │
│  │   • Per-user data isolation                                 │ │
│  │   • Messages writable only via Cloud Functions              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│                                │ admin SDK (bypasses rules)      │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                CLOUD FUNCTIONS (Node.js 20)                 │ │
│  │                  (region: europe-west1)                     │ │
│  │                                                             │ │
│  │   chatWithGemini (callable)                                 │ │
│  │    1. Verify request.auth and authorization                 │ │
│  │    2. Load full message history from Firestore              │ │
│  │    3. Call Gemini API with history + new message            │ │
│  │    4. Persist user msg + assistant msg in atomic batch      │ │
│  │    5. Log to testerLogs/ (visible in Code Tester)           │ │
│  │    6. Return response to client                             │ │
│  │                                                             │ │
│  │   healthCheck (callable)                                    │ │
│  │    Simple liveness probe, returns version                   │ │
│  └─────────────────────────────┬───────────────────────────────┘ │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 │ HTTPS, GEMINI_API_KEY (secret)
                                 ▼
                    ┌─────────────────────────────┐
                    │       GOOGLE GEMINI         │
                    │       (gemini-2.5-pro)      │
                    │                             │
                    │   1M tokens context         │
                    │   Multimodal (text+image)   │
                    └─────────────────────────────┘
```

## Data model

### `authorizedUsers/{email}`

Whitelist of who can use the app. Doc ID is the user's email (lowercase).

```js
{
  role: 'user' | 'admin',     // 'admin' = can manage the list
  addedAt: Timestamp,
  addedBy: string,            // Email of the admin who added them, or 'manual'
}
```

Read access: any signed-in user (so they can check their own status).
Write access: admin role only (enforced by Firestore rules).

### `users/{uid}`

Profile data per authenticated user. Auto-created/updated on each login.

```js
{
  email: string,
  displayName: string,
  photoURL: string,
  lastSeen: Timestamp,
}
```

### `chats/{chatId}`

A conversation thread.

```js
{
  ownerId: string,            // uid of owner
  title: string,              // First 60 chars of first message
  createdAt: Timestamp,
  updatedAt: Timestamp,
  messageCount: number,
}
```

### `chats/{chatId}/messages/{msgId}`

Subcollection. Every message in a chat.

```js
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: Timestamp,
  hasImage?: boolean,         // Optional: indicates an image was part of the message
  tokensIn?: number,          // Only on assistant messages
  tokensOut?: number,         // Only on assistant messages
}
```

Direct frontend writes are **denied**. All message writes happen via the Cloud Function with the admin SDK.

### `testerLogs/{logId}`

Append-only stream of backend events. The frontend Code Tester listens to this in real-time.

```js
{
  type: string,               // 'gemini-call', 'auth', 'error', 'info', etc.
  message: string,
  uid: string | null,
  severity: 'info' | 'warn' | 'error',
  meta: object,               // Free-form details
  version: string,            // Backend version that emitted the log
  timestamp: Timestamp,
}
```

Read access: any authorized user.
Write access: server-side only (Cloud Functions with admin SDK).

## Security model

The security layer has three lines of defense:

### 1. Firebase Authentication

Only Google sign-in. No anonymous, no email/password. JWT tokens are validated automatically by Firebase services.

### 2. Whitelist (authorizedUsers)

Even after a successful Google sign-in, the user's email must exist in `authorizedUsers/`. The frontend `useAuth` hook checks this and blocks the UI for non-whitelisted users. The backend independently re-verifies on every Cloud Function call.

This means: a stranger can complete Google sign-in but won't be able to do anything in the app. They see a "Not authorized" screen.

### 3. Firestore Security Rules

Every collection has explicit rules:
- `authorizedUsers/`: read by signed-in users, write by admins only
- `users/`: read/write by owner only (or admins)
- `chats/`: read/write by owner only (admins read-only)
- `chats/.../messages/`: read by chat owner, **no client writes** (server-only)
- `testerLogs/`: read by authorized users, **no client writes**

The "no client writes" rule on `messages` and `testerLogs` means: even if someone bypasses the frontend (e.g., directly calls the Firestore SDK from a hacked client), they cannot inject fake messages or fake logs. Only the Cloud Function, running with the admin SDK on Google's servers, can write there.

## Why a Cloud Function instead of calling Gemini directly from the browser?

Three reasons:

1. **API key security.** The Gemini API key is a secret. It's stored in Google Cloud's Secret Manager, only accessible to the function. If we called Gemini directly from the browser, the key would be in JavaScript and visible to anyone with DevTools.

2. **Authorization control.** The function verifies the user is in `authorizedUsers/` before doing anything. A direct browser call would let anyone with the key make requests.

3. **Atomic message writes.** The function writes user message + assistant response in a single Firestore batch, ensuring chats stay consistent even if something fails mid-call.

## Why `eur3` for Firestore?

`eur3` is the Europe multi-region. Data is replicated synchronously across Belgium, the Netherlands, and Finland. Benefits:

- **GDPR-friendly**: data stays in EU jurisdictions.
- **Low latency** for European users.
- **High availability**: zone failures are absorbed automatically.

If you're outside Europe, switch to `nam5` (US multi-region) or another regional option. **This choice is permanent — it cannot be changed after Firestore is created.**

## Why `europe-west1` for Cloud Functions?

`europe-west1` is in Belgium and is consistently fast from anywhere in Europe. It's also closer to Gemini's API endpoints, reducing total latency.

If your users are not in Europe, change to a closer region (e.g., `us-central1`, `asia-northeast1`).

## How the Code Tester works

The Code Tester is a frontend component (`CodeTester.jsx`) that does one thing:

1. Subscribes to `testerLogs/` ordered by timestamp descending, limit 100.
2. Renders each log as a green-on-black terminal-style line.
3. Updates instantly when the Cloud Function writes new logs (Firestore real-time sync).

Key insight: **the Code Tester doesn't need any custom backend**. It's just a Firestore listener. The Cloud Function writes to `testerLogs/`, and Firestore's real-time engine pushes updates to all connected clients.

This means the Code Tester is essentially free: zero additional infrastructure, zero polling, zero latency.

## Performance characteristics

| Operation | Typical latency |
|-----------|-----------------|
| Login (Google popup) | 1-3 seconds |
| Loading chat list | < 200 ms |
| Loading messages in a chat | < 300 ms |
| Sending a message → first byte of response | 500-2000 ms (depends on Gemini) |
| Sending a message → full response (typical 200-token answer) | 2-5 seconds |
| Code Tester log appearance after backend write | < 200 ms |

Bottlenecks at v0.001:
- Gemini response time (the unavoidable one).
- Cloud Function cold start: ~2 seconds the first call after inactivity. Subsequent calls reuse the warm instance.

## Scalability ceiling

The free tier can handle:
- 50,000 Firestore reads/day → with 100 users sending 5 messages each, that's 500 chats × 10 reads = 5,000 reads. 10x headroom.
- 2M Cloud Function invocations/month → at 100 invocations/day, you'd hit this in ~55 years.
- 5 GB hosting transfer/month → the app build is < 1 MB. You'd need 5,000 unique loads/month to dent it.

In practice: **for a small team (10-50 users), you'll never see a bill.**

## What's intentionally simple

This is a starter kit. We deliberately don't include:

- Test infrastructure (Playwright, Vitest) — keeps the dependency tree small.
- TypeScript — keeps the code accessible to non-developers.
- State management (Redux, Zustand) — `useState` and Firestore subscriptions are enough.
- Routing library — not needed for the two-screen flow.
- Theme system — basic inline styles are good enough at this scale.
- Internationalization — single-language UI in v0.001.

These will likely be added incrementally as the codebase grows. See `ROADMAP.md`.
