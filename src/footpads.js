/**
 * Foot pad client — connects to ESP32 WebSocket SoftAP.
 *
 * Pad map (default):
 *   0,1 → player "a" (Bunny Blue)
 *   2,3 → player "l" (Bunny Dash)
 *
 * Override WS URL: ?pads=ws://192.168.4.1:81
 * Or localStorage.setItem("gamebox_ws", "ws://...")
 */

const DEFAULT_WS = "ws://192.168.4.1:81";

const PAD_TO_KEY = {
  0: "a",
  1: "a",
  2: "l",
  3: "l",
};

export function createFootPadClient({ onDown, onUp, onStatus }) {
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
    return DEFAULT_WS;
  }

  function setStatus(status, detail = "") {
    onStatus?.({ status, detail, url });
  }

  function connect() {
    intentionalClose = false;
    url = resolveUrl();

    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      socket = null;
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
    try {
      localStorage.setItem("gamebox_ws", next);
    } catch {
      /* ignore */
    }
    url = next;
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
