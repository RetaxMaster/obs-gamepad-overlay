# OBS Gamepad Overlay

A lightweight, skin-able controller overlay for OBS. It reads your physical
gamepad through the browser's **Gamepad API** and lights up the on-screen buttons
in real time — a self-hosted, from-scratch take on the idea popularized by
gamepadviewer.com.

- **Zero build, zero dependencies.** Plain HTML/CSS/JS. Drop it into an OBS
  Browser Source and you're done.
- **Skin-agnostic engine.** The engine only reports *what you pressed*; a skin
  decides *how it looks*. Switch skins with `?skin=<id>` or the visual picker.
- **Four build styles, shared kits.** Pure CSS, image body + shared **CSS**
  controls, image body + shared **PNG sprite** controls, or a fully custom
  skin — most only require drawing a body. Nine ship in the repo; see
  [Switching skins](#switching-skins).
- **Local-only skins, too.** Add private, git-ignored skins (e.g. ones built on
  a streamer's art you can't redistribute) without touching the public repo —
  see [Local-only skins](#local-only-skins-optional).

---

## Quick start (local)

The Gamepad API requires the page to be served over `http://` (not opened as a
`file://`), so run a static server from the project root:

```bash
# Included Express server (recommended)
npm install
npm start                      # → http://localhost:3025

# …or any static server, e.g. Python
python3 -m http.server 5173
```

Then open **http://localhost:3025/** and press any button on your controller.
(Examples below use port `5173`; adjust to whatever you run.)

Useful URL flags:

| Flag         | What it does                                                        |
|--------------|--------------------------------------------------------------------|
| `?skin=<id>` | Which skin to load — `pure`, `hybrid` (default `pure`). More via local skins. |
| `?p=0..3`    | Which controller slot to show (default `0`).                       |
| `?deadzone=` | Stick deadzone radius, `0`–`1` (default `0.12`).                    |
| `?bg=1`      | Paint a checkerboard so you can see the transparent stage in a browser. |
| `?demo=1`    | **No controller needed** — animate a fake pad to preview a skin.    |
| `?demo=2`    | **No controller needed** — hold every input at once (an "all lit" frame for checking sprite alignment). |

Preview a skin right now, no hardware:
**http://localhost:5173/?skin=pure&demo=1&bg=1**

---

## Switching skins

Open **`selector.html`** for a visual picker with live previews. Pick a skin and
it hands you the overlay URL (e.g. `index.html?skin=pure`) to drop into OBS.

> ⚠️ Put the **overlay** (`index.html?skin=…`) in OBS — **not** `selector.html`.
> The selector is just a launcher.

Skins are driven by the same engine. Nine ship in this repo (seven share the
sprite style):

| id           | Type    | What it is                                                       |
|--------------|---------|------------------------------------------------------------------|
| `pure`       | css     | Body + controls drawn 100% in CSS, no image files (900×640).     |
| `hybrid-svg` | hybrid  | SVG body + the shared **CSS** control kit (900×640).             |
| `valhalla`   | sprites | Custom body + the shared **PNG sprite** kit (900×800).           |
| `silksong`   | sprites | Hollow Knight: Silksong body + the shared **PNG sprite** kit (900×800). |
| `halo`       | sprites | Halo · Master Chief body + the shared **PNG sprite** kit (900×800). |
| `mirage`     | sprites | Assassin's Creed Mirage body + the shared **PNG sprite** kit (900×800). |
| `odyssey`    | sprites | Assassin's Creed Odyssey body + the shared **PNG sprite** kit (900×800). |
| `black-ice`  | sprites | AC/DC Black Ice body + the shared **PNG sprite** kit (900×800). |
| `72-seasons` | sprites | Metallica 72 Seasons body + the shared **PNG sprite** kit (900×800). |

The registry lives in **`src/skins.js`** — add an entry and it appears in the
selector automatically. Extra **local-only** skins (e.g. ones built on
third-party art) can be registered in a git-ignored `src/skins.local.js` without
touching the repo — see [Local-only skins](#local-only-skins-optional).

---

## Add it to OBS

1. **Sources → + → Browser**.
2. Point it at your local URL (e.g. `http://localhost:5173/`) — or check
   **Local file** and select `index.html`.
3. Set the size to match your skin's canvas (shown in `selector.html`) — e.g.
   **900×640** for `pure` / `hybrid-svg`, **900×800** for `valhalla`.
4. Leave the background transparent (the overlay already renders see-through).
5. Press a button on your controller to wake the Gamepad API.

> Tip: keep the static server running (or use OBS's *Local file* mode) so the
> overlay is available whenever you stream.

---

## Production (Express + PM2)

The repo ships a tiny Express server (`server.js`) and a PM2 config
(`ecosystem.config.js`). **Local dev runs on `3025`; production on `3050`.**

```bash
npm install                       # first time only
pm2 start ecosystem.config.js     # starts "gamepad-overlay" on port 3050
pm2 save                          # remember it across restarts
pm2 startup                       # (optional) run PM2 on server boot

pm2 logs gamepad-overlay          # tail logs
pm2 restart gamepad-overlay       # after a git pull
```

Then point OBS at `http://<your-server>:3050/?skin=<id>`. Put it behind a reverse
proxy (nginx/Caddy) if you want a domain or HTTPS. Health check: `GET /healthz`.

- Change the port without editing files: `PORT=8080 pm2 start ecosystem.config.js`.
- `node_modules/` and `src/skins.local.js` stay out of git — run `npm install` on
  the server, and only the repo's public skins ship.

---

## How it works

Three moving parts, cleanly separated:

- **`index.html`** — the controller markup. Just semantic, artwork-free elements
  tagged with `data-input` (`a`, `dpad-up`, `trigger-left`, …).
- **`src/engine.js`** — polls the Gamepad API each frame and emits a tiny, stable
  set of signals onto those elements.
- **`src/skins.js` + `src/skin-loader.js`** — the registry and the loader that
  reads `?skin=<id>` and injects that skin's stylesheet + root classes.
- **`skins/<name>/`** — the artwork. Reacts to the engine's signals; owns 100% of
  the appearance. Two reusable control kits let a skin supply *only its body*:
  `skins/_shared/controls.css` (CSS-drawn controls) and `skins/_shared/sprites.css`
  (PNG sprite controls, backed by `skins/_shared_sprites/`).

### The engine → skin contract

| Input type                         | Signal the engine emits                              |
|------------------------------------|------------------------------------------------------|
| Digital (buttons, d-pad, bumpers, back/start/guide, L3/R3) | toggles the `.pressed` class          |
| Analog triggers (LT / RT)          | `--value` custom property, `0` → `1` (+ `.pressed`)  |
| Analog sticks (left / right)       | `--x` / `--y` custom properties, `−1` → `1`          |

A skin never touches the Gamepad API — it just styles those three signals.

---

## Authoring a new skin

Pick the build style that fits, then register it. The first three usually mean
you only draw/supply a **body** — the controls come from a shared kit:

1. **Pure CSS** (`type: css`) — copy `skins/pure/`. Draw the body with CSS
   (`clip-path`, gradients) and `@import "../_shared/controls.css"`. No images.
2. **Hybrid + CSS controls** (`type: hybrid`) — copy `skins/hybrid-svg/`. Supply
   an image body (SVG/PNG) and `@import "../_shared/controls.css"`.
3. **Hybrid + sprite controls** (`type: sprites`) — copy `skins/valhalla/`.
   Supply an image body and `@import "../_shared/sprites.css"` (which draws the
   shared PNG sprites from `skins/_shared_sprites/`). Best when you want
   photoreal buttons and your body shares the standard Xbox well layout.
4. **Full skin** (`type: full`) — own body *and* its own per-button sprites in a
   local `art/` folder. Most control, heaviest to build; best for one-off
   photoreal skins (see `skins/xbox-sx-black/`, kept local). Keep it local if the
   art isn't yours to share.

However you draw it, react to the same three signals:
- `.pressed` → the "lit" look of each digital element,
- `opacity: var(--value)` (or clip/scale) → fill triggers proportionally,
- `translate(calc(var(--x) * Npx), calc(var(--y) * Npx))` → move sticks.

Finally, add an entry to **`src/skins.js`** (id, css path, root classes, canvas
size). It appears in `selector.html` automatically. The markup is shared, so any
skin works with the same engine.

---

## Local-only skins (optional)

Want a skin you can't (or don't want to) commit — e.g. one built on a streamer's
photorealistic art that's licensed for streaming but **not** redistribution?
Keep it entirely on your machine:

1. Put its folder under `skins/<name>/` and git-ignore it.
2. Register it in a git-ignored **`src/skins.local.js`**, which merges into the
   registry right after `src/skins.js`. It then shows up in the selector on your
   machine but never lands in git.

The **engine** and the included `pure` / `hybrid` skins are fully original and
yours to share. Anything built on someone else's art stays on your disk and
under their terms.

---

## Roadmap

- [x] Live skin switcher (`?skin=` + `selector.html`).
- [ ] More original skins (retro, other layouts…).
- [ ] Optional per-controller remapping for non-standard pads.
