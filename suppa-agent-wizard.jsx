import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "suppa-agent:wizard:state";

const DEFAULT_STATE = {
  step: 1,
  appName: "",
  slug: "",
  slugManuallyEdited: false,
  ownerEmail: "",
  blazeStatus: "unknown",
  blazeCheckbox: false,
  geminiHasKey: null,
  geminiApiKey: "",
  geminiModel: "gemini-2.5-pro",
  showModelOptions: false,
  authorizedUsers: [],
};

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

const SLUG_RE = /^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadState() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

async function saveState(state) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("storage save error", e);
  }
}

async function clearState() {
  try {
    await window.storage.delete(STORAGE_KEY);
  } catch (e) {
    console.error("storage clear error", e);
  }
}

// ─── Progress Bar ────────────────────────────────────
function ProgressBar({ step }) {
  const pct = ((step - 1) / 6) * 100;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400 tracking-wide font-mono">
          STEP {step} OF 7
        </span>
        <span className="text-xs text-zinc-500">{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Reusable components ─────────────────────────────
function Input({ label, value, onChange, placeholder, error, type = "text", disabled = false, mono = false }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm text-zinc-300 mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-lg bg-zinc-800 text-white border ${
          error ? "border-red-500" : "border-zinc-700"
        } focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 ${
          mono ? "font-mono text-sm" : ""
        }`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const base = "px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-white",
    danger: "bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-800/50",
    ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={base + variants[variant] + " " + className}>
      {children}
    </button>
  );
}

function Radio({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
            value === o.value
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
          }`}
        >
          <input
            type="radio"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-0.5 accent-blue-500"
          />
          <span className="text-sm text-zinc-200">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────
function Step1({ onNext }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to suppa-agent</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <p className="text-zinc-300 mb-6 leading-relaxed">
        Let's build your private AI app in about 30 minutes. We'll guide you through 6 short questions, then generate everything you need.
      </p>
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">What you'll get</h3>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-center gap-2"><span className="text-blue-400">→</span> Your own URL</li>
          <li className="flex items-center gap-2"><span className="text-blue-400">→</span> Google login</li>
          <li className="flex items-center gap-2"><span className="text-blue-400">→</span> AI chat with 1M context (Gemini)</li>
          <li className="flex items-center gap-2"><span className="text-blue-400">→</span> Admin zone</li>
          <li className="flex items-center gap-2"><span className="text-blue-400">→</span> Real-time monitoring (Code Tester)</li>
        </ul>
      </div>
      <p className="text-xs text-zinc-500 mb-8">
        $0/year for personal use, with a $5/month safety alarm we'll set up later.
      </p>
      <Btn onClick={onNext}>Get started →</Btn>
    </div>
  );
}

// ─── Step 2: App Naming ──────────────────────────────
function Step2({ state, update, onNext, onBack }) {
  const nameErr = state.appName.length > 0 && state.appName.length < 2 ? "At least 2 characters" : "";
  const slugVal = state.slug;
  const slugErr = slugVal.length > 0 && !SLUG_RE.test(slugVal)
    ? "4-30 chars, kebab-case, starts with letter, ends with letter or digit"
    : "";
  const valid = state.appName.length >= 2 && SLUG_RE.test(slugVal);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">What should your app be called?</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <Input
        label="App name"
        value={state.appName}
        placeholder="Family Assistant"
        error={nameErr}
        onChange={(e) => {
          const v = e.target.value;
          const upd = { appName: v };
          if (!state.slugManuallyEdited) upd.slug = toSlug(v);
          update(upd);
        }}
      />
      <Input
        label="Slug (Firebase Project ID)"
        value={state.slug}
        placeholder="family-assistant"
        error={slugErr}
        mono
        onChange={(e) => {
          update({ slug: e.target.value.toLowerCase(), slugManuallyEdited: true });
        }}
      />
      {slugVal && (
        <p className="text-sm text-zinc-400 mb-2 font-mono">
          Your URL will be: <span className="text-blue-400">https://{slugVal}.web.app</span>
        </p>
      )}
      <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
        ⚠️ The slug becomes your Firebase Project ID, which <strong className="text-zinc-400">cannot be changed later</strong>. Choose carefully. If a generic name is taken globally, try variants like <code className="text-zinc-400">mycompany-tool</code> or <code className="text-zinc-400">family-2026</code>.
      </p>
      <div className="flex gap-3 mt-8">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!valid}>Next →</Btn>
      </div>
    </div>
  );
}

