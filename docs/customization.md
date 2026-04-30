# Customization

This document shows how to turn the generic `suppa-agent` chat into something specialized. We'll cover the four main customization points, in order of complexity.

## 1. System prompt (5 minutes)

This is the single biggest lever. The system prompt tells Gemini who it is and how to behave.

### Where to change it

`starter/functions/index.js`, inside the model initialization:

```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
  generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
  systemInstruction: 'You are a helpful assistant.',  // ← here
});
```

### Examples by use case

#### Cooking assistant
```
You are a Mediterranean cooking assistant. You always respond in 
the user's language. When the user asks for a recipe, you provide:
1. Ingredients with quantities (metric units)
2. Step-by-step instructions
3. Estimated time
4. Approximate cost per portion

You only suggest recipes that can be made with home equipment 
(no industrial tools). When the user uploads a photo of ingredients, 
you propose 2-3 recipes that use most of them.
```

#### Caregiver companion (NOT diagnosis)
```
You are an information assistant for caregivers of elderly people. 
You provide general information about care routines, medication 
reminders, mobility tips, and signs to watch for.

You DO NOT diagnose. You DO NOT prescribe. You DO NOT replace 
medical advice. When the user describes symptoms, you respond with:
1. General context about what those symptoms commonly indicate
2. A clear recommendation to consult a doctor
3. Practical tips for the caregiver in the meantime

You always sign off with "Consult your healthcare provider for 
personalized advice."
```

#### Study buddy (with vocabulary)
```
You are a study buddy for [SUBJECT]. You help the user understand 
concepts, prepare for exams, and review material.

Your style:
- Use simple language first, then technical terms in parentheses
- Always provide a real-world example for abstract concepts
- When the user makes a mistake, gently correct it and explain why
- After each explanation, ask one follow-up question to check understanding

You speak in the user's language unless they ask otherwise.
```

#### Customer-support helper (internal tool)
```
You are an internal helper for support agents at [COMPANY]. You have 
access to our knowledge base in the conversation context. When a 
support agent shares a customer ticket, you:
1. Identify the issue type
2. Suggest a response draft
3. Flag any escalation criteria

You never invent product features that aren't in your context. If 
unsure, say "Check with engineering" or "I don't have that information."
```

## 2. UI tone and branding (15 minutes)

The visual style of the app lives in the JSX components. Most of the styling is inline `style={...}` for simplicity.

### Color palette

Search for these hex codes across `starter/web/src/`:
- `#0066cc` — primary action (login, send button) → change to your brand color
- `#0a0a0a`, `#111`, `#1a1a1a` — backgrounds → change for light theme
- `#0f0` — Code Tester accent → change if green doesn't fit your brand
- `#fa0`, `#f33` — warning and error colors → match your design system

### Logo

The app currently shows the `APP_NAME` constant as text. To use a logo image:

1. Add `logo.svg` (or `.png`) to `starter/web/public/`.
2. In `App.jsx`, replace `<h1>{APP_NAME}</h1>` with:
   ```jsx
   <img src="/logo.svg" alt={APP_NAME} style={{ height: 48 }} />
   ```

### Empty state and copy

Look for hardcoded English strings and replace with your brand voice:
- `"Start the conversation"` (in `Chat.jsx`)
- `"Loading..."`, `"Login with Google"`, `"Type a message..."`, `"Send"`
- `"Access not authorized"`, `"is not on the authorized users list"`

For multilingual support, see the `i18n` plan in `ROADMAP.md` (v0.200).

## 3. New collections and features (1-3 hours)

Adding a feature usually means:
1. A new Firestore collection with security rules.
2. A new component in `web/src/components/`.
3. Possibly a new Cloud Function.

### Example: User preferences

You want each user to be able to save preferences (theme, default model, language).

**Step 1 — New collection.** Add to `firestore.rules`:

```
match /preferences/{uid} {
  allow read, write: if isOwner(uid) && isAuthorized();
}
```

**Step 2 — New hook.** Create `web/src/hooks/usePreferences.js`:

