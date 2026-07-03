/*
 * engine.js — the skin-agnostic gamepad engine.
 *
 * Responsibility: read the physical controller via the browser Gamepad API and
 * translate it into a tiny, stable set of DOM signals. It never knows what a
 * controller *looks* like — that is 100% the skin's job.
 *
 * ── The contract between engine and skin ────────────────────────────────────
 * For every interactive element (identified by `data-input`), the engine emits:
 *
 *   • Digital inputs (buttons, d-pad, bumpers, back/start/meta, L3/R3):
 *         toggles the `.pressed` class.
 *
 *   • Analog triggers (LT / RT):
 *         toggles `.pressed` past a threshold AND sets `--value` (0 → 1),
 *         so a skin can "fill" the trigger proportionally.
 *
 *   • Analog sticks (left / right):
 *         sets `--x` and `--y` (each −1 → 1, after deadzone) and toggles
 *         `.pressed` when the stick is clicked in (L3 / R3).
 *
 * A skin decides how far a stick travels, how a trigger fills, and what
 * "pressed" looks like — the engine only reports normalized intent.
 *
 * ── Query parameters ────────────────────────────────────────────────────────
 *   ?p=0..3        which controller slot to display (default 0)
 *   ?deadzone=0.1  stick deadzone radius, 0 → 1 (default 0.12)
 *   ?bg=1          paint a dev checkerboard so you can see the transparent stage
 *   ?demo=1        drive a synthetic controller (no hardware needed) to preview
 *                  a skin — cycles buttons, pulses triggers, rotates sticks
 */

(function () {
    "use strict";

    // ── Standard Gamepad mapping ────────────────────────────────────────────
    // Maps the browser's "standard" button layout to our data-input names.
    // See: https://w3c.github.io/gamepad/#remapping
    var BUTTON_MAP = {
        0: "a",
        1: "b",
        2: "x",
        3: "y",
        4: "bumper-left",
        5: "bumper-right",
        6: "trigger-left",   // analog
        7: "trigger-right",  // analog
        8: "back",
        9: "start",
        10: "stick-left",    // L3 press
        11: "stick-right",   // R3 press
        12: "dpad-up",
        13: "dpad-down",
        14: "dpad-left",
        15: "dpad-right",
        16: "meta"
    };

    // Buttons that are analog triggers get special (fill) handling.
    var TRIGGERS = { 6: "trigger-left", 7: "trigger-right" };

    // Stick axis pairs: element name → [horizontalAxis, verticalAxis].
    var STICKS = {
        "stick-left": [0, 1],
        "stick-right": [2, 3]
    };

    // A digital button counts as "pressed" past this analog value. Real buttons
    // report exactly 0 or 1, but triggers/analog buttons ramp — this debounces.
    var PRESS_THRESHOLD = 0.15;

    // ── Read config from the URL ────────────────────────────────────────────
    var params = new URLSearchParams(window.location.search);
    var PLAYER = clamp(parseInt(params.get("p"), 10) || 0, 0, 3);
    var DEADZONE = clampFloat(parseFloat(params.get("deadzone")), 0, 0.9, 0.12);
    var DEMO = params.get("demo") === "1";
    var frame = 0; // synthetic-time counter for demo mode

    if (params.get("bg") === "1") {
        document.body.classList.add("show-bg");
    }

    // ── Cache the DOM once ──────────────────────────────────────────────────
    var root = document.getElementById("gamepad");
    var elements = {}; // data-input → HTMLElement
    root.querySelectorAll("[data-input]").forEach(function (el) {
        elements[el.getAttribute("data-input")] = el;
    });

    var connected = false;

    // ── Connection lifecycle ────────────────────────────────────────────────
    // The Gamepad API only exposes a controller after the user presses a button
    // (a privacy/anti-fingerprint gate), so we both listen for the event and
    // keep polling for the slot to become live.
    window.addEventListener("gamepadconnected", function (e) {
        if (e.gamepad.index === PLAYER) setConnected(true);
    });
    window.addEventListener("gamepaddisconnected", function (e) {
        if (e.gamepad.index === PLAYER) setConnected(false);
    });

    function setConnected(state) {
        if (connected === state) return;
        connected = state;
        root.classList.toggle("disconnected", !state);
    }

    // ── The main loop ───────────────────────────────────────────────────────
    function loop() {
        var pad;
        if (DEMO) {
            pad = syntheticPad(frame++);
        } else {
            var pads = navigator.getGamepads ? navigator.getGamepads() : [];
            pad = pads[PLAYER];
        }

        if (pad && pad.connected) {
            setConnected(true);
            render(pad);
        } else {
            setConnected(false);
        }

        window.requestAnimationFrame(loop);
    }

    // ── Demo mode: a fake controller that exercises every input ─────────────
    // Lets you preview a skin (or drop it into OBS as a screensaver) without any
    // hardware. Deterministic — driven purely by the frame counter.
    function syntheticPad(f) {
        var buttons = [];
        var lit = Math.floor(f / 32) % 17; // spotlight one digital input at a time
        for (var i = 0; i < 17; i++) {
            var on = i === lit ? 1 : 0;
            buttons.push({ pressed: on > 0.5, value: on });
        }
        // Triggers breathe independently of the spotlight.
        var tl = (Math.sin(f / 22) + 1) / 2;
        var tr = (Math.sin(f / 22 + Math.PI) + 1) / 2;
        buttons[6] = { pressed: tl > 0.15, value: tl };
        buttons[7] = { pressed: tr > 0.15, value: tr };
        // Sticks trace opposing circles.
        var a = f / 18;
        var axes = [
            Math.cos(a), Math.sin(a),
            Math.cos(a + Math.PI), Math.sin(a + Math.PI)
        ];
        return { connected: true, buttons: buttons, axes: axes };
    }

    // ── Translate one gamepad snapshot into DOM signals ─────────────────────
    function render(pad) {
        // Digital buttons + analog triggers.
        for (var i = 0; i < pad.buttons.length; i++) {
            var name = BUTTON_MAP[i];
            if (!name) continue;
            var el = elements[name];
            if (!el) continue;

            var btn = pad.buttons[i];
            var value = typeof btn === "object" ? btn.value : btn;
            var isDown = typeof btn === "object" ? btn.pressed : btn > PRESS_THRESHOLD;

            if (TRIGGERS[i]) {
                // Analog trigger: expose the continuous fill and a boolean.
                el.style.setProperty("--value", value.toFixed(3));
                el.classList.toggle("pressed", value > PRESS_THRESHOLD);
            } else {
                el.classList.toggle("pressed", isDown || value > PRESS_THRESHOLD);
            }
        }

        // Analog sticks: apply a radial deadzone, then publish normalized offset.
        for (var stickName in STICKS) {
            var el2 = elements[stickName];
            if (!el2) continue;

            var axes = STICKS[stickName];
            var x = pad.axes[axes[0]] || 0;
            var y = pad.axes[axes[1]] || 0;

            var magnitude = Math.sqrt(x * x + y * y);
            if (magnitude < DEADZONE) {
                x = 0;
                y = 0;
            }

            el2.style.setProperty("--x", x.toFixed(3));
            el2.style.setProperty("--y", y.toFixed(3));
        }
    }

    // ── Utils ───────────────────────────────────────────────────────────────
    function clamp(n, lo, hi) {
        return Math.max(lo, Math.min(hi, n));
    }
    function clampFloat(n, lo, hi, fallback) {
        if (isNaN(n)) return fallback;
        return Math.max(lo, Math.min(hi, n));
    }

    // Kick it off.
    window.requestAnimationFrame(loop);
})();