// ─── Step 3: Google Account ──────────────────────────
function Step3({ state, update, onNext, onBack }) {
  const emailErr = state.ownerEmail.length > 0 && !EMAIL_RE.test(state.ownerEmail) ? "Enter a valid email" : "";
  const valid = EMAIL_RE.test(state.ownerEmail);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Which Google account will own this?</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <Input
        label="Owner email"
        type="email"
        value={state.ownerEmail}
        placeholder="you@gmail.com"
        error={emailErr}
        onChange={(e) => update({ ownerEmail: e.target.value })}
      />
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-5 mt-4">
        <p className="text-sm text-zinc-300 mb-3">This account will:</p>
        <ul className="space-y-1.5 text-sm text-zinc-400">
          <li>• Own the Firebase project</li>
          <li>• Be the first admin of your app</li>
          <li>• Receive budget alert emails</li>
        </ul>
      </div>
      <p className="text-xs text-zinc-500 mt-4">Keep this email handy — you'll log in with it during setup.</p>
      <div className="flex gap-3 mt-8">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!valid}>Next →</Btn>
      </div>
    </div>
  );
}

// ─── Step 4: Firebase Blaze ──────────────────────────
function Step4({ state, update, onNext, onBack }) {
  const ready = state.blazeStatus === "ready" || state.blazeCheckbox;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Have you upgraded Firebase to Blaze?</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
        suppa-agent uses Cloud Functions and external API calls (Gemini), which require the Blaze (pay-as-you-go) plan. The free tier inside Blaze is generous; for personal use you'll pay $0.
      </p>
      <Radio
        value={state.blazeStatus}
        onChange={(v) => update({ blazeStatus: v, blazeCheckbox: false })}
        options={[
          { value: "ready", label: '✅ Yes, my project is already on Blaze.' },
          { value: "not-yet", label: "❌ No, I haven't created the Firebase project yet — and I haven't upgraded." },
          { value: "unknown", label: "🤷 I'm not sure / I haven't started." },
        ]}
      />
      {(state.blazeStatus === "not-yet" || state.blazeStatus === "unknown") && (
        <div className="mt-5 bg-zinc-800/80 border border-zinc-700 rounded-xl p-5 space-y-3 text-sm text-zinc-300">
          <p><strong className="text-zinc-200">Step A:</strong> Open{" "}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a>{" "}
            and create a project named exactly <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-blue-300">{state.slug || "[your-slug]"}</code>. Disable Google Analytics.</p>
          <p><strong className="text-zinc-200">Step B:</strong> In the new project, click "Upgrade" (bottom-left) → choose Blaze → enter your card. (You won't be charged at typical personal usage.)</p>
          <p><strong className="text-zinc-200">Step C:</strong> Set a budget alert at $5/month (we'll explain how once you tell us you're ready).</p>
          <label className="flex items-center gap-3 mt-4 p-3 rounded-lg border border-zinc-600 bg-zinc-900/50 cursor-pointer">
            <input
              type="checkbox"
              checked={state.blazeCheckbox}
              onChange={(e) => update({ blazeCheckbox: e.target.checked })}
              className="accent-blue-500 w-4 h-4"
            />
            <span>I've completed steps A and B, my project is on Blaze.</span>
          </label>
        </div>
      )}
      <div className="flex gap-3 mt-8">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!ready}>Next →</Btn>
      </div>
    </div>
  );
}

