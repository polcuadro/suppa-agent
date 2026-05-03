import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "suppa-agent:wizard:state";

const DEFAULT_STATE = {
  step: 1,
  appName: "",
  slug: "",
  slugManuallyEdited: false,
  ownerEmail: "",
  geminiHasKey: null,
  geminiApiKey: "",
  geminiModel: "gemini-2.5-pro",
  showModelOptions: false,
  authorizedUsers: [],
  // Step 7
  fbProjectCreated: false,
  fbBlazeUpgraded: false,
  fbBudgetAlert: false,
  // Step 8
  svcAuth: false,
  svcFirestore: false,
  svcHostingWeb: false,
  svcHostingAdmin: false,
  svcFunctions: false,
  // Step 9
  fbApiKey: "",
  fbAuthDomain: "",
  fbProjectId: "",
  fbStorageBucket: "",
  fbMessagingSenderId: "",
  fbAppId: "",
  // Step 10
  cliInstalled: false,
  cliLoggedIn: false,
  cliProjectLinked: false,
  cliSecretSaved: false,
};

function toSlug(n) {
  return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

const SLUG_RE = /^[a-z][a-z0-9-]{2,28}[a-z0-9]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadState() { try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function saveState(s) { try { await window.storage.set(STORAGE_KEY, JSON.stringify(s)); } catch {} }
async function clearState() { try { await window.storage.delete(STORAGE_KEY); } catch {} }

function tryCopy(text) {
  try { if (navigator?.clipboard?.writeText) { navigator.clipboard.writeText(text).catch(() => {}); return true; } } catch {}
  try { const t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;opacity:0"; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); document.body.removeChild(t); if (ok) return true; } catch {}
  return false;
}

// ─── UI Components ───────────────────────────────────
function ProgressBar({ step }) {
  const pct = ((step - 1) / 10) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-400 tracking-wide font-mono">STEP {step} OF 11</span>
        <span className="text-xs text-zinc-500">{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Title({ children }) { return <><h1 className="text-2xl font-bold text-white mb-1">{children}</h1><div className="w-12 h-1 bg-blue-500 rounded mb-5" /></>; }

function Input({ label, value, onChange, placeholder, error, type = "text", disabled = false, mono = false }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs text-zinc-400 mb-1">{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg bg-zinc-800 text-white border ${error ? "border-red-500" : "border-zinc-700"} focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 ${mono ? "font-mono text-sm" : "text-sm"}`} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const v = { primary: "bg-blue-600 hover:bg-blue-500 text-white", secondary: "bg-zinc-700 hover:bg-zinc-600 text-white", danger: "bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-800/50", ghost: "bg-transparent hover:bg-zinc-800 text-zinc-400", success: "bg-emerald-700 hover:bg-emerald-600 text-white" };
  return <button onClick={onClick} disabled={disabled} className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${v[variant] || v.primary} ${className}`}>{children}</button>;
}

function Radio({ options, value, onChange }) {
  return <div className="space-y-2">{options.map(o => (
    <label key={o.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${value === o.value ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}>
      <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} className="mt-0.5 accent-blue-500" />
      <span className="text-sm text-zinc-200">{o.label}</span>
    </label>
  ))}</div>;
}

function Toast({ message, type = "success" }) {
  if (!message) return null;
  const c = { success: "bg-emerald-900/80 border-emerald-700 text-emerald-200", error: "bg-red-900/80 border-red-700 text-red-200", info: "bg-blue-900/80 border-blue-700 text-blue-200" };
  return <div className={`mt-3 px-4 py-2 rounded-lg border text-sm text-center ${c[type] || c.info}`}>{message}</div>;
}

function ExtLink({ href, children }) {
  return <span className="inline"><a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline">{children}</a><span className="text-zinc-600 text-xs ml-0.5">↗</span></span>;
}

function Check({ checked, onChange, children }) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${checked ? "border-emerald-600 bg-emerald-900/20" : "border-zinc-700 bg-zinc-800/40"}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 accent-emerald-500 w-4 h-4 flex-shrink-0" />
      <span className="text-sm text-zinc-300 leading-relaxed">{children}</span>
    </label>
  );
}

function Nav({ onBack, onNext, nextDisabled, nextLabel = "Next →", showBack = true }) {
  return <div className="flex gap-3 mt-6">{showBack && <Btn variant="ghost" onClick={onBack}>← Back</Btn>}{onNext && <Btn onClick={onNext} disabled={nextDisabled}>{nextLabel}</Btn>}</div>;
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm border-b border-zinc-700/50 last:border-b-0">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-mono text-right break-all ml-4">{value}</span>
    </div>
  );
}

// ─── Step 1: Welcome ─────────────────────────────────
function S1({ goTo }) {
  return <div>
    <Title>Welcome to suppa-agent</Title>
    <p className="text-zinc-300 mb-5 leading-relaxed text-sm">Let's build your private AI app in about 30 minutes. We'll guide you through everything — from naming to deploying.</p>
    <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mb-5">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">What you'll get</h3>
      <ul className="space-y-1.5 text-sm text-zinc-400">
        {["Your own URL (https://your-app.web.app)", "Google login — only invited users", "AI chat with 1M token context (Gemini)", "Admin zone for user management", "Real-time Code Tester monitoring"].map(t => <li key={t} className="flex items-center gap-2"><span className="text-blue-400">→</span>{t}</li>)}
      </ul>
    </div>
    <p className="text-xs text-zinc-500 mb-6">$0/year for personal use. We'll set a $5/month safety alarm.</p>
    <Btn onClick={() => goTo(2)}>Get started →</Btn>
  </div>;
}

// ─── Step 2: App naming ──────────────────────────────
function S2({ state: s, update: u, goTo }) {
  const ne = s.appName.length > 0 && s.appName.length < 2 ? "At least 2 characters" : "";
  const se = s.slug.length > 0 && !SLUG_RE.test(s.slug) ? "4-30 chars, kebab-case, letter start, letter/digit end" : "";
  const ok = s.appName.length >= 2 && SLUG_RE.test(s.slug);
  return <div>
    <Title>What should your app be called?</Title>
    <Input label="App name" value={s.appName} placeholder="Family Assistant" error={ne}
      onChange={e => { const v = e.target.value; u({ appName: v, ...(!s.slugManuallyEdited ? { slug: toSlug(v) } : {}) }); }} />
    <Input label="Slug (Firebase Project ID)" value={s.slug} placeholder="family-assistant" error={se} mono
      onChange={e => u({ slug: e.target.value.toLowerCase(), slugManuallyEdited: true })} />
    {s.slug && <p className="text-sm text-zinc-400 mb-2 font-mono">URL: <span className="text-blue-400">https://{s.slug}.web.app</span></p>}
    <p className="text-xs text-zinc-500 mt-3">⚠️ The slug = Firebase Project ID. <strong className="text-zinc-400">Cannot change later.</strong> If taken, try <code className="text-zinc-400">myname-app</code> or <code className="text-zinc-400">family-2026</code>.</p>
    <Nav onBack={() => goTo(1)} onNext={() => goTo(3)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 3: Google account ──────────────────────────
function S3({ state: s, update: u, goTo }) {
  const err = s.ownerEmail.length > 0 && !EMAIL_RE.test(s.ownerEmail) ? "Enter a valid email" : "";
  const ok = EMAIL_RE.test(s.ownerEmail);
  return <div>
    <Title>Which Google account will own this?</Title>
    <Input label="Owner email" type="email" value={s.ownerEmail} placeholder="you@gmail.com" error={err}
      onChange={e => u({ ownerEmail: e.target.value })} />
    <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 mt-3 text-sm text-zinc-400 space-y-1">
      <p className="text-zinc-300 mb-1">This account will:</p>
      <p>• Own the Firebase project</p><p>• Be the first admin</p><p>• Receive budget alert emails</p>
    </div>
    <Nav onBack={() => goTo(2)} onNext={() => {
      const au = s.authorizedUsers.length > 0 ? [...s.authorizedUsers] : [];
      if (au.length === 0 || au[0].email !== s.ownerEmail.toLowerCase()) au[0] = { email: s.ownerEmail.toLowerCase(), role: "admin" };
      u({ step: 4, authorizedUsers: au });
    }} nextDisabled={!ok} />
  </div>;
}

// ─── Step 4: Gemini API key ──────────────────────────
function S4({ state: s, update: u, goTo }) {
  const ke = s.geminiHasKey === "yes" && s.geminiApiKey.length > 0 && (!s.geminiApiKey.startsWith("AIza") || s.geminiApiKey.length < 30) ? "Must start with AIza, 30+ chars" : "";
  const ok = s.geminiHasKey === "yes" && s.geminiApiKey.startsWith("AIza") && s.geminiApiKey.length >= 30;
  const models = [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (default)" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (faster, cheaper)" },
    { value: "gemini-3-pro", label: "Gemini 3 Pro (most capable)" },
    { value: "gemini-3-flash", label: "Gemini 3 Flash (newest fast)" },
  ];
  return <div>
    <Title>Gemini API key</Title>
    <p className="text-sm text-zinc-400 mb-4">Your app uses Google Gemini. You need a free API key.</p>
    <Radio value={s.geminiHasKey} onChange={v => u({ geminiHasKey: v })} options={[
      { value: "yes", label: "✅ I have a key (starts with AIza...)" },
      { value: "no", label: "❌ I don't have one yet" },
    ]} />
    {s.geminiHasKey === "no" && <div className="mt-3 bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 space-y-2">
      <p>1. Open <ExtLink href="https://aistudio.google.com/app/apikey">Google AI Studio</ExtLink></p>
      <p>2. Click <strong>Create API key</strong> → choose project → <strong>Create</strong></p>
      <p>3. Copy the key (<code className="bg-zinc-700 px-1 rounded">AIza...</code>)</p>
      <Btn variant="secondary" className="mt-2" onClick={() => u({ geminiHasKey: "yes" })}>I have it now →</Btn>
    </div>}
    {s.geminiHasKey === "yes" && <div className="mt-3">
      <Input label="API Key" value={s.geminiApiKey} placeholder="AIza..." error={ke} mono onChange={e => u({ geminiApiKey: e.target.value })} />
      <p className="text-xs text-zinc-500 -mt-1 mb-3">Stored only in your browser.</p>
    </div>}
    <button onClick={() => u({ showModelOptions: !s.showModelOptions })} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">
      {s.showModelOptions ? "▾" : "▸"} Model options (advanced)
    </button>
    {s.showModelOptions && <select value={s.geminiModel} onChange={e => u({ geminiModel: e.target.value })}
      className="mt-2 w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-sm">{models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>}
    <Nav onBack={() => goTo(3)} onNext={() => goTo(5)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 5: Authorized users ────────────────────────
function S5({ state: s, update: u, goTo }) {
  const [err, setErr] = useState("");
  const us = s.authorizedUsers;
  const oe = s.ownerEmail.toLowerCase();

  useEffect(() => {
    if (us.length === 0 && oe) u({ authorizedUsers: [{ email: oe, role: "admin" }] });
    else if (us.length > 0 && us[0].email !== oe && oe) { const c = [...us]; c[0] = { email: oe, role: "admin" }; u({ authorizedUsers: c }); }
  }, [oe]);

  const emails = us.map(x => x.email.toLowerCase().trim());
  const dupes = new Set(); const seen = new Set();
  emails.forEach(e => { if (seen.has(e) && e) dupes.add(e); seen.add(e); });
  const valid = us.length >= 1 && us.every((x, i) => i === 0 || (EMAIL_RE.test(x.email) && !dupes.has(x.email.toLowerCase().trim())));

  return <div>
    <Title>Who can access your app?</Title>
    <p className="text-sm text-zinc-400 mb-4">Only these emails can log in.</p>
    <div className="space-y-2">
      {us.map((x, i) => {
        const isO = i === 0, isD = dupes.has(x.email.toLowerCase().trim()) && x.email, isI = !isO && x.email.length > 0 && !EMAIL_RE.test(x.email);
        return <div key={i} className="flex items-center gap-2">
          <input value={x.email} disabled={isO} placeholder="email@gmail.com"
            onChange={e => { const c = [...us]; c[i] = { ...c[i], email: e.target.value }; u({ authorizedUsers: c }); }}
            className={`flex-1 px-3 py-2 rounded-lg bg-zinc-800 text-white border text-sm ${isD || isI ? "border-red-500" : "border-zinc-700"} focus:outline-none focus:border-blue-500 disabled:opacity-60 font-mono`} />
          <select value={x.role} disabled={isO}
            onChange={e => { if (isO && e.target.value !== "admin") { setErr("Cannot demote yourself"); setTimeout(() => setErr(""), 3000); return; }
              const c = [...us]; c[i] = { ...c[i], role: e.target.value }; u({ authorizedUsers: c }); }}
            className="px-2 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-sm disabled:opacity-60">
            <option value="admin">admin</option><option value="user">user</option>
          </select>
          {isO ? <span className="text-xs text-zinc-500 w-7 text-center">🔒</span>
            : <button onClick={() => { if (isO) { setErr("Cannot remove yourself"); setTimeout(() => setErr(""), 3000); return; } u({ authorizedUsers: us.filter((_, j) => j !== i) }); }}
              className="text-red-400 hover:text-red-300 w-7 text-center text-lg cursor-pointer">×</button>}
        </div>;
      })}
    </div>
    <button onClick={() => u({ authorizedUsers: [...us, { email: "", role: "user" }] })} className="mt-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer">+ Add user</button>
    <Toast message={err} type="error" />
    <Nav onBack={() => goTo(4)} onNext={() => goTo(6)} nextDisabled={!valid} />
  </div>;
}

// ─── Step 6: Config review ───────────────────────────
function S6({ state: s, goTo }) {
  const admins = s.authorizedUsers.filter(x => x.role === "admin").length;
  return <div>
    <Title>Review your configuration</Title>
    <p className="text-sm text-zinc-400 mb-4">Check everything before we set up Firebase. You can go back to edit.</p>
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden mb-4">
      <SummaryRow label="App name" value={s.appName} />
      <SummaryRow label="Slug" value={s.slug} />
      <SummaryRow label="URL" value={`https://${s.slug}.web.app`} />
      <SummaryRow label="Admin URL" value={`https://${s.slug}-admin.web.app`} />
      <SummaryRow label="Owner" value={s.ownerEmail} />
      <SummaryRow label="Gemini model" value={s.geminiModel} />
      <SummaryRow label="API key" value={`AIza...${s.geminiApiKey.slice(-4)} ✓`} />
      <SummaryRow label="Users" value={`${s.authorizedUsers.length} (${admins} admin, ${s.authorizedUsers.length - admins} user)`} />
    </div>
    <Nav onBack={() => goTo(5)} onNext={() => goTo(7)} nextLabel="Looks good, set up Firebase →" />
  </div>;
}

// ─── Step 7: Create Firebase project ─────────────────
function S7({ state: s, update: u, goTo }) {
  const ok = s.fbProjectCreated && s.fbBlazeUpgraded && s.fbBudgetAlert;
  return <div>
    <Title>Create your Firebase project</Title>
    <p className="text-sm text-zinc-400 mb-4">Do these 3 things in <ExtLink href="https://console.firebase.google.com">Firebase Console</ExtLink>, then check each box.</p>
    <div className="space-y-2">
      <Check checked={s.fbProjectCreated} onChange={v => u({ fbProjectCreated: v })}>
        <strong>Created project</strong> — "Add project" → name it exactly <code className="bg-zinc-700 px-1 rounded text-blue-300">{s.slug}</code> → disable Google Analytics → Create.
      </Check>
      <Check checked={s.fbBlazeUpgraded} onChange={v => u({ fbBlazeUpgraded: v })}>
        <strong>Upgraded to Blaze</strong> — Bottom-left "Upgrade" → Blaze → enter card. You won't be charged at personal usage.
      </Check>
      <Check checked={s.fbBudgetAlert} onChange={v => u({ fbBudgetAlert: v })}>
        <strong>Set budget alert</strong> — ⚙ → Usage and billing → Set spending alerts → Create Budget → $5/month → thresholds 50%, 90%, 100%.
      </Check>
    </div>
    <Nav onBack={() => goTo(6)} onNext={() => goTo(8)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 8: Activate services ───────────────────────
function S8({ state: s, update: u, goTo }) {
  const ok = s.svcAuth && s.svcFirestore && s.svcHostingWeb && s.svcHostingAdmin && s.svcFunctions;
  return <div>
    <Title>Activate these services</Title>
    <p className="text-sm text-zinc-400 mb-4">All in the Firebase Console left menu. Check each when done.</p>
    <div className="space-y-2">
      <Check checked={s.svcAuth} onChange={v => u({ svcAuth: v })}>
        <strong>Authentication</strong> — Authentication → Get Started → Sign-in method → <strong>Google</strong> → Enable → email: <code className="bg-zinc-700 px-1 rounded">{s.ownerEmail}</code> → Save.
      </Check>
      <Check checked={s.svcFirestore} onChange={v => u({ svcFirestore: v })}>
        <strong>Firestore Database</strong> — Firestore Database → Create database → <strong>Production mode</strong> → Location: <code className="bg-zinc-700 px-1 rounded">eur3</code> (Europe) → Enable.
      </Check>
      <Check checked={s.svcHostingWeb} onChange={v => u({ svcHostingWeb: v })}>
        <strong>Hosting</strong> — Hosting → Get Started → Next → Next → Continue.
      </Check>
      <Check checked={s.svcHostingAdmin} onChange={v => u({ svcHostingAdmin: v })}>
        <strong>Admin site</strong> — In Hosting, click "Add another site" → ID: <code className="bg-zinc-700 px-1 rounded">{s.slug}-admin</code> → Add.
      </Check>
      <Check checked={s.svcFunctions} onChange={v => u({ svcFunctions: v })}>
        <strong>Cloud Functions</strong> — Functions → Get Started.
      </Check>
    </div>
    <Nav onBack={() => goTo(7)} onNext={() => goTo(9)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 9: Firebase config values ──────────────────
function S9({ state: s, update: u, goTo }) {
  const f = (k) => s[k] || "";
  const errs = {};
  if (f("fbApiKey") && f("fbApiKey").length < 10) errs.fbApiKey = "Too short";
  if (f("fbAuthDomain") && !f("fbAuthDomain").includes(".firebaseapp.com")) errs.fbAuthDomain = "Should end with .firebaseapp.com";
  if (f("fbProjectId") && f("fbProjectId") !== s.slug) errs.fbProjectId = `Expected "${s.slug}" — double check`;
  if (f("fbStorageBucket") && !f("fbStorageBucket").includes(".appspot.com") && !f("fbStorageBucket").includes(".firebasestorage.app")) errs.fbStorageBucket = "Should end with .appspot.com or .firebasestorage.app";
  if (f("fbMessagingSenderId") && !/^\d{8,}$/.test(f("fbMessagingSenderId"))) errs.fbMessagingSenderId = "Should be numeric, 8+ digits";
  if (f("fbAppId") && !f("fbAppId").startsWith("1:")) errs.fbAppId = "Should start with 1:";

  const allFilled = f("fbApiKey") && f("fbAuthDomain") && f("fbProjectId") && f("fbStorageBucket") && f("fbMessagingSenderId") && f("fbAppId");
  const noBlockingErrors = !errs.fbApiKey && !errs.fbAuthDomain && !errs.fbMessagingSenderId;
  const ok = allFilled && noBlockingErrors;

  return <div>
    <Title>Get your app credentials</Title>
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl p-4 mb-4 text-sm text-zinc-300 space-y-1.5">
      <p>In Firebase Console: <strong>⚙ Project Settings</strong> (top-left gear)</p>
      <p>→ "Your apps" → <strong>+ Add app</strong> → choose <strong>web {"</>"}</strong></p>
      <p>→ Nickname: <code className="bg-zinc-700 px-1 rounded">web</code> → do NOT check Hosting → <strong>Register app</strong></p>
      <p>→ Copy the 6 values from the <code className="bg-zinc-700 px-1 rounded">firebaseConfig</code> object:</p>
    </div>
    <Input label="apiKey" value={f("fbApiKey")} error={errs.fbApiKey} mono placeholder="AIzaSy..." onChange={e => u({ fbApiKey: e.target.value })} />
    <Input label="authDomain" value={f("fbAuthDomain")} error={errs.fbAuthDomain} mono placeholder={`${s.slug}.firebaseapp.com`} onChange={e => u({ fbAuthDomain: e.target.value })} />
    <Input label="projectId" value={f("fbProjectId")} error={errs.fbProjectId && f("fbProjectId") !== s.slug ? errs.fbProjectId : ""} mono placeholder={s.slug} onChange={e => u({ fbProjectId: e.target.value })} />
    <Input label="storageBucket" value={f("fbStorageBucket")} error={errs.fbStorageBucket} mono placeholder={`${s.slug}.firebasestorage.app`} onChange={e => u({ fbStorageBucket: e.target.value })} />
    <Input label="messagingSenderId" value={f("fbMessagingSenderId")} error={errs.fbMessagingSenderId} mono placeholder="123456789012" onChange={e => u({ fbMessagingSenderId: e.target.value })} />
    <Input label="appId" value={f("fbAppId")} error={errs.fbAppId} mono placeholder="1:123456789012:web:abc123" onChange={e => u({ fbAppId: e.target.value })} />
    <Nav onBack={() => goTo(8)} onNext={() => goTo(10)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 10: CLI setup ──────────────────────────────
function S10({ state: s, update: u, goTo }) {
  const ok = s.cliInstalled && s.cliLoggedIn && s.cliProjectLinked && s.cliSecretSaved;
  return <div>
    <Title>Terminal setup</Title>
    <p className="text-sm text-zinc-400 mb-4">Run these commands in your project folder. If you have Claude Code, just tell it to run them.</p>
    <div className="space-y-2">
      <Check checked={s.cliInstalled} onChange={v => u({ cliInstalled: v })}>
        <strong>Firebase CLI installed</strong><br />
        <code className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded block mt-1">npm install -g firebase-tools</code>
      </Check>
      <Check checked={s.cliLoggedIn} onChange={v => u({ cliLoggedIn: v })}>
        <strong>Logged in</strong><br />
        <code className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded block mt-1">firebase login</code>
      </Check>
      <Check checked={s.cliProjectLinked} onChange={v => u({ cliProjectLinked: v })}>
        <strong>Project linked</strong><br />
        <code className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded block mt-1">firebase use --add</code>
        <span className="text-xs text-zinc-500 block mt-0.5">Select <code>{s.slug}</code>, alias: default</span>
      </Check>
      <Check checked={s.cliSecretSaved} onChange={v => u({ cliSecretSaved: v })}>
        <strong>Gemini API key saved as secret</strong><br />
        <code className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded block mt-1">firebase functions:secrets:set GEMINI_API_KEY</code>
        <span className="text-xs text-zinc-500 block mt-0.5">Paste your AIza... key when asked</span>
      </Check>
    </div>
    <Nav onBack={() => goTo(9)} onNext={() => goTo(11)} nextDisabled={!ok} />
  </div>;
}

// ─── Step 11: Final summary & generate ───────────────
function S11({ state: s, goTo, onReset }) {
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [confirmReset, setConfirmReset] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const jsonRef = useRef(null);

  const admins = s.authorizedUsers.filter(x => x.role === "admin").length;
  const k4 = s.geminiApiKey.slice(-4);

  const config = {
    version: "v0.002",
    appName: s.appName,
    slug: s.slug,
    ownerEmail: s.ownerEmail,
    geminiApiKey: s.geminiApiKey,
    geminiModel: s.geminiModel,
    authorizedUsers: s.authorizedUsers.map(x => ({ email: x.email.toLowerCase().trim(), role: x.role })),
    firestoreRegion: "eur3",
    functionsRegion: "europe-west1",
    firebaseConfig: {
      apiKey: s.fbApiKey,
      authDomain: s.fbAuthDomain,
      projectId: s.fbProjectId,
      storageBucket: s.fbStorageBucket,
      messagingSenderId: s.fbMessagingSenderId,
      appId: s.fbAppId,
    },
  };

  const configStr = JSON.stringify(config, null, 2);
  const prompt = `Here's my complete suppa-agent configuration:\n\n${configStr}\n\nGenerate all project files with REAL Firebase config values (no placeholders): package.json files, vite configs, firebase.json, .firebaserc, firestore.rules, web/ frontend (React + Vite), admin/ frontend, functions/index.js with Gemini, CLAUDE.md. Deliver as zip files with Claude Code commands to apply them. Start with the project structure overview.`;

  const flash = (m, t = "success") => { setToast(m); setToastType(t); setTimeout(() => setToast(null), 4000); };

  const handleSend = () => {
    try { if (typeof sendPrompt === "function") { sendPrompt(prompt); flash("✅ Sent to Claude!"); return; } } catch {}
    if (tryCopy(prompt)) flash("✅ Copied — paste it in the chat!", "info");
    else { setShowJson(true); flash("Select and copy the JSON below.", "info"); }
  };

  const handleCopy = () => {
    if (tryCopy(configStr)) flash("✅ JSON copied!");
    else { setShowJson(true); flash("Select and copy below.", "info"); }
  };

  return <div>
    <Title>Everything ready. Let's build your app.</Title>
    <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden mb-4">
      <SummaryRow label="App name" value={s.appName} />
      <SummaryRow label="Slug" value={s.slug} />
      <SummaryRow label="URL" value={`https://${s.slug}.web.app`} />
      <SummaryRow label="Admin URL" value={`https://${s.slug}-admin.web.app`} />
      <SummaryRow label="Owner" value={s.ownerEmail} />
      <SummaryRow label="Gemini" value={`${s.geminiModel} · AIza...${k4}`} />
      <SummaryRow label="Users" value={`${s.authorizedUsers.length} (${admins} admin)`} />
      <SummaryRow label="Firebase" value={`Project: ${s.fbProjectId} · Blaze ✓`} />
      <SummaryRow label="Services" value="Auth · Firestore · Hosting · Functions ✓" />
      <SummaryRow label="CLI" value="Logged in · Linked · Secret saved ✓" />
    </div>

    <div className="space-y-2.5">
      <Btn variant="success" onClick={handleSend} className="w-full">💬 Send config to Claude</Btn>
      <Btn variant="secondary" onClick={handleCopy} className="w-full">📋 Copy configuration</Btn>
      {!confirmReset ? (
        <Btn variant="danger" onClick={() => setConfirmReset(true)} className="w-full">🔄 Start over</Btn>
      ) : (
        <div className="bg-zinc-900 border border-zinc-600 rounded-lg p-3 space-y-2">
          <p className="text-sm text-zinc-300">Clear all data and restart?</p>
          <div className="flex gap-2">
            <Btn variant="danger" onClick={() => { setConfirmReset(false); onReset(); }} className="flex-1">Yes, clear</Btn>
            <Btn variant="ghost" onClick={() => setConfirmReset(false)} className="flex-1">Cancel</Btn>
          </div>
        </div>
      )}
    </div>

    <Toast message={toast} type={toastType} />

    {showJson && <div className="mt-3">
      <div className="flex justify-between mb-1"><span className="text-xs text-zinc-500">Select and copy:</span>
        <button onClick={() => { jsonRef.current?.select(); jsonRef.current?.focus(); }} className="text-xs text-blue-400 cursor-pointer">Select all</button></div>
      <textarea ref={jsonRef} readOnly value={configStr} onClick={() => { jsonRef.current?.select(); }}
        className="w-full h-40 px-3 py-2 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded-lg font-mono text-xs resize-none focus:outline-none focus:border-blue-500" />
    </div>}
    {!showJson && <button onClick={() => setShowJson(true)} className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer">▸ Show raw JSON</button>}

    <Nav onBack={() => goTo(10)} showBack />
  </div>;
}

// ─── Main Wizard ─────────────────────────────────────
export default function SuppaAgentWizard() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => { loadState().then(s => { if (s) setState(p => ({ ...p, ...s })); setHydrated(true); }); }, []);
  useEffect(() => { if (!hydrated) return; if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => saveState(state), 300); return () => clearTimeout(saveTimer.current); }, [state, hydrated]);

  const u = useCallback(patch => setState(p => ({ ...p, ...patch })), []);
  const goTo = step => u({ step });
  const reset = async () => { await clearState(); setState({ ...DEFAULT_STATE }); };

  if (!hydrated) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Loading wizard...</div>;

  const steps = {
    1: <S1 goTo={goTo} />,
    2: <S2 state={state} update={u} goTo={goTo} />,
    3: <S3 state={state} update={u} goTo={goTo} />,
    4: <S4 state={state} update={u} goTo={goTo} />,
    5: <S5 state={state} update={u} goTo={goTo} />,
    6: <S6 state={state} goTo={goTo} />,
    7: <S7 state={state} update={u} goTo={goTo} />,
    8: <S8 state={state} update={u} goTo={goTo} />,
    9: <S9 state={state} update={u} goTo={goTo} />,
    10: <S10 state={state} update={u} goTo={goTo} />,
    11: <S11 state={state} goTo={goTo} onReset={reset} />,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        <ProgressBar step={state.step} />
        {steps[state.step] || steps[1]}
      </div>
    </div>
  );
}
