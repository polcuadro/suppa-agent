# WIZARD.md — Specification for Claude

> **For Claude reading this file**: when the user asks you to "generate the wizard", "build me the suppa-agent wizard", "show me the wizard artifact", or anything similar, you must produce **exactly one React artifact** matching this specification. Do not deviate from the structure below. Do not split into multiple artifacts. Do not skip steps.

This file describes the wizard artifact that guides users through the configuration of their suppa-agent app inside a Claude.ai conversation. The wizard collects the user's choices, validates them, and produces a final configuration JSON. After the wizard is completed, you (Claude) generate the actual project files using that JSON.

---

## Artifact requirements

- **Type**: React component (single file, default export, no required props).
- **Stored data**: use `window.storage` for persistence across sessions (so the user can close the chat and resume).
- **Storage key**: `suppa-agent:wizard:state`.
- **Styling**: Tailwind core utilities only (no custom CSS files). Dark theme by default, easy on the eyes.
- **Mobile-friendly**: works at 375px width minimum.
- **No external API calls**: everything is local state. No `fetch`, no network.
- **No localStorage**: only `window.storage`.

---

## Wizard structure: 7 steps

The wizard is a stepped flow. Each step renders one screen. Show a progress indicator at the top: "Step X of 7".

### Step 1 — Welcome

**Title:** "Welcome to suppa-agent"

**Body:**
- A brief paragraph: "Let's build your private AI app in about 30 minutes. We'll guide you through 6 short questions, then generate everything you need."
- A small "What you'll get" list: own URL, Google login, AI chat with 1M context, admin zone, real-time monitoring.
- Note about cost: "$0/year for personal use, with a $5/month safety alarm we'll set up later."

**Action button:** `Get started →`

### Step 2 — App naming

**Title:** "What should your app be called?"

**Inputs:**
- `appName` (text input) — friendly name. Example placeholder: "Family Assistant".
- `slug` (text input, auto-derived from appName but editable) — kebab-case. Validation: `^[a-z][a-z0-9-]{2,28}[a-z0-9]$`.
- A live preview line: "Your URL will be: `https://[slug].web.app`".

**Validation:**
- appName: 2+ characters.
- slug: 4-30 characters, kebab-case, must start with a letter, must end with letter or digit.
- Show inline validation errors in red.

**Note in muted text:** "⚠️ The slug becomes your Firebase Project ID, which **cannot be changed later**. Choose carefully. If a generic name is taken globally, try variants like `mycompany-tool` or `family-2026`."

**Buttons:** `← Back` / `Next →`

### Step 3 — Google account

**Title:** "Which Google account will own this?"

**Inputs:**
- `ownerEmail` (email input) — must be a valid email. Recommend Gmail but accept any.

**Body explainer:**
- This account will:
  - Own the Firebase project
  - Be the first admin of your app
  - Receive budget alert emails
- "Keep this email handy — you'll log in with it during setup."

**Validation:** must match a basic email regex.

**Buttons:** `← Back` / `Next →`

### Step 4 — Firebase Blaze status

**Title:** "Have you upgraded Firebase to Blaze?"

**Body:**
- "suppa-agent uses Cloud Functions and external API calls (Gemini), which require the Blaze (pay-as-you-go) plan. The free tier inside Blaze is generous; for personal use you'll pay $0."

**Three radio options:**
1. ✅ "Yes, my project is already on Blaze."
2. ❌ "No, I haven't created the Firebase project yet — and I haven't upgraded."
3. 🤷 "I'm not sure / I haven't started."

**Conditional UI:**
- If option 1 → store `blazeStatus: 'ready'` and continue.
- If option 2 or 3 → show inline guidance:
  - "**Step A:** Open [Firebase Console](https://console.firebase.google.com) and create a project named exactly `[slug]` (the value from Step 2). Disable Google Analytics."
  - "**Step B:** In the new project, click 'Upgrade' (bottom-left) → choose Blaze → enter your card. (You won't be charged at typical personal usage.)"
  - "**Step C:** Set a budget alert at $5/month (we'll explain how once you tell us you're ready)."
  - Then a checkbox: "I've completed steps A and B, my project is on Blaze."
  - Only allow `Next →` once the checkbox is checked.

**Buttons:** `← Back` / `Next →` (disabled until ready)

### Step 5 — Gemini API key

**Title:** "Gemini API key"

**Body:**
- "Suppa-agent uses Google's Gemini 2.5 Pro by default. You need an API key (free)."

**Two radio options:**
1. ✅ "I already have a Gemini API key (it starts with `AIza...`)."
2. ❌ "I don't have one yet."

**If option 1:**
- Show input field: `geminiApiKey` (text). Validation: starts with `AIza`, length ≥ 30.
- Note: "We'll store this only in your browser and pass it to Claude when you finish the wizard. It will not be transmitted anywhere else."

**If option 2:**
- Show inline guidance:
  - "Open [Google AI Studio](https://aistudio.google.com/app/apikey) (use the same Google account from Step 3)."
  - "Click **Create API key** → choose your project (or any) → click **Create**."
  - "Copy the key (it starts with `AIza...`)."
