# WIZARD.md — Specification for Claude (v0.003)

> **For Claude reading this file**: when the user asks you to "generate the wizard", produce **exactly one React artifact** matching this specification.

## What's new in v0.003

- **i18n**: 12 languages (en, es, ca, fr, de, it, pt, nl, ja, ko, zh, ru). Auto-detects browser language. Manual selector always visible.
- **Firebase Console direct URLs**: Steps 7-8 use `console.firebase.google.com/project/{slug}/...` links — works in ANY language. No more navigating menus by label.
- **Sandbox-proof**: zero alert/confirm/clipboard as primary. Uses sendPrompt(), inline confirms, fallback textarea.

## 11-step structure

1. Welcome
2. App naming (slug + appName)
3. Google account (ownerEmail)  
4. Gemini API key
5. Authorized users
6. Config review
7. Create Firebase project + Blaze + budget (3 checkboxes)
8. Activate services via direct URLs (5 checkboxes)
9. Paste firebaseConfig (6 validated fields)
10. CLI setup (4 checkboxes)
11. Final summary + Send to Claude (JSON v0.003 with firebaseConfig)

## JSON shape (v0.003)

```json
{
  "version": "v0.003",
  "appName": "...",
  "slug": "...",
  "ownerEmail": "...",
  "geminiApiKey": "AIza...",
  "geminiModel": "gemini-2.5-pro",
  "authorizedUsers": [{ "email": "...", "role": "admin" }],
  "firestoreRegion": "eur3",
  "functionsRegion": "europe-west1",
  "firebaseConfig": { "apiKey":"...", "authDomain":"...", "projectId":"...", "storageBucket":"...", "messagingSenderId":"...", "appId":"..." }
}
```
