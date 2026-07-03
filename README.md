# OBS Gamepad Overlay

A lightweight, skin-able controller overlay for OBS. It reads your physical
gamepad through the browser's **Gamepad API** and lights up the on-screen buttons
in real time — a self-hosted, from-scratch take on the idea popularized by
gamepadviewer.com.

- **Zero build, zero dependencies.** Plain HTML/CSS/JS. Drop it into an OBS
  Browser Source and you're done.
- **Skin-agnostic engine.** The engine only reports *what you pressed*; a skin
  decides *how it looks*. Switch skins with `?skin=<id>` or the visual picker.
- **Two skins included, one engine.** `pure` (drawn 100% in CSS) and `hybrid`
  (an image body + shared CSS controls) — see [Switching skins](#switching-skins).
  Build your own the same way.
- **Local-only skins, too.** Add private, git-ignored skins (e.g. ones built on
  a streamer's art you can't redistribute) without touching the public repo —
  see [Local-only skins](#local-only-skins-optional).

---

## Quick start (local)

The Gamepad API requires the page to be served over `http://` (not opened as a
`file://`), so run any static server from the project root:

```bash
# Python (already on most machines)
python3 -m http.server 5173
```

Then open **http://localhost:5173/** and press any button on your controller.

Useful URL flags:

| Flag         | What it does                                                        |
|--------------|--------------------------------------------------------------------|
| `?skin=<id>` | Which skin to load — `pure`, `hybrid` (default `pure`). More via local skins. |
| `?p=0..3`    | Which controller slot to show (default `0`).                       |
| `?deadzone=` | Stick deadzone radius, `0`–`1` (default `0.12`).                    |
| `?bg=1`      | Paint a checkerboard so you can see the transparent stage in a browser. |
| `?demo=1`    | **No controller needed** — animate a fake pad to preview a skin.    |

Preview a skin right now, no hardware:
**http://localhost:5173/?skin=pure&demo=1&bg=1**

---

## Switching skins

Open **`selector.html`** for a visual picker with live previews. Pick a skin and
it hands you the overlay URL (e.g. `index.html?skin=pure`) to drop into OBS.

> ⚠️ Put the **overlay** (`index.html?skin=…`) in OBS — **not** `selector.html`.
> The selector is just a launcher.

Skins are driven by the same engine. Two ship in this repo:

| id       | Type   | What it is                                                     |
|----------|--------|----------------------------------------------------------------|
| `pure`   | CSS    | Drawn 100% in CSS — body via `clip-path`, no image files (900×640). |
| `hybrid` | hybrid | An image body (one SVG) + shared CSS-drawn controls (900×640). |

The registry lives in **`src/skins.js`** — add an entry and it appears in the
selector automatically. Extra **local-only** skins (e.g. photorealistic ones
built on third-party art) can be registered in a git-ignored `src/skins.local.js`
without touching the repo — see [Local-only skins](#local-only-skins-optional).

---

## Add it to OBS

1. **Sources → + → Browser**.
2. Point it at your local URL (e.g. `http://localhost:5173/`) — or check
   **Local file** and select `index.html`.
3. Set the size to match your skin's canvas (shown in `selector.html`) — e.g.
   **900×640** for `pure` / `hybrid`.
4. Leave the background transparent (the overlay already renders see-through).
5. Press a button on your controller to wake the Gamepad API.

> Tip: keep the static server running (or use OBS's *Local file* mode) so the
> overlay is available whenever you stream.

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
  the appearance. `skins/_shared/controls.css` is a reusable CSS control kit.

### The engine → skin contract

| Input type                         | Signal the engine emits                              |
|------------------------------------|------------------------------------------------------|
| Digital (buttons, d-pad, bumpers, back/start/guide, L3/R3) | toggles the `.pressed` class          |
| Analog triggers (LT / RT)          | `--value` custom property, `0` → `1` (+ `.pressed`)  |
| Analog sticks (left / right)       | `--x` / `--y` custom properties, `−1` → `1`          |

A skin never touches the Gamepad API — it just styles those three signals.

---

## Authoring a new skin

Pick the flavor that fits, then register it:

- **Pure CSS** — copy `skins/pure/`. Draw the body with CSS (`clip-path`,
  gradients) and `@import` the shared controls. No image files, fully yours.
- **Hybrid** — copy `skins/hybrid/`. Supply an image body (SVG/PNG) and reuse
  the shared controls. *This is usually all you need — only the body changes.*
- **Photo (sprites)** — full-canvas sprite layers swapped/revealed per state.
  Best for photorealism; heaviest to build. Keep these local if the art isn't
  yours to share (see below).

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