- Then switches the user back to option 1 with the input visible.

**Optional model selector** (advanced):
- Toggle: "Show model options (advanced)"
- If toggled, dropdown for: `gemini-2.5-pro` (default), `gemini-2.5-flash` (faster/cheaper), `gemini-3-pro` (most capable), `gemini-3-flash` (newest fast).

**Buttons:** `← Back` / `Next →`

### Step 6 — Authorized users

**Title:** "Who else can access your app?"

**Body:**
- "Only the emails on this list will be able to log in. Add yourself first (we've pre-filled it from Step 3)."

**Inputs:**
- A list editor:
  - First row: ownerEmail (already filled, marked as "admin", not removable).
  - Add row button: "+ Add another user"
  - Each new row has: email input + role selector (`user` or `admin`) + remove button.
- Validation: each email must be valid; no duplicates.

**Buttons:** `← Back` / `Next →`

### Step 7 — Summary & generate

**Title:** "All set. Here's your configuration."

**Body — show a summary card:**

```
App name:        {appName}
Slug:            {slug}
URL:             https://{slug}.web.app
Admin URL:       https://{slug}-admin.web.app
Owner email:     {ownerEmail}
Firebase plan:   Blaze (with $5/mo alert)
Gemini model:    {geminiModel}
Gemini API key:  AIza...{last4} ✓
Authorized:      {N} users ({adminCount} admin, {userCount} user)
```

**Below the summary, three actions:**

1. **Primary button:** `📋 Copy configuration to clipboard`
   - Copies a JSON object containing all the wizard answers.
   - JSON shape:
     ```json
     {
       "version": "v0.001",
       "appName": "...",
       "slug": "...",
       "ownerEmail": "...",
       "geminiApiKey": "AIza...",
       "geminiModel": "gemini-2.5-pro",
       "authorizedUsers": [
         { "email": "...", "role": "admin" },
         { "email": "...", "role": "user" }
       ],
       "firestoreRegion": "eur3",
       "functionsRegion": "europe-west1"
     }
     ```
   - After copy, show a green confirmation message.

2. **Secondary button:** `💬 Send config to Claude`
   - Generates a long pre-formatted message and copies it to clipboard.
   - The message says: *"Here's my suppa-agent configuration: [JSON]. Now generate all the project files I need: package.json files, vite configs, firebase.json, .firebaserc, firestore.rules, the React frontend (web/ + admin/), the Cloud Function (functions/index.js with the Gemini key embedded), and any setup commands. Walk me through them one by one starting with project structure."*

3. **Tertiary button:** `🔄 Start over`
   - Clears `window.storage` for the wizard and returns to Step 1.

---

## Behavior details

- **Persistence**: every input change saves to `window.storage` immediately so the user can close the chat and return. On mount, hydrate from storage.
- **Step navigation**: previous-step button always enabled (except Step 1). Next-step button disabled when current step is invalid.
- **Validation**: show errors inline in red, below the relevant input.
- **Visual style**: dark theme. Headers in `text-2xl font-bold`. Body in `text-base`. Inputs with `bg-zinc-800 text-white border-zinc-700`. Primary buttons in `bg-blue-600 hover:bg-blue-700`. Secondary in `bg-zinc-700 hover:bg-zinc-600`.
- **Step indicator**: at the top, show e.g. "Step 3 of 7" and a horizontal progress bar.
- **No localStorage** anywhere. Only `window.storage`.

---

## After the wizard finishes

When the user clicks "Send config to Claude" or pastes the JSON in the chat, you (Claude) take over and:

1. Confirm you've received the configuration.
2. Generate the project structure: list of files you'll create.
3. Generate each file as a separate artifact (one artifact per file family — e.g., `web/src/`, `admin/src/`, `functions/`, `firebase.json` + `.firebaserc`, `firestore.rules`).
4. Provide a final checklist of manual steps:
   - Create the Firebase project (if not done).
   - Run `firebase use --add` and select the project.
   - Add the first admin doc manually in Firestore Console.
   - Run `firebase deploy`.
5. Stay available for debugging via the user's Code Tester logs.

---

## Edge cases to handle in the artifact

- User refreshes the chat page → wizard restores from `window.storage`.
- User clicks "Start over" → confirm dialog, then clear and reset.
- User enters duplicate emails in Step 6 → inline error.
- User tries to remove their own email from Step 6 → block with message.
- User tries to demote themselves to `user` in Step 6 → block with message.
- User enters an invalid Gemini key format → inline error.
- User enters a project slug that contains uppercase or spaces → auto-correct preview, show transformation.

---

## Reminder for Claude

When asked to generate this wizard:

- Output **one** React artifact, default export, no required props.
- Use Tailwind utilities only.
- Use `window.storage` only (never localStorage).
- The artifact should be **immediately usable** — no extra setup steps.
- After generating it, briefly tell the user: "Here's your suppa-agent wizard. Click **Get started**, fill in the 6 steps, and at the end I'll generate all your project files."
