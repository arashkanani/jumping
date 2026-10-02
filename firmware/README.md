# GAME BOX — ESP32 Foot Pads → Cloud

## Architecture

```
[Foot switches] → ESP32 (WiFi STA)
                      │
                      │  HTTPS POST
                      ▼
              https://YOUR-APP.onrender.com
                      │
              /api/pad  →  relay
                      │
                      ▼
              browsers on /ws  →  jump!
```

Put your **Render app URL** in the ESP32 sketch (`GAME_URL`).  
No SoftAP, no local IP, no `ws://192.168.x.x`.

## Configure ESP32

1. Open `firmware/esp32_footpads/esp32_footpads.ino`
2. Set WiFi:
   ```cpp
   const char *WIFI_SSID = "YOUR_WIFI_SSID";
   const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";
   ```
3. Set deployed game (no trailing slash):
   ```cpp
   const char *GAME_URL = "https://jumping.onrender.com";
   ```
4. Flash ESP32 Dev Module (Arduino IDE). Serial 115200 should show `WiFi OK` then `[http] POST /api/pad → 200`.

## Wiring

| Pad | Player | GPIO |
|-----|--------|------|
| 0 | Cyan (A) | 32 |
| 1 | Lime (S) | 33 |
| 2 | Violet (K) | 25 |
| 3 | Pink (L) | 26 |

Each switch: one side → GPIO, other → **GND** (INPUT_PULLUP, pressed = LOW).

## Play

1. Deploy the game on Render (Node service: build `npm ci && npm run build`, start `npm start`).
2. Open `https://jumping.onrender.com` on phones/TV.
3. Power ESP32 on the same internet (home WiFi).
4. Stomp pads — events go to the cloud and into every open browser.

## Local dev

```bash
npm install
npm run server   # terminal 1 — API + /ws on :3000
npm run dev      # terminal 2 — Vite proxies /api and /ws
```

Point `GAME_URL` at a tunnel (e.g. Cloudflare Tunnel / ngrok) to `http://localhost:3000` if testing pads against your PC, or keep using the Render URL.

## API

```http
POST /api/pad
Content-Type: application/json

{"t":"down","pad":0}
{"t":"up","pad":0}
```

```http
POST /api/log
{"msg":"esp32-boot"}
```

```http
GET /api/health
```

Browsers: `wss://YOUR-APP.onrender.com/ws`
