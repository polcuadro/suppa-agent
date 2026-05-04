# WIZARD.md — Specification for Claude (v0.008)

> **For Claude reading this file**: when the user asks you to "generate the wizard", produce **exactly one React artifact** matching this specification.

## What's new in v0.008

- **gemini-2.5-flash is the default model** — Flash is free tier, Pro requires paid billing. The pitch is $0/year.
- **Step 10 expanded**: Node.js 22+ requirement, Secret Manager API checkbox with direct GCP Console link, login account warning.
- **Step 11 prompt includes post-deploy steps**: Composite index fix, Cloud Run invoker role, first admin document creation, verification.
- **No admin site** — removed for v1. Admin is a modal inside the main app.
- **i18n**: 12 languages (en, es, ca, fr, de, it, pt, nl, ja, ko, zh, ru). Auto-detects browser language. Manual selector always visible.
- **Firebase Console direct URLs**: Steps 7-8 use `console.firebase.google.com/project/{slug}/...` links — works in ANY language.
- **Sandbox-proof**: zero alert/confirm/clipboard as primary. Uses sendPrompt(), inline confirms, fallback textarea.

## 11-step structure

1. Welcome
2. App naming (slug + appName)
3. Google account (ownerEmail)
4. Gemini API key (default: **gemini-2.5-flash**, NOT pro)
5. Authorized users
6. Config review
7. Create Firebase project + Blaze + budget (3 checkboxes)
8. Activate services via direct URLs (4 checkboxes: Auth, Firestore, Hosting, Functions)
9. Paste firebaseConfig (6 validated fields)
10. CLI setup (5 checkboxes: Firebase CLI, login with correct account, link project, Secret Manager API, save Gemini secret) + Node.js 22+ warning
11. Final summary + Send to Claude (JSON v0.008 with firebaseConfig + post-deploy instructions)

## JSON shape (v0.008)

```json
{
  "version": "v0.008",
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

## Critical rules

- **gemini-2.5-flash MUST be the default model.** Pro requires paid billing and violates the $0/year pitch.
- **Node.js 22+** — Node 20 was deprecated April 2026.
- **Secret Manager API** must be enabled in GCP Console BEFORE `firebase functions:secrets:set`.
- **firebase login** must use the SAME Google account that owns the Firebase project.
- **Gen 2 Cloud Functions** run on Cloud Run — `allUsers` must be added as `roles/run.invoker` after deploy.
- **First admin** must be created manually in Firestore: `authorizedUsers/{email}` with `role: "admin"`.
- **Composite index** on chats (ownerId ASC + updatedAt DESC) — created via error link on first app load.
- **No admin site** — admin is a modal inside the main app. Do NOT generate admin/ frontend.
- **Sandbox-proof**: No `alert()`, `confirm()`, `navigator.clipboard` as primary. Use `sendPrompt()`, inline confirms, fallback textarea.
