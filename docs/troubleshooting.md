# Troubleshooting

A growing list of issues encountered by users with concrete fixes. If you hit something not listed here, open an issue.

---

## Setup phase

### "command not found: npm"

You haven't installed Node.js. See `MANUAL.pdf` Phase 0 or `nodejs.org`.

### "scripts disabled on this system" (Windows)

PowerShell execution policy blocking npm.

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Type `Y` when asked. Close and reopen PowerShell.

### "Permission denied" when running `npm install -g` on macOS

Don't `sudo`. Configure npm prefix:

```bash
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zprofile
source ~/.zprofile
```

Then re-run `npm install -g firebase-tools`.

### `firebase login` opens browser but never completes

Firewall or browser issue. Try:

```bash
firebase login --no-localhost
```

This gives you a code to paste manually.

### `firebase use --add` shows no projects

Make sure you're logged in to the right Google account:

```bash
firebase logout
firebase login
```

### "This project is on the Spark Plan" when deploying functions

Cloud Functions require Blaze. See `MANUAL.pdf` Phase 4.2 to upgrade.

---

## Deploy phase

### `firebase deploy` first run takes forever

Normal. APIs being enabled. First deploy is 3-5 minutes. Subsequent deploys are 30-90 seconds.

If it stalls > 10 minutes, `Ctrl+C` and try `firebase deploy --debug` to see what's happening.

### "Site not found"

`.firebaserc` site IDs don't match Firebase Console → Hosting. Verify both names exactly.

### "GEMINI_API_KEY is undefined" in function logs

You set the secret but didn't redeploy.

```bash
firebase deploy --only functions
```

After every secret change, redeploy.

### "Error: HTTP Error: 403, Cloud Build API has not been used"

Click the link Firebase shows you to enable Cloud Build API. Re-deploy.

### "Cannot find module 'firebase-functions'"

`npm install` was never run in `functions/`.

```bash
cd starter/functions
npm install
cd ..
firebase deploy --only functions
```

### Build fails: "Cannot find module 'firebase'"

`npm install` was never run in `web/` (or `admin/`).

```bash
cd starter/web
npm install
cd ../admin
npm install
```

---

## Auth phase

### Login popup opens but immediately closes

Pop-up blocker. Allow pop-ups for `*.web.app` and `*.firebaseapp.com`.

### "Firebase: Error (auth/unauthorized-domain)"

The domain you're loading the app from isn't authorized in Firebase Auth.

Firebase Console → Authentication → Settings → **Authorized domains** → Add domain.

By default, `*.web.app`, `*.firebaseapp.com`, and `localhost` are pre-approved. If you have a custom domain, you must add it manually.

### "Firebase: Error (auth/popup-closed-by-user)"

User closed the popup. Not an error you need to handle, but you can show a friendlier message:

```jsx
catch (err) {
  if (err.code === 'auth/popup-closed-by-user') {
    // ignore silently
  } else {
    alert(err.message);
  }
}
```

### Logging in shows "Access not authorized"

Your email isn't in `authorizedUsers/`. Either:
- Add it via Firebase Console (manual, see `MANUAL.pdf` Phase 13).
- If you have admin access on the admin URL, add it there.

If you think you added it but it still says no:
- Check the email is **lowercase** in Firestore.
- Check there are no leading/trailing spaces.
- The Document ID must match exactly.

---

## Runtime phase

### Chat: "Error: permission-denied"

The user is logged in but isn't in `authorizedUsers/`. Check Firestore.

### Chat: "Error: unauthenticated"

User isn't logged in (or the auth state didn't sync). Force a logout/login cycle.

### Chat: function times out

Default timeout is 540 seconds in our code. If Gemini times out before that, the conversation is too long for the model.

Solutions:
- Switch to `gemini-2.5-flash` (faster).
- Reduce `maxOutputTokens` in the function.
- Start a new chat (large history adds latency even with 1M context).

### Code Tester is empty

Three possible reasons:

1. Your email isn't in `authorizedUsers/` — fix that first.
2. The frontend isn't connecting — open browser DevTools (F12) → Network tab → look for blocked requests.
3. The backend hasn't logged anything yet. Send a message in the chat. A `[gemini-call]` log should appear immediately.

