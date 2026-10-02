/**
 * GAME BOX — production server
 *
 * Serves the Vite build and relays pad events to browsers.
 *
 * Preferred (low latency):
 *   ESP32 ──WSS──► /ws ──broadcast──► browsers
 *
 * Fallback:
 *   ESP32  POST /api/pad  →  browsers on /ws
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
const clients = new Set();

function broadcast(obj, except = null) {
  const msg = typeof obj === "string" ? obj : JSON.stringify(obj);
  for (const ws of clients) {
    if (ws === except) continue;
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

function handleIncoming(raw, fromWs = null) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== "object") return false;

  const event = normalizePad(data);
  if (event) {
    broadcast(event, null);
    console.log(`[pad] ${event.t} pad=${event.pad} clients=${clients.size}`);
    return true;
  }

  if (data.t === "log") {
    console.log("[esp32-log]", data);
    broadcast({ t: "log", ...data }, fromWs);
    return true;
  }

  if (data.t === "hello") {
    return true;
  }

  return false;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "game-box",
    clients: clients.size,
    uptime: Math.round(process.uptime()),
  });
});

/** HTTP fallback if WSS client is unavailable */
app.post("/api/pad", (req, res) => {
  if (!handleIncoming(req.body)) {
    res.status(400).json({ ok: false, error: "expected { t:'down'|'up', pad:0..3 }" });
    return;
  }
  res.json({ ok: true, clients: clients.size });
});

app.post("/api/log", (req, res) => {
  const payload = req.body && typeof req.body === "object" ? req.body : { msg: String(req.body) };
  handleIncoming({ t: "log", ...payload });
  res.json({ ok: true });
});

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
  clients.add(ws);
  console.log(`[ws] client connected (${clients.size})`);
  try {
    ws.send(JSON.stringify({ t: "hello", device: "gamebox-server", pads: 4 }));
  } catch {
    /* ignore */
  }

  ws.on("message", (data) => {
    const text = typeof data === "string" ? data : data.toString();
    handleIncoming(text, ws);
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[ws] client disconnected (${clients.size})`);
  });

  ws.on("error", () => {
    clients.delete(ws);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`GAME BOX listening on :${PORT}`);
  console.log(`  health  GET  /api/health`);
  console.log(`  pads    POST /api/pad   (fallback)`);
  console.log(`  logs    POST /api/log`);
  console.log(`  relay   WS   /ws   (ESP32 + browsers)`);
});
