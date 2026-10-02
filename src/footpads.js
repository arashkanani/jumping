/**
 * Foot pad client — connects to ESP32 WebSocket.
 *
 * Pad map (default):
 *   0 → player "a" (Cyan)
 *   1 → player "s" (Lime)
 *   2 → player "k" (Violet)
 *   3 → player "l" (Pink)
 *
 * Override WS URL: ?pads=ws://192.168.x.x:81
 * Or localStorage / UI Connect box.
 *
 * Note: HTTPS deploys (e.g. Render) block insecure ws:// (mixed content).
 * Use keyboard online, or connect pads from a local/http game session.
 */

const LOCAL_DEFAULT_WS = "ws://192.168.4.1:81";

const PAD_TO_KEY = {
  0: "a",
  1: "s",
  2: "k",
  3: "l",
};

function isSecurePage() {
  return typeof location !== "undefined" && location.protocol === "https:";
}

function isInsecureWs(url) {
  return typeof url === "string" && url.trim().toLowerCase().startsWith("ws:");
}

export function createFootPadClient({ onDown, onUp, onStatus }) {
  let socket = null;
  let reconnectTimer = null;
  let intentionalClose = false;
  let url = resolveUrl();
  let autoConnect = shouldAutoConnect(url);

  function resolveUrl() {
    const q = new URLSearchParams(window.location.search).get("pads");
    if (q) return q;
    try {
      const stored = localStorage.getItem("gamebox_ws");
      if (stored) return stored;
    } catch {
      /* ignore */
    }
    // SoftAP default only on local/http — never force it on HTTPS deploys
    return isSecurePage() ? "" : LOCAL_DEFAULT_WS;
  }

  function shouldAutoConnect(nextUrl) {
    if (!nextUrl) return false;
    if (isSecurePage() && isInsecureWs(nextUrl)) return false;
    return true;
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
      setStatus("disconnected", "set ESP32 WS URL to connect pads");
      return;
    }

    if (isSecurePage() && isInsecureWs(url)) {
      setStatus(
        "error",
        "HTTPS pages cannot use ws:// — play with keyboard, or open the game over http on the same LAN as the ESP32"
      );
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
        setStatus("connected", `ESP32 · ${data.pads ?? 4} pads`);
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
    if (isSecurePage() && isInsecureWs(url)) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, 2500);
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
    url = cleaned;
    autoConnect = shouldAutoConnect(url);
    if (autoConnect) connect();
    else {
      disconnect();
      if (cleaned && isSecurePage() && isInsecureWs(cleaned)) {
        setStatus(
          "error",
          "HTTPS pages cannot use ws:// — need wss:// or a local http game"
        );
      } else {
        setStatus("disconnected", cleaned ? "" : "set ESP32 WS URL to connect pads");
      }
    }
  }

  if (autoConnect) connect();
  else {
    setStatus(
      "disconnected",
      isSecurePage()
        ? "keyboard ready · pads need local/http or wss://"
        : "set ESP32 WS URL to connect pads"
    );
  }

  return {
    connect,
    disconnect,
    setUrl,
    getUrl: () => url,
  };
}
