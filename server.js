/*
 * server.js — a tiny static server for the overlay.
 *
 * Serves the project's files over HTTP (the Gamepad API needs http://, not
 * file://). Point OBS at http://<host>:<port>/?skin=<id>.
 *
 * Local:       npm start           (or: node server.js)
 * Production:  pm2 start ecosystem.config.js   (see README)
 *
 * Configurable via env: PORT (default 3025 for local), HOST (default 0.0.0.0).
 * In production the PM2 ecosystem file sets PORT=3050.
 */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3025;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;

// Serve the overlay. `dotfiles: "ignore"` keeps .git/.gitignore private; HTML is
// sent with no-cache so skin-list changes show up without a hard refresh, while
// images/CSS/JS keep a short cache for OBS performance.
app.use(
    express.static(ROOT, {
        dotfiles: "ignore",
        extensions: ["html"],
        setHeaders(res, filePath) {
            res.setHeader(
                "Cache-Control",
                filePath.endsWith(".html") ? "no-cache" : "public, max-age=3600"
            );
        },
    })
);

// Health check for PM2 / uptime monitors.
app.get("/healthz", (_req, res) => res.type("text").send("ok"));

app.listen(PORT, HOST, () => {
    console.log(`🎮 Gamepad overlay running at http://${HOST}:${PORT}`);
    console.log(`   Overlay:  http://localhost:${PORT}/?skin=valhalla`);
    console.log(`   Picker:   http://localhost:${PORT}/selector.html`);
});
