# Contributing to suppa-agent

First — thanks for considering contributing. This is a small project that wants to stay small. The goal is to keep `suppa-agent` as a clean starter that anyone can fork and customize. Most of the cool work happens in the forks, not in the core repo.

## What we accept

| Type of contribution | Likely outcome |
|----------------------|----------------|
| Bug reports with reproduction steps | ✅ Welcome |
| Doc fixes (typos, clarifications, missing context) | ✅ Welcome, easy merges |
| Translations of `MANUAL.md` to other languages | ✅ Welcome (open issue first) |
| Example variants in `examples/` (cooking app, study buddy, etc.) | ✅ Welcome (open issue first) |
| Bug fixes in `starter/` code | ✅ Welcome |
| New features in `starter/` core | ⚠️ Discuss first — we keep the core minimal |
| Major refactors | ❌ Probably no — fork instead |

## Languages for issues and PRs

- **Code, commits, code comments**: English.
- **Issues, PR descriptions, discussions**: English, Catalan, or Spanish — whatever you're comfortable with. We'll respond in kind.

## Workflow

1. **Open an issue first** for anything beyond a one-line typo fix. This saves wasted work if the change isn't a fit.
2. **Fork** the repo.
3. **Branch** from `main`: `git checkout -b fix/short-description` or `feat/short-description`.
4. **Commit small**: one logical change per commit. Use the format:
   ```
   v0.001 - fix typo in MANUAL phase 4.3
   ```
   The version prefix is the upcoming release the change targets.
5. **Push** and open a Pull Request to `main`.
6. **PR description** should mention the linked issue (e.g., `Closes #12`).

## Code style

- **JavaScript / JSX** — match existing style. No linter enforced (yet).
- **Indentation**: 2 spaces.
- **Quotes**: single for JS, double for JSX attributes.
- **No TypeScript** — kept as pure JS for accessibility to non-developers.
- **One file = one responsibility**. If you add a new feature, create a new file. Don't inflate `App.jsx` or any existing component beyond ~150 lines.

## Tests

There's no automated test suite yet. PRs should include manual test steps in the description (e.g., "Tested by deploying to a fresh Firebase project, logging in, sending 5 messages with various models").

## Adding an example

If you've forked `suppa-agent` and built a specialized variant (cooking, study, medical, legal, etc.), we'd love to feature it.

1. Open an issue: `[Example] My X variant`.
2. Describe what's specialized about it (`systemInstruction`, UI tweaks, extra collections, etc.).
3. If accepted, you'll be asked to submit a PR adding a new folder under `examples/your-variant-name/` with:
   - A short `README.md` describing the variant.
   - The `systemInstruction` in a clearly-marked file.
   - Any screenshots.
   - The minimal diff vs core (don't fork the whole codebase — just describe the changes).

## Translations

Translating `MANUAL.md` (or `MANUAL.pdf`) to another language is one of the most valuable contributions. Existing versions:

- 🇬🇧 English (canonical) — `MANUAL.pdf`
- 🇨🇦 Catalan — historical drafts
- 🇪🇸 Spanish — historical drafts

To add a new translation:
1. Open an issue: `[Translation] [Your language]`.
2. Submit a PR with `MANUAL_[lang].pdf` (and the source `.md` if you'd like it preserved).
3. Update the README's "How to use" section to mention the new translation.

## Security

If you find a security issue (especially around Firestore rules, secrets handling, or auth flow), **do not open a public issue**. Email the repo owner directly (see the GitHub profile linked in README).

## Code of Conduct

Be kind, patient, and assume good intent. If you wouldn't say it to a colleague, don't say it on the issue tracker. See `CODE_OF_CONDUCT.md` for the full text.

## License

By contributing, you agree your contributions will be licensed under the MIT License (the project's license). See `LICENSE`.

---

Questions? Open a [Discussion](../../discussions) or just open an issue and ask. We're here to help.
