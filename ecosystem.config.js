/*
 * PM2 process config — production runs on port 3050.
 * (Local dev via `npm start` uses 3025; see server.js.)
 *
 * Start in production with:
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup   # (optional) restart on server reboot
 *
 * Override the port without editing this file:  PORT=8080 pm2 start ecosystem.config.js
 */
module.exports = {
    apps: [
        {
            name: "gamepad-overlay",
            script: "server.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            max_memory_restart: "150M",
            env: {
                NODE_ENV: "production",
                PORT: process.env.PORT || 3050,
                HOST: process.env.HOST || "0.0.0.0",
            },
        },
    ],
};
