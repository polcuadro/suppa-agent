# Examples

Community-contributed specialized variants of suppa-agent. Each example demonstrates a real use case, with the minimal diff from the base.

## How to use an example

1. Build the base suppa-agent first (see root `README.md`).
2. Pick an example below.
3. Apply the example's diff to your fork (each example provides exact instructions).
4. Re-deploy.

## Examples in this repo

> 🚧 **v0.001 ships with no examples bundled.** This folder is the home for community contributions. The first batch is being built — check back soon, or contribute your own.

### Planned (looking for contributors)

| Example | Status | Description |
|---------|--------|-------------|
| `cooking/` | 🔜 In progress | Mediterranean recipe assistant with image-based ingredient identification |
| `study/` | 🔜 In progress | Study buddy with quiz mode and note storage |
| `parents/` | 🔜 Looking for contributors | Family helper with simplified UI for elderly users |
| `medical/` | 🔜 Looking for contributors | Caregiver companion (informational only — NOT diagnosis) |
| `legal/` | 🔜 Looking for contributors | Document Q&A for non-lawyers |
| `customer-support/` | 🔜 Looking for contributors | Internal team support agent |
| `games/` | 🔜 Looking for contributors | Interactive fiction / D&D dungeon master |
| `language-learning/` | 🔜 Looking for contributors | Conversation partner for language learners |
| `gardening/` | 🔜 Looking for contributors | Plant care companion with photo identification |

## Contributing an example

See `CONTRIBUTING.md` at the repo root. Short version:

1. Open an issue using the "New example variant" template.
2. Describe what's specialized about your variant.
3. If accepted, submit a PR adding your folder under `examples/your-variant/`.
4. Each example folder must contain:
   - `README.md` — what it does and who it's for
   - `system_instruction.txt` — the Gemini system prompt
   - `diff.md` — minimal diff vs core (file paths and changes)
   - `screenshots/` — optional but appreciated

## Variant philosophy

A good example:
- Solves one specific use case clearly.
- Changes as little as possible from core (system prompt + small UI tweaks).
- Doesn't fork the entire codebase.
- Is shareable as a recipe, not as a parallel project.

If your variant requires major architectural changes, it's probably a fork rather than an example.
