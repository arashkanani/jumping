/*
 * GAME BOX — 4 foot keys → ESP32 → WebSocket → browser
 *
 * MODE: WIFI_STA (joins your home WiFi — recommended)
 *
 * Library: WebSockets by Markus Sattler
 *
 * Wiring (pressed = LOW, internal pull-up):
 *   Pad 1 (Player A / Cyan)   → GPIO 32  → GND
 *   Pad 2 (Player S / Lime)   → GPIO 33  → GND
 *   Pad 3 (Player K / Violet) → GPIO 25  → GND
 *   Pad 4 (Player L / Pink)   → GPIO 26  → GND
 *
 * After upload, open Serial Monitor 115200 and copy the printed IP, e.g.:
 *   WS  ws://192.168.1.42:81
 * Then open the game with:
 *   http://localhost:5173/?pads=ws://192.168.1.42:81
 * Or paste that URL in the Pads box in the UI.
 */

#include <WiFi.h>
#include <WebSocketsServer.h>

// ——— Put YOUR home WiFi here (2.4 GHz — ESP32 has no 5 GHz) ———
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";

const uint8_t WS_PORT = 81;

const uint8_t PAD_PINS[4] = {32, 33, 25, 26};
const uint8_t PAD_COUNT = 4;
const uint16_t DEBOUNCE_MS = 25;

WebSocketsServer webSocket = WebSocketsServer(WS_PORT);

bool lastStable[PAD_COUNT];
bool lastRaw[PAD_COUNT];
unsigned long lastChangeMs[PAD_COUNT];

void broadcast(String msg) {
  webSocket.broadcastTXT(msg);
}

void sendPad(uint8_t pad, bool down) {
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
      String hello = "{\"t\":\"hello\",\"device\":\"gamebox-esp32\",\"pads\":4}";
      webSocket.sendTXT(num, hello);
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
      if (length > 0) Serial.printf("[WS] RX: %s\n", payload);
      break;
    default:
      break;
  }
}

bool connectWifi() {
  Serial.printf("Connecting to WiFi \"%s\" ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    if (millis() - start > 25000) {
      Serial.println("\nWiFi FAILED (timeout). Check SSID/pass and use 2.4 GHz.");
      return false;
    }
  }
  Serial.println();
  Serial.printf("WiFi OK\n");
  Serial.printf("IP  %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("WS  ws://%s:%u\n", WiFi.localIP().toString().c_str(), WS_PORT);
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== GAME BOX Foot Pads (ESP32 STA) ===");

  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    pinMode(PAD_PINS[i], INPUT_PULLUP);
    bool raw = digitalRead(PAD_PINS[i]);
    lastRaw[i] = raw;
    lastStable[i] = raw;
    lastChangeMs[i] = millis();
  }

  if (!connectWifi()) {
    Serial.println("Stop — fix WiFi and re-upload / reset.");
    return;
  }

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  Serial.println("Ready — open game with ?pads=ws://<IP>:81");
  Serial.println("When browser connects you MUST see: [WS] Client ... connected");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    delay(500);
    return;
  }

  webSocket.loop();

  unsigned long now = millis();
  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    bool raw = digitalRead(PAD_PINS[i]);

    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
    }

    if ((now - lastChangeMs[i]) >= DEBOUNCE_MS && raw != lastStable[i]) {
      lastStable[i] = raw;
      sendPad(i, raw == LOW);
    }
  }
}
