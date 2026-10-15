# roughinredlines.com

Public website for **Rough-In Redlines** (PDF markup for the trades). Static HTML/CSS served by GitHub Pages; custom domain in `CNAME`. No build step, no analytics.

- `index.html` landing · `privacy.html` · `support.html` · `404.html`
- Screenshots in `img/` come from the app's UI tests run in the public brand on the iPad simulator.
- `windows/latest.json` — the update feed read by the Windows app's **Check for updates** (website download only). Bump `version` (and `notes`) when a new installer is posted; `url` must stay on roughinredlines.com.

## Brand

The 2026 logo (designed by Julie) and everything derived from it live in `img/brand/2026/`; the full kit, including the 4096 px files left out of the repo for size, is on the share at `Rough-In Marketing/Brand 2026-10/`. Its `README.txt` says which file to use where.

- **Vector first.** `vector/rr-logo-2026.svg` (dark square), `-transparent.svg` (for dark surfaces), `-light.svg` (white paper and pages), `rr-mark-2026-letters*.svg` (letters only, for overlays). PNG exports at 512–4096 px are in `png/`.
- **Julie's painted original**, upscaled locally with Real-ESRGAN, is in `master/` for when her texture matters more than crisp edges.
- **Small sizes** (under ~64 px) use the flat RR: `favicon.svg`, `img/logo.svg` (nav and the /s/ share page) and `img/touch-icon.png` come from `small/`.
- **Social:** `social/avatar-800.png`, `social/youtube-banner-2560x1440.png`, `social/og-1200x630.jpg` (also served as `img/og.jpg`).
- **Site look:** charcoal backgrounds (`#08090C`, `#0E0F13`, `#15171C`), the logo's red `#FF3A1E` for glows and rules only, `#D42F17` for buttons (white text passes AA), `#FF6A4D` for red text, silver/white type. Headlines are Bricolage Grotesque ExtraBold at 82% width; body Geist; labels Geist Mono. The blueprint texture `img/brand/2026/bp-tile.svg` goes only on dark bands (hero, page heads, final CTA) and is masked away from copy. Glow is reserved for the hero logo, primary buttons on hover, the Pro plan and section dividers; motion respects `prefers-reduced-motion`.
- **Images:** add `.avif` and `.webp` next to each `.jpg`/`.png` (plus a half-width size) and use `<picture>`, as in `index.html`.
- App icons are a separate decision and still use the previous mark.
