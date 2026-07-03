/*
 * skins.js — the skin registry (public skins).
 *
 * The single source of truth for which skins exist. Both the overlay
 * (skin-loader.js) and the picker (selector.html) read from here, so adding a
 * skin is a one-object change.
 *
 * Skins come in four build styles (the `type` field):
 *   css      pure CSS — body + controls all drawn in CSS, no images
 *   hybrid   image body + shared CSS controls   (../_shared/controls.css)
 *   sprites  image body + shared PNG sprites     (../_shared/sprites.css + _shared_sprites/)
 *   full     own body + its own button sprites   (best for photorealism)
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
 *   type    css | hybrid | sprites | full (info only)
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
        desc: "Body + controls drawn 100% in CSS — no image files.",
    },
    "hybrid-svg": {
        name: "Slate · SVG + shared CSS",
        css: "skins/hybrid-svg/skin.css",
        root: "hybrid-svg",
        width: 900,
        height: 640,
        type: "hybrid",
        desc: "SVG body + the shared CSS control kit (_shared/controls.css).",
    },
    valhalla: {
        name: "Valhalla",
        css: "skins/valhalla/skin.css",
        root: "valhalla",
        width: 900,
        height: 800,
        type: "sprites",
        desc: "Custom body + the shared PNG sprite kit (_shared/sprites.css).",
    },
};

// Loaded when ?skin= is missing or unknown.
window.DEFAULT_SKIN = "pure";
