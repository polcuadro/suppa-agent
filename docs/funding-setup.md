# Funding setup

This guide walks you through enabling donations for your `suppa-agent` fork or for the original repo. We recommend setting up **GitHub Sponsors as primary**, **Ko-fi as secondary**, and **a PayPal/Stripe link as universal fallback** — three channels that together cover ~100% of donor preferences.

---

## Why three channels?

Different donors prefer different things:

| Donor type | Preferred channel | Why |
|------------|------------------|-----|
| Developers active on GitHub | **GitHub Sponsors** | Already logged in, one click, no new account |
| Casual users / non-developers | **Ko-fi** or **Buy Me a Coffee** | Familiar consumer-grade UX, no GitHub account needed |
| Donors in countries with limited GitHub Sponsors | **PayPal / Stripe** (custom URL) | Available everywhere |

If you only set up one, you'll lose potential donors who don't use that one.

---

## Recommended setup (15-30 min total)

### Step 1 — Apply to GitHub Sponsors (slow but worth it)

GitHub Sponsors is the gold standard for open-source funding. **0% platform fees**, integrated experience, automatic Sponsor button on your repos.

**Eligibility (Spain and most of Europe is supported):**
- A bank account in a [supported country](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/about-github-sponsors-for-open-source-contributors#supported-regions). 68+ regions including Spain, France, Germany, UK, USA, etc.
- A government-issued ID for verification.
- Tax residence in a supported country.

**Application steps:**
1. Go to [github.com/sponsors](https://github.com/sponsors).
2. Click "Get sponsored".
3. Fill in profile (your bio, why people should sponsor you, what they get).
4. Submit bank info via Stripe Connect (handled by GitHub).
5. Submit tax forms (W-9 for US, W-8BEN for non-US).
6. Wait for approval — typically 1-2 weeks.
7. Once approved, set up sponsorship tiers ($1, $5, $25, etc., monthly or one-time).

**Pro tip:** While waiting for approval, set up Ko-fi (next step) so you have a working channel immediately.

### Step 2 — Set up Ko-fi (5 minutes, no approval needed)

Ko-fi is the easiest secondary channel. No approval, no waiting.

1. Go to [ko-fi.com](https://ko-fi.com) and sign up.
2. Choose a username — this becomes your URL: `ko-fi.com/YOUR_HANDLE`.
3. Connect a payout method:
   - **Stripe** (recommended for Europe — direct bank deposit) or
   - **PayPal** (faster setup but PayPal fees apply on withdrawal).
4. Customize your page: add a header image, short description, link to GitHub, link to your project demo.
5. Set a goal (optional — e.g., "Server costs $5/month" or "100€ for new feature development").

**Fees:** 0% on the free Gold tier for one-time donations. Recurring memberships (Ko-fi Gold) cost the donor ~5%, but you can offer one-time donations only.

### Step 3 — Set up a PayPal.me link or Stripe Payment Link (5 minutes)

This is your universal fallback. Anyone, anywhere can use it.

**Option A — PayPal.me (most universal):**
1. Go to [paypal.com/paypalme](https://paypal.me).
2. Create your `paypal.me/YOUR_HANDLE` URL.
3. Done. People click the link and choose how much to send.

**Option B — Stripe Payment Link (more pro look, more control):**
1. Sign up at [stripe.com](https://stripe.com) (account approval ~24h).
2. Dashboard → Payment Links → **+ New**.
3. Choose "Donation" preset.
4. Optionally let donors enter custom amounts.
5. Get your `buy.stripe.com/...` URL.
6. Stripe fees: 1.5% + €0.25 per transaction (EU).

**Option C — Both (advanced):**
You can include both as separate `custom` entries in `FUNDING.yml` (up to 4 custom URLs allowed).

### Step 4 — Configure `.github/FUNDING.yml`

Edit the file at `.github/FUNDING.yml` and uncomment + fill in only the lines you've set up:

```yaml
# ✅ GitHub Sponsors (after approval)
github: YOUR_GITHUB_USERNAME

# ✅ Ko-fi (use the username from your ko-fi.com URL)
ko_fi: YOUR_KOFI_HANDLE

# ✅ Universal fallback URLs (up to 4 in the array)
custom: ["https://www.paypal.me/YOUR_HANDLE"]
```

Commit and push to `main`. Within 30 seconds, refresh the repo page and the **💜 Sponsor** button appears at the top.

---

## Adding a "Support" section to your README

GitHub also recommends adding a visible Support section so users discover the donation options. The README section at the bottom of this repo includes one — adapt the wording to your style.

A good Support section is:
- **Brief** (3-5 sentences max).
- **Honest about why you're asking** (e.g., "If suppa-agent saved you time or money, a small donation helps me keep maintaining and improving it").
- **Specific** (link to GitHub Sponsors / Ko-fi / etc., not a vague "donate page").
- **Not pushy** — it's an option, not an obligation.

Avoid:
- Pop-ups or modals.
- Aggressive language ("Please donate!", "Help me survive!").
- Long lists of what you've personally spent on the project.
- Comparisons to corporate alternatives ("This would cost $X if you bought ChatGPT…").

---

## Tax considerations (Spain example)

> **Disclaimer**: Claude is not a tax advisor. The following is general orientation, not legal advice. Consult a Spanish gestor or asesor fiscal for your specific situation.

In Spain, donations received as an individual fall into one of two categories:

1. **Occasional donations as a particular** (very low volume, € a year): may fall under "Impuesto sobre Sucesiones y Donaciones" — donor pays it. Your obligation is mostly to declare receipts in your IRPF.

2. **Recurring donations / clear "for services rendered"** (sustained volume): may be considered income. You'd need to register as autónomo if it becomes a meaningful revenue stream, declare via IRPF or via IVA depending on amounts, and possibly issue invoices.

The threshold between "occasional gift" and "income" is fuzzy. If your donations cross into a few hundred euros per month consistently, talk to a gestor. The cost (~50-100€ per year for occasional consultation) is worth not getting hit by a tax inspection.

For most open-source projects, donations stay in the "occasional" zone and are simple to declare. But if `suppa-agent` ever takes off, plan ahead.

If you live in another country, the rules differ. Common patterns:
- USA: report as 1099 income; GitHub provides forms.
- UK: depending on volume, register as self-employed.
- Germany: similar to Spain, may need Kleinunternehmer status.

---

## Reasons to set up donations even if you don't expect much

1. **Cost = nothing**: setup is free, the FUNDING.yml file costs nothing to maintain.
2. **Validation**: even small donations are signal that your project is valued. They help you decide where to spend time.
3. **Sustainability hint**: signals to potential users that the project might keep being maintained, not abandoned.
4. **Discoverability**: GitHub's Sponsors Explore feature surfaces sponsored projects more, helping growth.
5. **Goodwill**: some users want to thank you and would be sad to find no easy way to do so.

---

## Pitfalls to avoid

- **Don't promise rewards you can't deliver.** "$25/month sponsors get 1:1 calls with me" sounds great until you have 10 sponsors. Start with simple appreciation tiers (a thank-you tweet, name in a CONTRIBUTORS file).
- **Don't tie donations to feature priority** without a clear policy. It can create resentment if a $5 donor expects priority over a $0 user reporting a bug.
- **Don't forget to update FUNDING.yml when handles change.** Broken donation links erode trust.
- **Don't add cryptocurrency wallets unless you're prepared for tax complexity.** Crypto donations are taxable as income at the time of receipt in most jurisdictions, at the spot value.
- **Don't enable too many channels.** Three is plenty. Five is confusing. Donors will think "where is the right place?" and decide later (= never).

---

## Maintenance

Once set up, donations need ~zero maintenance:

- Once a quarter: check that all your handles still resolve. Deleted Ko-fi profile? Update FUNDING.yml.
- Once a year: thank major sponsors publicly (with their permission) — a tweet, a CHANGELOG mention, a CONTRIBUTORS file update.
- Whenever you change your name, bank, or move countries: update GitHub Sponsors profile and Stripe/PayPal accounts.

That's it. The system runs itself.
