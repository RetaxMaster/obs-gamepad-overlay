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
 *
 * Only the overlay's web assets are served (index/selector + skins/src/styles).
 * Server internals (server.js, package.json, node_modules, docs, …) are NOT
 * exposed.
 */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3025;
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = __dirname;

// HTML entry points — sent with no-cache so skin-list changes show up without a
// hard refresh.
function sendHtml(res, file) {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(ROOT, file));
}
app.get(["/", "/index.html"], (_req, res) => sendHtml(res, "index.html"));
app.get("/selector.html", (_req, res) => sendHtml(res, "selector.html"));

// Static asset directories only. Anything outside these (server.js,
// package.json, node_modules, docs, …) falls through to a 404.
const assetOptions = {
    dotfiles: "ignore",
    setHeaders(res) {
        res.setHeader("Cache-Control", "public, max-age=3600");
    },
};
for (const dir of ["skins", "src", "styles"]) {
    app.use(`/${dir}`, express.static(path.join(ROOT, dir), assetOptions));
}

// Health check for PM2 / uptime monitors.
app.get("/healthz", (_req, res) => res.type("text").send("ok"));

app.listen(PORT, HOST, () => {
    console.log(`🎮 Gamepad overlay running at http://${HOST}:${PORT}`);
    console.log(`   Overlay:  http://localhost:${PORT}/?skin=valhalla`);
    console.log(`   Picker:   http://localhost:${PORT}/selector.html`);
});
