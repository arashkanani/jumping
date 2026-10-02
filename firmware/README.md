# GAME BOX — ESP32 Foot Pads → Cloud (low latency)

## Architecture

```
[Foot switches] → ESP32 ──WSS (persistent)──► wss://YOUR-APP.onrender.com/ws
                                                    │
                                                    ▼
                                              all browsers
```

HTTPS POST per stomp was too slow. Pads now use a **persistent WebSocket**.

## Configure ESP32

1. Install library: **WebSockets** by Markus Sattler
2. Open `firmware/esp32_footpads/esp32_footpads.ino`
3. Set WiFi + host:
   ```cpp
   const char *WIFI_SSID = "YOUR_WIFI_SSID";
   const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";
   const char *GAME_HOST = "jumping.onrender.com";  // no https://
   ```
4. Flash. Serial should show:
   ```
   WiFi OK
   [ws] connected to cloud
   ```

## Wiring

| Pad | Player | GPIO |
|-----|--------|------|
| 0 | Cyan (A) | 32 |
| 1 | Lime (S) | 33 |
| 2 | Violet (K) | 25 |
| 3 | Pink (L) | 26 |

## Play

1. Deploy/redeploy Render (start: `npm start`).
2. Open the game — status **Pads online**.
3. Power ESP32 — stomp pads; jumps should feel near-instant.

## Notes

- Free Render can sleep; first connect after idle may take ~30s, then stays fast.
- Serial prints GPIO events immediately; cloud send is non-blocking over WSS.
