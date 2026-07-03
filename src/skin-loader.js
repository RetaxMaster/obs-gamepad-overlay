/*
 * skin-loader.js — pick the skin from the URL and wire it up.
 *
 * Runs in <head>, before the body paints, so there's no flash of the wrong
 * skin. Reads ?skin=<id>, looks it up in the registry (skins.js), injects the
 * skin's stylesheet, and — once the controller element exists — tags it with
 * the skin's root classes so the right rules apply.
 *
 * The engine never learns which skin is active; it just toggles state on the
 * shared markup. That's what lets one overlay serve photo, CSS, and hybrid
 * skins interchangeably.
 */
(function () {
    "use strict";

    var params = new URLSearchParams(window.location.search);
    var id = params.get("skin");
    var skin = (window.SKINS && window.SKINS[id]) ||
        (window.SKINS && window.SKINS[window.DEFAULT_SKIN]);

    if (!skin) return; // registry missing; nothing to do

    // 1) Load the skin's stylesheet as early as possible.
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = skin.css;
    link.id = "skin";
    document.head.appendChild(link);

    // 2) Tag the controller with the skin's root classes once it exists.
    function applyRoot() {
        var el = document.getElementById("gamepad");
        if (!el) return false;
        skin.root.split(/\s+/).forEach(function (c) {
            if (c) el.classList.add(c);
        });
        document.title = "Gamepad Overlay — " + skin.name;
        return true;
    }

    if (!applyRoot()) {
        document.addEventListener("DOMContentLoaded", applyRoot);
    }

    // Expose the active skin for anything that wants it (e.g. debugging).
    window.ACTIVE_SKIN = skin;
})();
