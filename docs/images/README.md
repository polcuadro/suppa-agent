# Visual assets

Assets included in the `v0.001` release.

## Mascot / hero image

`suppa-agent-hero.png` — full-body pixel art character. PNG with transparent background. Used as:
- Hero illustration at the top of the main `README.md`
- Avatar / Open Graph image when sharing the repo on social
- Optional decorative element in the starter app login screen

Original size: ~610×762. Style: 8/16-bit pixel art, gray + orange palette.

## Favicons

Multiple sizes for different contexts. All have transparent backgrounds.

| File | Size | Use case |
|------|------|----------|
| `favicon.ico` | 16/32/48 | Standard `<link rel="icon">` in browsers |
| `favicon-16.png` | 16×16 | Small browser tabs (legacy) |
| `favicon-32.png` | 32×32 | Standard browser tabs |
| `favicon-64.png` | 64×64 | High-DPI tabs |
| `favicon-128.png` | 128×128 | Bookmarks, taskbars |
| `favicon-256.png` | 256×256 | Apple touch icon, large displays |
| `favicon-512.png` | 512×512 | PWA manifest icons, web app installs |

The `starter/web/public/` and `starter/admin/public/` folders include `favicon.ico`, `favicon-32.png`, and `favicon-256.png` already wired into the respective `index.html` files.

## License of the visual assets

Same as the rest of the repo: MIT. Feel free to reuse, modify, fork, ship.

## Future additions (planned)

- `screenshots/` folder with real captures of the chat UI, admin panel, Code Tester
- SVG vector versions of the mascot and favicon (for true pixel-perfect scaling)
- Open Graph banner (1200×630) for nicer link previews on Twitter/Discord/Slack
- Animated GIF showing the wizard flow
- Variants of the mascot for different `examples/` (cooking apron, study cap, etc.)

To contribute, see `CONTRIBUTING.md`.