// ─── Step 5: Gemini API Key ──────────────────────────
function Step5({ state, update, onNext, onBack }) {
  const keyErr =
    state.geminiHasKey === "yes" && state.geminiApiKey.length > 0 && (!state.geminiApiKey.startsWith("AIza") || state.geminiApiKey.length < 30)
      ? "Must start with AIza and be at least 30 characters"
      : "";
  const valid = state.geminiHasKey === "yes" && state.geminiApiKey.startsWith("AIza") && state.geminiApiKey.length >= 30;

  const models = [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (default — big context, great quality)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (faster, cheaper)" },
    { value: "gemini-3-pro", label: "Gemini 3 Pro (most capable)" },
    { value: "gemini-3-flash", label: "Gemini 3 Flash (newest fast)" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Gemini API key</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <p className="text-sm text-zinc-400 mb-5">Suppa-agent uses Google's Gemini 2.5 Pro by default. You need an API key (free).</p>
      <Radio
        value={state.geminiHasKey}
        onChange={(v) => update({ geminiHasKey: v })}
        options={[
          { value: "yes", label: '✅ I already have a Gemini API key (it starts with AIza...).' },
          { value: "no", label: "❌ I don't have one yet." },
        ]}
      />
      {state.geminiHasKey === "no" && (
        <div className="mt-4 bg-zinc-800/80 border border-zinc-700 rounded-xl p-5 text-sm text-zinc-300 space-y-2">
          <p>1. Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google AI Studio</a> (use the same Google account from Step 3).</p>
          <p>2. Click <strong>Create API key</strong> → choose your project (or any) → click <strong>Create</strong>.</p>
          <p>3. Copy the key (it starts with <code className="bg-zinc-700 px-1 rounded">AIza...</code>).</p>
          <Btn variant="secondary" className="mt-3" onClick={() => update({ geminiHasKey: "yes" })}>I have it now →</Btn>
        </div>
      )}
      {state.geminiHasKey === "yes" && (
        <div className="mt-4">
          <Input
            label="API Key"
            value={state.geminiApiKey}
            placeholder="AIza..."
            error={keyErr}
            mono
            onChange={(e) => update({ geminiApiKey: e.target.value })}
          />
          <p className="text-xs text-zinc-500 -mt-2 mb-4">Stored only in your browser. Not transmitted anywhere else.</p>
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={() => update({ showModelOptions: !state.showModelOptions })}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {state.showModelOptions ? "▾" : "▸"} Show model options (advanced)
        </button>
        {state.showModelOptions && (
          <select
            value={state.geminiModel}
            onChange={(e) => update({ geminiModel: e.target.value })}
            className="mt-2 w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-3 mt-8">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!valid}>Next →</Btn>
      </div>
    </div>
  );
}

// ─── Step 6: Authorized Users ────────────────────────
function Step6({ state, update, onNext, onBack }) {
  const users = state.authorizedUsers;
  const ownerEmail = state.ownerEmail.toLowerCase();

  useEffect(() => {
    if (users.length === 0 && ownerEmail) {
      update({ authorizedUsers: [{ email: ownerEmail, role: "admin" }] });
    } else if (users.length > 0 && users[0].email !== ownerEmail && ownerEmail) {
      const updated = [...users];
      updated[0] = { email: ownerEmail, role: "admin" };
      update({ authorizedUsers: updated });
    }
  }, [ownerEmail]);

  const addUser = () => {
    update({ authorizedUsers: [...users, { email: "", role: "user" }] });
  };

  const updateUser = (i, field, val) => {
    const updated = [...users];
    if (i === 0 && field === "role" && val !== "admin") {
      return; // block demoting self
    }
    updated[i] = { ...updated[i], [field]: val };
    update({ authorizedUsers: updated });
  };

  const removeUser = (i) => {
    if (i === 0) return; // can't remove owner
    update({ authorizedUsers: users.filter((_, idx) => idx !== i) });
  };

  // validation
  const emails = users.map((u) => u.email.toLowerCase().trim());
  const dupes = new Set();
  const seen = new Set();
  emails.forEach((e) => {
    if (seen.has(e) && e) dupes.add(e);
    seen.add(e);
  });
  const allValid = users.every((u, i) => {
    if (i === 0) return true; // owner pre-filled
    return EMAIL_RE.test(u.email) && !dupes.has(u.email.toLowerCase().trim());
  });
  const valid = users.length >= 1 && allValid;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Who else can access your app?</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <p className="text-sm text-zinc-400 mb-5">Only the emails on this list will be able to log in. Your owner email is pre-filled as admin.</p>
      <div className="space-y-2">
        {users.map((u, i) => {
          const isOwner = i === 0;
          const isDupe = dupes.has(u.email.toLowerCase().trim()) && u.email;
          const invalidEmail = !isOwner && u.email.length > 0 && !EMAIL_RE.test(u.email);
          return (
            <div key={i} className="flex items-center gap-2">
              <input
                value={u.email}
                onChange={(e) => updateUser(i, "email", e.target.value)}
                disabled={isOwner}
                placeholder="email@gmail.com"
                className={`flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-white border text-sm ${
                  isDupe || invalidEmail ? "border-red-500" : "border-zinc-700"
                } focus:outline-none focus:border-blue-500 disabled:opacity-60 font-mono`}
              />
              <select
                value={u.role}
                onChange={(e) => updateUser(i, "role", e.target.value)}
                disabled={isOwner}
                className="px-2 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-sm disabled:opacity-60"
              >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
              {isOwner ? (
                <span className="text-xs text-zinc-500 w-8 text-center">🔒</span>
              ) : (
                <button onClick={() => removeUser(i)} className="text-red-400 hover:text-red-300 w-8 text-center text-lg cursor-pointer">×</button>
              )}
            </div>
          );
        })}
        {users.some((u, i) => i > 0 && dupes.has(u.email.toLowerCase().trim())) && (
          <p className="text-red-400 text-xs">Duplicate emails detected.</p>
        )}
      </div>
      <button onClick={addUser} className="mt-3 text-sm text-blue-400 hover:text-blue-300 cursor-pointer">+ Add another user</button>
      <div className="flex gap-3 mt-8">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
        <Btn onClick={onNext} disabled={!valid}>Next →</Btn>
      </div>
    </div>
  );
}

// ─── Step 7: Summary ─────────────────────────────────
function Step7({ state, onBack, onReset }) {
  const [feedback, setFeedback] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const admins = state.authorizedUsers.filter((u) => u.role === "admin").length;
  const usersCount = state.authorizedUsers.length - admins;
  const keyLast4 = state.geminiApiKey.slice(-4);

  const configJson = {
    version: "v0.001",
    appName: state.appName,
    slug: state.slug,
    ownerEmail: state.ownerEmail,
    geminiApiKey: state.geminiApiKey,
    geminiModel: state.geminiModel,
    authorizedUsers: state.authorizedUsers.map((u) => ({ email: u.email.toLowerCase().trim(), role: u.role })),
    firestoreRegion: "eur3",
    functionsRegion: "europe-west1",
  };

  const promptMsg = `Here's my suppa-agent configuration:\n\n${JSON.stringify(configJson, null, 2)}\n\nNow generate all the project files I need: package.json files, vite configs, firebase.json, .firebaserc, firestore.rules, the React frontend (web/ + admin/), the Cloud Function (functions/index.js with the Gemini key embedded), and any setup commands. Walk me through them one by one starting with project structure.`;

  // Fallback copy that works in sandboxed iframes
  const fallbackCopy = (text) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  };

  const copyJson = () => {
    const text = JSON.stringify(configJson, null, 2);
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
        ok = true;
      }
    } catch {}
    if (!ok) ok = fallbackCopy(text);
    setFeedback(ok ? "json" : "json-fallback");
    setTimeout(() => setFeedback(null), 3000);
  };

  const sendToClaude = () => {
    // Use the global sendPrompt function available in Claude artifacts
    if (typeof sendPrompt === "function") {
      sendPrompt(promptMsg);
      setFeedback("sent");
      setTimeout(() => setFeedback(null), 3000);
    } else {
      // Fallback: copy to clipboard
      fallbackCopy(promptMsg);
      setFeedback("prompt-copied");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onReset();
  };

  const rows = [
    ["App name", state.appName],
    ["Slug", state.slug],
    ["URL", `https://${state.slug}.web.app`],
    ["Admin URL", `https://${state.slug}-admin.web.app`],
    ["Owner email", state.ownerEmail],
    ["Firebase plan", "Blaze (with $5/mo alert)"],
    ["Gemini model", state.geminiModel],
    ["Gemini API key", `AIza...${keyLast4} ✓`],
    ["Authorized", `${state.authorizedUsers.length} users (${admins} admin, ${usersCount} user)`],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">All set. Here's your configuration.</h1>
      <div className="w-12 h-1 bg-blue-500 rounded mb-6" />
      <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden mb-6">
        {rows.map(([label, val], i) => (
          <div key={label} className={`flex justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? "border-b border-zinc-700/50" : ""}`}>
            <span className="text-zinc-400">{label}</span>
            <span className="text-white font-mono text-right break-all ml-4">{val}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Btn onClick={copyJson} className="w-full">
          {feedback === "json" ? "✅ Copied!" : "📋 Copy configuration to clipboard"}
        </Btn>
        <Btn variant="secondary" onClick={sendToClaude} className="w-full">
          {feedback === "sent" ? "✅ Sent!" : feedback === "prompt-copied" ? "✅ Copied! Paste it in the chat" : "💬 Send config to Claude"}
        </Btn>
        {!confirmReset ? (
          <Btn variant="danger" onClick={handleReset} className="w-full">
            🔄 Start over
          </Btn>
        ) : (
          <div className="flex gap-2">
            <Btn variant="danger" onClick={handleReset} className="flex-1">
              Yes, clear everything
            </Btn>
            <Btn variant="ghost" onClick={() => setConfirmReset(false)} className="flex-1">
              Cancel
            </Btn>
          </div>
        )}
      </div>

      {feedback && (
        <p className="text-green-400 text-sm text-center mt-3">
          {feedback === "json" && "Configuration JSON copied to clipboard!"}
          {feedback === "json-fallback" && "Could not copy — try selecting the text manually."}
          {feedback === "sent" && "Configuration sent to Claude!"}
          {feedback === "prompt-copied" && "Prompt copied — paste it into the chat!"}
        </p>
      )}

      <div className="flex gap-3 mt-6">
        <Btn variant="ghost" onClick={onBack}>← Back</Btn>
      </div>
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────
export default function SuppaAgentWizard() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimeout = useRef(null);

  // Hydrate from storage on mount
  useEffect(() => {
    loadState().then((saved) => {
      if (saved) setState((prev) => ({ ...prev, ...saved }));
      setHydrated(true);
    });
  }, []);

  // Debounced save on every state change
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(saveTimeout.current);
  }, [state, hydrated]);

  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = (step) => update({ step });

  const handleReset = async () => {
    await clearState();
    setState({ ...DEFAULT_STATE });
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Loading wizard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-8">
        <ProgressBar step={state.step} />
        {state.step === 1 && <Step1 onNext={() => goTo(2)} />}
        {state.step === 2 && <Step2 state={state} update={update} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
        {state.step === 3 && <Step3 state={state} update={update} onNext={() => {
          // sync owner as first authorized user
          const au = state.authorizedUsers.length > 0 ? [...state.authorizedUsers] : [];
          if (au.length === 0 || au[0].email !== state.ownerEmail.toLowerCase()) {
            au[0] = { email: state.ownerEmail.toLowerCase(), role: "admin" };
          }
          update({ step: 4, authorizedUsers: au });
        }} onBack={() => goTo(2)} />}
        {state.step === 4 && <Step4 state={state} update={update} onNext={() => goTo(5)} onBack={() => goTo(3)} />}
        {state.step === 5 && <Step5 state={state} update={update} onNext={() => goTo(6)} onBack={() => goTo(4)} />}
        {state.step === 6 && <Step6 state={state} update={update} onNext={() => goTo(7)} onBack={() => goTo(5)} />}
        {state.step === 7 && <Step7 state={state} onBack={() => goTo(6)} onReset={handleReset} />}
      </div>
    </div>
  );
}
