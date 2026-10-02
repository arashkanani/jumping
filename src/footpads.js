/**
 * Foot pad client — browsers connect to the GAME BOX relay (/ws).
 * ESP32 posts pad events to the same app: POST /api/pad
 *
 * Default: same-origin  ws(s)://<host>/ws
 * Override: ?pads=wss://other-host/ws  or UI / localStorage
 */

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

export function createFootPadClient({ onDown, onUp, onStatus, onLog }) {
  let socket = null;
  let reconnectTimer = null;
  let intentionalClose = false;
  let url = resolveUrl();

  function resolveUrl() {
    const q = new URLSearchParams(window.location.search).get("pads");
    if (q) return q;
    try {
      const stored = localStorage.getItem("gamebox_ws");
      if (stored) return stored;
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
      setStatus("connected", url);
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
        setStatus("connected", data.device || "relay");
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
    const cleaned = (next || "").trim();
    try {
      if (cleaned) localStorage.setItem("gamebox_ws", cleaned);
      else localStorage.removeItem("gamebox_ws");
    } catch {
      /* ignore */
    }
    url = cleaned || defaultRelayUrl();
    connect();
  }

  connect();

  return {
    connect,
    disconnect,
    setUrl,
    getUrl: () => url,
  };
}