```javascript
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export function usePreferences(uid) {
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'preferences', uid), (snap) => {
      setPrefs(snap.data() || {});
    });
  }, [uid]);

  const update = async (patch) => {
    await setDoc(doc(db, 'preferences', uid), patch, { merge: true });
  };

  return [prefs, update];
}
```

**Step 3 — New component.** Create `web/src/components/PreferencesModal.jsx`:

```jsx
import { usePreferences } from '../hooks/usePreferences';

export function PreferencesModal({ user, onClose }) {
  const [prefs, updatePrefs] = usePreferences(user.uid);
  // ... render form, save with updatePrefs
}
```

**Step 4 — Wire into App.** In `App.jsx`:

```jsx
import { PreferencesModal } from './components/PreferencesModal';

// Inside the component:
const [showPrefs, setShowPrefs] = useState(false);

// In the sidebar:
<button onClick={() => setShowPrefs(true)}>Preferences</button>

// Below main:
{showPrefs && <PreferencesModal user={user} onClose={() => setShowPrefs(false)} />}
```

**Reminder**: each new feature gets its own file. Don't dump it all into `App.jsx`.

## 4. Specialized backend logic (2-4 hours)

When your variant needs a backend operation that's more than just calling Gemini, add a new Cloud Function.

### Example: Knowledge base injection (basic RAG)

You want certain documents to always be injected into Gemini's context.

**Step 1 — New collection.** Add `knowledge/` to security rules:

```
match /knowledge/{docId} {
  allow read: if isAuthorized();
  allow write: if isAdmin();
}
```

**Step 2 — Modified Cloud Function.** In `starter/functions/index.js`, before calling Gemini:

```javascript
// Load global knowledge documents
const knowledgeSnap = await db.collection('knowledge')
  .where('scope', '==', 'global')
  .get();

const knowledgeContext = knowledgeSnap.docs
  .map(d => `## ${d.data().title}\n${d.data().content}`)
  .join('\n\n');

// Prepend to history
if (knowledgeContext) {
  history.unshift({
    role: 'user',
    parts: [{ text: `Context to use throughout this conversation:\n\n${knowledgeContext}` }],
  });
  history.unshift({
    role: 'model',
    parts: [{ text: 'Got it. I will use that context.' }],
  });
}
```

**Step 3 — Admin UI to manage knowledge.** Add a section to `AdminPanel.jsx` (or create `KnowledgeManager.jsx`) for adding/editing knowledge documents.

This is the foundation for what `v0.030` (basic RAG) will add to the core.

## 5. Specialized hosting and domains

Once your app is working, you might want a custom domain instead of `.web.app`.

### Custom domain on Firebase Hosting

1. Firebase Console → Hosting → your site → **Add custom domain**.
2. Enter your domain (e.g., `myapp.example.com`).
3. Firebase gives you DNS records to add at your registrar.
4. Wait for DNS propagation (usually < 24 hours).
5. Firebase auto-provisions SSL.

Cost: still $0. Custom domains don't change Firebase pricing.

## 6. Adding it to `examples/` for the community

If you build something cool, please share it back. See `CONTRIBUTING.md` for the process. The bar is:

1. **Working code** — at least the `systemInstruction` and any UI changes.
2. **A short README** — what it does, who it's for, what to expect.
3. **A clear diff vs core** — don't fork the entire codebase. Just show what changed.

Examples we'd love:
- Cooking, study, parents, medical, legal, customer-support, games, learning languages, creative writing, mental health support (NOT therapy), home automation companion, gardening assistant, and many more.

---

## Quick reference: where to change what

| Goal | File(s) to touch |
|------|-----------------|
| Change behavior of the AI | `starter/functions/index.js` (`systemInstruction`) |
| Change visual brand | `starter/web/src/App.jsx`, `Chat.jsx`, `CodeTester.jsx` |
| Change app name | `starter/web/src/constants.js` and `index.html` |
| Add a feature | New file in `starter/web/src/components/` |
| Change AI model | `starter/functions/index.js` (single line) |
| Add data persistence | `firestore.rules` + new collection + new hook |
| Custom domain | Firebase Console → Hosting (no code change) |
| Restrict who can sign up | `firestore.rules` for `authorizedUsers/` |
