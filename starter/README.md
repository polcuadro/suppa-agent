# suppa-agent starter

The "ready-to-deploy" version of the app. This is what the wizard or manual would generate for you, but pre-built for developers who want to fork directly without going through Claude.

## What's here

```
starter/
├── README.md             ← this file
├── firebase.json         ← multi-site hosting config
├── .firebaserc.example   ← rename to .firebaserc and edit
├── firestore.rules       ← security rules
├── firestore.indexes.json
├── CLAUDE.md             ← workflow instructions if using Claude Code
├── web/                  ← user-facing frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── constants.js
│       ├── index.css
│       ├── services/firebase.js
│       ├── hooks/useAuth.js
│       └── components/
│           ├── Chat.jsx
│           └── CodeTester.jsx
├── admin/                ← admin frontend (mirror of web/)
│   └── ... (similar structure)
└── functions/            ← Cloud Functions
    ├── package.json
    └── index.js
```

## Quick deploy (10 minutes if you have all prerequisites)

See `../docs/deployment.md` for the full command-by-command guide.

TL;DR:

```bash
# 1. Edit configuration
mv .firebaserc.example .firebaserc
# Edit .firebaserc and set your real Project ID

# 2. Install dependencies
cd web && npm install && cd ..
cd admin && npm install && cd ..
cd functions && npm install && cd ..

# 3. Configure Firebase
firebase use --add
# Select your project

# 4. Set Gemini API key
firebase functions:secrets:set GEMINI_API_KEY

# 5. Update firebase config in src/services/firebase.js (web/ and admin/)
# Get the values from Firebase Console → Project Settings → Your apps

# 6. Deploy
cd web && npm run build && cd ..
cd admin && npm run build && cd ..
firebase deploy

# 7. Add yourself as first admin manually in Firestore Console
# See docs/deployment.md step 9
```

## What's pre-configured

- ✅ Multi-site hosting (`web` + `admin`)
- ✅ Firestore rules with whitelist authentication
- ✅ Cloud Function with Gemini 2.5 Pro integration
- ✅ Real-time Code Tester
- ✅ Atomic batch writes for messages
- ✅ Security: server-side message writes only
- ✅ EU regions (`eur3` Firestore, `europe-west1` functions)

## What you need to fill in

After cloning:

| File | What to change |
|------|----------------|
| `.firebaserc` | Your Firebase Project ID |
| `web/src/services/firebase.js` | Firebase web config (6 values) |
| `admin/src/services/firebase.js` | Same Firebase web config |
| Gemini API key | Set as Firebase secret (`GEMINI_API_KEY`) |
| First admin | Manually added in Firestore Console |

That's it. ~5 fields total, all of which the wizard or manual would walk you through.

## License

MIT (same as the parent repo).
