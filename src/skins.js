/*
 * skins.js — the skin registry (public skins).
 *
 * The single source of truth for which skins exist. Both the overlay
 * (skin-loader.js) and the picker (selector.html) read from here, so adding a
 * skin is a one-object change.
 *
 * Private/local-only skins (e.g. ones built on third-party art that can't be
 * redistributed) live in an optional, git-ignored `src/skins.local.js` that
 * merges into `window.SKINS` after this file. See the README.
 *
 * Each entry:
 *   css     path to the skin's stylesheet (relative to the project root)
 *   root    space-separated class tokens the skin's CSS targets; the loader
 *           adds them to the <div class="controller …"> so the right rules apply
 *   width   canvas width  (px) — set your OBS Browser Source to this
 *   height  canvas height (px)
 *   type    "photo" | "css" | "hybrid" — how the artwork is produced (info only)
 *   desc    one-line description shown in the picker
 */
window.SKINS = {
    pure: {
        name: "Graphite · Pure CSS",
        css: "skins/pure/skin.css",
        root: "pure",
        width: 900,
        height: 640,
        type: "css",
        desc: "Drawn 100% in CSS — body via clip-path, no image files.",
    },
    hybrid: {
        name: "Slate · Hybrid",
        css: "skins/hybrid/skin.css",
        root: "hybrid",
        width: 900,
        height: 640,
        type: "hybrid",
        desc: "Image body (one SVG) + shared CSS-drawn controls.",
    },
};

// Loaded when ?skin= is missing or unknown.
window.DEFAULT_SKIN = "pure";