If still empty after all three:
- Check `firestore.rules` is deployed (`firebase deploy --only firestore:rules`).
- Check the rules allow `read: if isAuthorized()` on `testerLogs/`.

### Code Tester shows old logs but nothing new

The Firestore listener probably broke. Refresh the page.

If it keeps happening, check the browser console for Firestore connection errors. Could be a Firestore rules issue.

### Messages don't appear after sending

The Cloud Function call probably failed. Open the Code Tester and look for a red `[error]` log.

If the Code Tester is also empty:
- Open DevTools → Network → look for the call to `chatWithGemini`. Check the response.
- Check `firebase functions:log --only chatWithGemini` from the terminal.

### Chat seems to "forget" old messages

This shouldn't happen — the function loads the entire history. If it is happening:

1. Check `messageCount` on the chat document. Does it match the number of messages?
2. Check the function log: it prints `historyLen` on every call. Does it match?
3. Verify you're using `gemini-2.5-pro` (1M context) and not `gemini-2.0` or older.

### Image upload fails silently

1. File too large? Limit is 4 MB in our code.
2. Wrong mime type? `image/jpeg`, `image/png`, `image/webp` work.
3. Backend not updated? You may have only updated the frontend. Re-deploy functions.

### Mobile keyboard hides the input field

Add this to `Chat.jsx`'s outer div:
```jsx
style={{ height: '100dvh' }}  // dynamic viewport height
```

instead of `100vh`. Modern mobile browsers respect `dvh`.

---

## Cost / billing

### I got a bill from Firebase

Don't panic. Check Firebase Console → Usage and billing → Details. Common causes:

1. **Bug causing infinite loop** — e.g., a frontend listener spawning new ones. Check Code Tester for repeated identical logs.
2. **Misconfigured rules causing thousands of failed reads** — Firestore charges denied reads. Check Firebase Console → Firestore → Usage.
3. **Functions invoked from public URL** — if anyone (not just authorized users) can hit the function, you'll pay for those invocations even if denied.
4. **Cloud Storage charges from images** — if you started storing images, that adds up.

If you set up the $5/month alert as instructed, you'd have been notified at $2.50.

### How do I cap spending hard?

Firebase doesn't offer a hard cap (it's risky for production apps that need to handle bursts). But you can:

1. Set a low budget alert ($1/month).
2. Disable billing manually if you exceed it (apps stop working but no further charges).
3. Use the `maxInstances` config in Cloud Functions to limit parallelism — already set to 10 in our code.

---

## Customization

### My App.jsx is growing too much

Refactor into smaller components. Anything over ~150 lines should be split.

Ask Claude Code: *"Extract X portion of App.jsx into its own component file."*

### My new feature breaks the build

Common causes:
- Forgot to import the new component in `App.jsx`.
- Used a Firebase function that requires a different region.
- Tailwind class typos (we don't use Tailwind in suppa-agent core, but if you added it, check class names).

### My systemInstruction isn't being used

After changing `systemInstruction` in `functions/index.js`, you must redeploy:

```bash
firebase deploy --only functions
```

Frontend changes don't propagate to Gemini.

---

## Working with Claude / Claude Code

### Claude Code is making weird modifications

Tell Claude Code to read `CLAUDE.md` again. Specifically:

> "Re-read CLAUDE.md and confirm you understand the workflow. Don't develop new features yourself; only execute what I copy-paste from Claude.ai chat."

If it keeps drifting, open a fresh Claude Code session.

### Claude.ai keeps generating monolithic App.jsx

When asking for new features, always say:

> "Add this as a new component in its own file. Do not modify App.jsx except to import it."

If it starts inflating `App.jsx`, stop and ask for the extraction.

### I'm running out of Claude Pro messages

You're probably doing in chat what should be in Claude Code. Re-read the manual's "The Claude workflow" section. Rule of thumb:
- Designing or generating new code → Claude.ai chat
- Running terminal commands, building, deploying → Claude Code

---

## Still stuck?

Open an issue at the repo. Include:

1. What you were trying to do.
2. What command/action you took.
3. The exact error message (full text, not summarized).
4. Your OS, Node version, Firebase tools version.
5. Whether anything in this troubleshooting doc was relevant.

We respond in English, Spanish, or Catalan.
