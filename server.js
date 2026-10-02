/**
 * GAME BOX — production server
 *
 * Serves the Vite build and relays ESP32 pad events to browsers:
 *   ESP32  POST https://your-app.onrender.com/api/pad  →  browsers on /ws
 *   ESP32  POST https://your-app.onrender.com/api/log  →  server + browser logs
 */
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, "dist");

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));

/** @type {Set<import('ws').WebSocket>} */
const browsers = new Set();

function broadcast(obj) {
  const msg = typeof obj === "string" ? obj : JSON.stringify(obj);
  for (const ws of browsers) {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
      } catch {
        /* ignore */
      }
    }
  }
}

function normalizePad(body) {
  if (!body || typeof body !== "object") return null;
  const t = body.t;
  if (t !== "down" && t !== "up") return null;
  const pad = Number(body.pad);
  if (!Number.isInteger(pad) || pad < 0 || pad > 3) return null;
  return { t, pad };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "game-box",
    browsers: browsers.size,
    uptime: Math.round(process.uptime()),
  });
});

/** ESP32 → cloud: pad press/release */
app.post("/api/pad", (req, res) => {
  const event = normalizePad(req.body);
  if (!event) {
    res.status(400).json({ ok: false, error: "expected { t:'down'|'up', pad:0..3 }" });
    return;
  }
  broadcast(event);
  console.log(`[pad] ${event.t} pad=${event.pad} browsers=${browsers.size}`);
  res.json({ ok: true, browsers: browsers.size });
});

/** ESP32 → cloud: optional debug logs */
app.post("/api/log", (req, res) => {
  const payload = req.body && typeof req.body === "object" ? req.body : { msg: String(req.body) };
  console.log("[esp32-log]", payload);
  broadcast({ t: "log", ...payload });
  res.json({ ok: true });
});

/** Browser can also inject a pad event (debug) */
app.options("/api/pad", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path === "/ws") return next();
    res.sendFile(path.join(distDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
} else {
  app.get("/", (_req, res) => {
    res
      .status(503)
      .type("text")
      .send("dist/ missing — run npm run build first (or use Vite + npm run server for API only).");
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  browsers.add(ws);
  console.log(`[ws] browser connected (${browsers.size})`);
  try {
    ws.send(JSON.stringify({ t: "hello", device: "gamebox-server", pads: 4 }));
  } catch {
    /* ignore */
  }
  ws.on("close", () => {
    browsers.delete(ws);
    console.log(`[ws] browser disconnected (${browsers.size})`);
  });
  ws.on("error", () => {
    browsers.delete(ws);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`GAME BOX listening on :${PORT}`);
  console.log(`  health  GET  /api/health`);
  console.log(`  pads    POST /api/pad   { "t":"down"|"up", "pad":0..3 }`);
  console.log(`  logs    POST /api/log`);
  console.log(`  browser WS   /ws`);
});
