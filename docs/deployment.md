# Deployment

This is the concise, command-by-command deployment guide. For the full conceptual walkthrough with explanations, see `MANUAL.pdf`. This document assumes you've read at least the first few pages of the manual.

## Prerequisites

- Node.js 20+ installed
- npm installed
- Firebase CLI installed: `npm install -g firebase-tools`
- A Firebase project on the **Blaze** plan
- A Gemini API key (from Google AI Studio)
- This repo cloned, with `cd suppa-agent/starter`

## One-time setup (10 minutes)

### 1. Login to Firebase

```bash
firebase login
```

### 2. Link to your Firebase project

```bash
firebase use --add
```

Select your project from the list. Alias as `default`.

### 3. Update configuration files

Edit `.firebaserc` (rename from `.firebaserc.example` if needed) and replace `my-app` with your real Firebase Project ID:

```json
{
  "projects": {
    "default": "your-real-project-id"
  },
  "targets": {
    "your-real-project-id": {
      "hosting": {
        "web": ["your-real-project-id"],
        "admin": ["your-real-project-id-admin"]
      }
    }
  }
}
```

### 4. Create the second hosting site (admin)

In Firebase Console → Hosting → **Add another site**. Name: `your-real-project-id-admin`.

### 5. Get Firebase web config

Firebase Console → ⚙ Project Settings → Your apps → Add app → web `</>`. Copy the config object.

Open `starter/web/src/services/firebase.js` AND `starter/admin/src/services/firebase.js`. Paste the values into both files (replacing the `"..."` placeholders).

### 6. Set the Gemini API key as a secret

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

Paste your Gemini key (starts with `AIza...`) when prompted.

### 7. Install dependencies

```bash
cd starter/web
npm install
cd ../admin
npm install
cd ../functions
npm install
cd ..
```

### 8. Deploy security rules first

```bash
firebase deploy --only firestore:rules
```

### 9. Add yourself as the first admin (manual)

Firebase Console → Firestore Database → **Start collection**:
- Collection ID: `authorizedUsers`
- Document ID: your email exactly (e.g., `me@example.com`)
- Fields:
  - `role` (string): `admin`
  - `addedAt` (timestamp): now
  - `addedBy` (string): `manual`

Save.

## Build and deploy (every time you change something)

### Build the frontends

> **macOS / Linux**
> ```bash
> cd starter/web && npm run build
> cd ../admin && npm run build
> cd ..
> ```
>
> **Windows (PowerShell)**
> ```powershell
> cd starter\web
> npm run build
> cd ..\admin
> npm run build
> cd ..
> ```

### Deploy everything

```bash
firebase deploy
```

This deploys: rules + indexes + functions + hosting (web + admin).

First deploy takes 3-5 minutes (APIs need to be enabled). Subsequent deploys take 30-90 seconds.

### Deploy partial (faster for small changes)

| Change type | Command |
|-------------|---------|
| Frontend (web) only | `firebase deploy --only hosting:web` |
| Frontend (admin) only | `firebase deploy --only hosting:admin` |
| Cloud Functions only | `firebase deploy --only functions` |
| Firestore rules only | `firebase deploy --only firestore:rules` |

## Verification

After deploy:
- Open `https://your-project-id.web.app` → log in with Google → you should see the chat.
- Open `https://your-project-id-admin.web.app` → log in with Google → you should see the admin panel.

If the admin panel says "Not authorized", you haven't added your email to `authorizedUsers/` correctly. See step 9.

## Common errors

### "GEMINI_API_KEY is undefined" in function logs

You set the secret but didn't redeploy functions afterward.

```bash
firebase deploy --only functions
```

### "Site not found"

Your `.firebaserc` site IDs don't match what's in Firebase Console → Hosting. Verify both names are identical.

### "Firebase: Error (auth/unauthorized-domain)"

Your custom domain isn't on the auth allowlist. Firebase Console → Authentication → Settings → Authorized domains → add it.

### Build fails: "Could not resolve 'firebase'"

You forgot `npm install` in either `web/` or `admin/`. Run it again.

### Build fails: "Cannot find module '@google/generative-ai'"

You forgot `npm install` in `functions/`.

### `firebase deploy` fails: "Cloud Build API is not enabled"

Click the link in the error to enable it. Re-run deploy.

## Updating versions

Suppa-agent uses 7-point version sync. When you bump the version, change all 7 places:

1. `web/src/constants.js` → `export const VER = "v0001";`
2. `web/package.json` → `"version": "0.001.0"`
3. `web/index.html` → `<meta name="version" content="v0.001">`
4. `admin/src/constants.js` → `export const VER = "v0001";`
5. `admin/package.json` → `"version": "0.001.0"`
6. `functions/index.js` → `const VERSION = '0.001.0';`
7. `functions/package.json` → `"version": "0.0.1"`

Tip: ask Claude Code to do this for you. *"Bump the version from v0.001 to v0.002 across all 7 sync points."*

## Custom domain (optional)

1. Firebase Console → Hosting → your site → **Add custom domain**.
2. Enter your domain.
3. Add the DNS records Firebase provides at your registrar.
4. Wait for verification (up to 24 hours, usually under an hour).
5. SSL is auto-provisioned.

You can do this for both `web` and `admin` separately.

## Rollback

If a deploy goes wrong:

```bash
firebase hosting:channel:list
firebase hosting:rollback
```

This reverts the last hosting deploy. For functions, redeploy a previous git commit.

## Production checklist

Before sharing your app with users:

- [ ] First admin user added manually
- [ ] Budget alert configured ($5/month)
- [ ] Security rules reviewed and deployed
- [ ] All 7 version locations consistent
- [ ] Code Tester verified working (see logs after first chat)
- [ ] Tested on mobile (open `your-app.web.app` from your phone)
- [ ] Tested unauthorized email is properly blocked
- [ ] Custom domain configured (optional)
- [ ] README in your private repo updated
- [ ] First entry in your private repo's CHANGELOG (if you keep one)
