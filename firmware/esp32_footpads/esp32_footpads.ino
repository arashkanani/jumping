/*
 * GAME BOX — 4 mechanical foot keys → ESP32 → WebSocket → browser game
 *
 * Board: ESP32 (DevKit / WROOM)
 * Library (Arduino IDE): Tools → Manage Libraries → "WebSockets" by Markus Sattler
 *
 * Wiring (active LOW, internal pull-up):
 *   Pad 1 (Player 1 foot A)  → GPIO 32  → other side to GND
 *   Pad 2 (Player 1 foot B)  → GPIO 33  → GND
 *   Pad 3 (Player 2 foot A)  → GPIO 25  → GND
 *   Pad 4 (Player 2 foot B)  → GPIO 26  → GND
 *
 * Mechanical switch: COM → GPIO, NO → GND (or NC depending on switch type).
 * Use momentary foot switches / arcade buttons under feet.
 *
 * WiFi SoftAP:
 *   SSID: GAMEBOX-PADS
 *   Pass: gamebox123
 *   IP:   192.168.4.1
 *   WS:   ws://192.168.4.1:81
 *
 * Protocol (JSON text frames):
 *   {"t":"hello","device":"gamebox-esp32","pads":4}
 *   {"t":"down","pad":0}   // 0..3 pressed
 *   {"t":"up","pad":1}     // released
 *   {"t":"ping"}
 */

#include <WiFi.h>
#include <WebSocketsServer.h>

// ——— WiFi SoftAP ———
const char *AP_SSID = "GAMEBOX-PADS";
const char *AP_PASS = "gamebox123";  // min 8 chars
const uint8_t WS_PORT = 81;

// ——— Foot pad pins (change if needed) ———
const uint8_t PAD_PINS[4] = {32, 33, 25, 26};
const uint8_t PAD_COUNT = 4;

// Debounce
const uint16_t DEBOUNCE_MS = 25;

WebSocketsServer webSocket = WebSocketsServer(WS_PORT);

bool lastStable[PAD_COUNT];
bool lastRaw[PAD_COUNT];
unsigned long lastChangeMs[PAD_COUNT];

void broadcast(const String &msg) {
  webSocket.broadcastTXT(msg);
}

void sendPad(uint8_t pad, bool down) {
  // pad index 0..3
  String msg = String("{\"t\":\"") + (down ? "down" : "up") +
               "\",\"pad\":" + String(pad) + "}";
  broadcast(msg);
  Serial.println(msg);
}

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client %u connected from %s\n", num, ip.toString().c_str());
      webSocket.sendTXT(num, "{\"t\":\"hello\",\"device\":\"gamebox-esp32\",\"pads\":4}");
      // Sync current pad states
      for (uint8_t i = 0; i < PAD_COUNT; i++) {
        if (lastStable[i] == LOW) {
          String msg = String("{\"t\":\"down\",\"pad\":") + String(i) + "}";
          webSocket.sendTXT(num, msg);
        }
      }
      break;
    }
    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client %u disconnected\n", num);
      break;
    case WStype_TEXT:
      // Optional: app can send {"t":"ping"}
      if (length > 0) {
        Serial.printf("[WS] RX: %s\n", payload);
      }
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== GAME BOX Foot Pads (ESP32) ===");

  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    pinMode(PAD_PINS[i], INPUT_PULLUP);
    bool raw = digitalRead(PAD_PINS[i]);
    lastRaw[i] = raw;
    lastStable[i] = raw;  // HIGH = not pressed
    lastChangeMs[i] = millis();
  }

  // SoftAP — phone/PC joins this network to play
  WiFi.mode(WIFI_AP);
  bool ok = WiFi.softAP(AP_SSID, AP_PASS);
  delay(300);
  IPAddress ip = WiFi.softAPIP();
  Serial.printf("AP %s  (%s)\n", ok ? "OK" : "FAIL", AP_SSID);
  Serial.printf("IP  %s\n", ip.toString().c_str());
  Serial.printf("WS  ws://%s:%u\n", ip.toString().c_str(), WS_PORT);

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  Serial.println("Ready — stomp the pads!");
}

void loop() {
  webSocket.loop();

  unsigned long now = millis();
  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    bool raw = digitalRead(PAD_PINS[i]);  // LOW = pressed

    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
    }

    if ((now - lastChangeMs[i]) >= DEBOUNCE_MS && raw != lastStable[i]) {
      lastStable[i] = raw;
      bool pressed = (raw == LOW);
      sendPad(i, pressed);
    }
  }
}
