# GAME BOX — ESP32 Foot Pads

## Architecture

```
[Foot switch 1]──┐
[Foot switch 2]──┼──► ESP32 GPIO (INPUT_PULLUP)
[Foot switch 3]──┤         │
[Foot switch 4]──┘         ▼
                    SoftAP WiFi  SSID: GAMEBOX-PADS
                         │
                         ▼
                  WebSocket :81
                         │
                         ▼
              Browser game (Vite / Three.js)
              src/footpads.js → press/release jump
```

- **ESP32** reads 4 mechanical keys, debounces, broadcasts JSON over WebSocket.
- **Phone/PC** joins ESP32 WiFi, opens the game, auto-connects to `ws://192.168.4.1:81`.
- Keyboard `A`/`S`/`K`/`L` still works for testing without hardware.

## Pad → player map

| Pad | GPIO (default) | Player |
|-----|----------------|--------|
| 0   | 32             | Cyan Bean (A) |
| 1   | 33             | Lime Bean (S) |
| 2   | 25             | Violet Bean (K) |
| 3   | 26             | Pink Bean (L) |

Stomp = charge jump, release = jump (same as keyboard hold/release).

## Flash ESP32

1. Install [Arduino IDE](https://www.arduino.cc/) + ESP32 board pack.
2. Library Manager → install **WebSockets** by Markus Sattler.
3. Open `firmware/esp32_footpads/esp32_footpads.ino`.
4. Board: ESP32 Dev Module · Upload.

## Wiring

Each switch: one side → GPIO, other side → **GND**.  
Internal pull-ups enabled (pressed = LOW).

## Play

1. Power ESP32 → network **GAMEBOX-PADS** / password **gamebox123**.
2. On PC: join that WiFi (or use phone hotspot path — see note).
3. Open game. Status should show **Pads online**.
4. Optional custom URL: `http://localhost:5173/?pads=ws://192.168.4.1:81`

### Dev note (PC on home WiFi + ESP32 SoftAP)

Browsers need the PC on the same network as the ESP32. Easiest:
- Connect the **laptop to GAMEBOX-PADS**, then open the game from a built file or local server on that laptop, **or**
- Change firmware to `WIFI_STA` and join your home router (edit SSID/pass in `.ino`), then use `?pads=ws://<esp-ip>:81`.

## Protocol

```json
{"t":"hello","device":"gamebox-esp32","pads":4}
{"t":"down","pad":0}
{"t":"up","pad":0}
```
