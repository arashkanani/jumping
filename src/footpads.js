/**
 * Foot pad client — browsers connect to the GAME BOX cloud relay (/ws).
 * ESP32 posts to the same app: POST /api/pad  →  relay broadcasts on /ws
 *
 * Default: same-origin  ws(s)://<host>/ws
 * Override: ?pads=wss://…/ws
 */

const STORAGE_KEY = "gamebox_relay_ws";
/** Old key from SoftAP / local-IP era — cleared on load */
const LEGACY_STORAGE_KEY = "gamebox_ws";

const PAD_TO_KEY = {
  0: "a",
  1: "s",
  2: "k",
  3: "l",
};

function defaultRelayUrl() {
  if (typeof location === "undefined") return "";
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws`;
}

/** Local ESP32 SoftAP / LAN URLs cannot be used from a public Render page */
function isObsoleteLanUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.trim().toLowerCase();
  if (!u.startsWith("ws://") && !u.startsWith("wss://")) return false;
  return (
    /192\.168\.\d+\.\d+/.test(u) ||
    /10\.\d+\.\d+\.\d+/.test(u) ||
    /172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+/.test(u) ||
    u.includes("192.168.4.1") ||
    /:81(\/|$)/.test(u)
  );
}

function clearLegacyStorage() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isObsoleteLanUrl(stored)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function createFootPadClient({ onDown, onUp, onStatus, onLog }) {
  clearLegacyStorage();

  let socket = null;
  let reconnectTimer = null;
  let intentionalClose = false;
  let url = resolveUrl();

  function resolveUrl() {
    const q = new URLSearchParams(window.location.search).get("pads");
    if (q && !isObsoleteLanUrl(q)) return q;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && !isObsoleteLanUrl(stored)) return stored;
    } catch {
      /* ignore */
    }
    return defaultRelayUrl();
  }

  function setStatus(status, detail = "") {
    onStatus?.({ status, detail, url });
  }

  function connect() {
    intentionalClose = false;
    url = resolveUrl();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      socket = null;
    }

    if (!url) {
      setStatus("disconnected", "no relay URL");
      return;
    }

    // Never try LAN SoftAP from a hosted page
    if (isObsoleteLanUrl(url)) {
      url = defaultRelayUrl();
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }

    setStatus("connecting", url);

    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setStatus("error", String(err?.message || err));
      scheduleReconnect();
      return;
    }

    socket = ws;

    ws.onopen = () => {
      setStatus("connected", "cloud relay");
      try {
        ws.send(JSON.stringify({ t: "hello", client: "gamebox-web" }));
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      socket = null;
      if (!intentionalClose) {
        setStatus("disconnected", "retrying…");
        scheduleReconnect();
      } else {
        setStatus("disconnected", "");
      }
    };

    ws.onerror = () => {
      setStatus("error", "socket error");
    };

    ws.onmessage = (ev) => {
      let data;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!data || typeof data.t !== "string") return;

      if (data.t === "hello") {
        setStatus("connected", data.device || "cloud relay");
        return;
      }

      if (data.t === "log") {
        onLog?.(data);
        return;
      }

      if (data.t === "down" || data.t === "up") {
        const pad = Number(data.pad);
        const key = PAD_TO_KEY[pad];
        if (!key) return;
        if (data.t === "down") onDown?.(key, pad);
        else onUp?.(key, pad);
      }
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2000);
  }

  function disconnect() {
    intentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
    setStatus("disconnected", "");
  }

  function setUrl(next) {
    let cleaned = (next || "").trim();
    if (!cleaned || isObsoleteLanUrl(cleaned)) {
      cleaned = "";
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      url = defaultRelayUrl();
      connect();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    url = cleaned;
    connect();
  }

  function resetToCloud() {
    setUrl("");
  }

  connect();

  return {
    connect,
    disconnect,
    setUrl,
    resetToCloud,
    getUrl: () => url,
    defaultUrl: defaultRelayUrl,
  };
}
