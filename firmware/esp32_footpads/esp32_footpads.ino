/*
 * GAME BOX — ESP32 foot pads → cloud (low latency)
 *
 * Flow:
 *   GPIO → ESP32 ──WSS──► wss://YOUR-APP.onrender.com/ws
 *                              └─► all browsers (instant relay)
 *
 * Uses a persistent WebSocket (not HTTPS POST per stomp) so jumps feel snappy.
 * Library: WebSockets by Markus Sattler (Library Manager)
 *
 * Wiring (pressed = LOW, internal pull-up):
 *   Pad 0 (A / Cyan)   → GPIO 32 → GND
 *   Pad 1 (S / Lime)   → GPIO 33 → GND
 *   Pad 2 (K / Violet) → GPIO 25 → GND
 *   Pad 3 (L / Pink)   → GPIO 26 → GND
 */

#include <WiFi.h>
#include <WebSocketsClient.h>

// ——— 1) Home WiFi (2.4 GHz only) ———
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ——— 2) Render host (no https://, no path) ———
const char *GAME_HOST = "jumping.onrender.com";
const uint16_t GAME_PORT = 443;
const char *GAME_WS_PATH = "/ws";

const uint8_t PAD_PINS[4] = {32, 33, 25, 26};
const uint8_t PAD_COUNT = 4;
const uint16_t DEBOUNCE_MS = 15;

bool lastStable[PAD_COUNT];
bool lastRaw[PAD_COUNT];
unsigned long lastChangeMs[PAD_COUNT];

WebSocketsClient webSocket;
bool wsReady = false;

void sendTxt(const String &msg) {
  Serial.println(msg); // local log is immediate
  if (wsReady && webSocket.isConnected()) {
    webSocket.sendTXT(msg);
  } else {
    Serial.println("[ws] not connected — event queued only on Serial");
  }
}

void sendPad(uint8_t pad, bool down) {
  String body = String("{\"t\":\"") + (down ? "down" : "up") +
                "\",\"pad\":" + String(pad) + "}";
  sendTxt(body);
}

void sendLog(const String &msg) {
  String body = String("{\"t\":\"log\",\"msg\":\"") + msg + "\"}";
  sendTxt(body);
}

void onWsEvent(WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      wsReady = true;
      Serial.println("[ws] connected to cloud");
      sendLog("esp32-online");
      // Resync any pads currently held down
      for (uint8_t i = 0; i < PAD_COUNT; i++) {
        if (lastStable[i] == LOW) sendPad(i, true);
      }
      break;
    case WStype_DISCONNECTED:
      wsReady = false;
      Serial.println("[ws] disconnected — will retry");
      break;
    case WStype_TEXT:
      Serial.printf("[ws] RX: %s\n", payload);
      break;
    case WStype_ERROR:
      wsReady = false;
      Serial.println("[ws] error");
      break;
    default:
      break;
  }
}

bool connectWifi() {
  Serial.printf("Connecting to WiFi \"%s\" ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
    if (millis() - start > 25000) {
      Serial.println("\nWiFi FAILED. Check SSID/pass (2.4 GHz).");
      return false;
    }
  }
  Serial.println();
  Serial.printf("WiFi OK  IP %s\n", WiFi.localIP().toString().c_str());
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== GAME BOX Pads → Cloud WSS ===");
  Serial.printf("Host  wss://%s%s\n", GAME_HOST, GAME_WS_PATH);

  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    pinMode(PAD_PINS[i], INPUT_PULLUP);
    bool raw = digitalRead(PAD_PINS[i]);
    lastRaw[i] = raw;
    lastStable[i] = raw;
    lastChangeMs[i] = millis();
  }

  if (!connectWifi()) {
    Serial.println("Stop — fix WiFi and reset.");
    return;
  }

  // Persistent low-latency link (beginSSL uses setInsecure when no CA set)
  webSocket.beginSSL(GAME_HOST, GAME_PORT, GAME_WS_PATH);
  webSocket.onEvent(onWsEvent);
  webSocket.setReconnectInterval(2000);
  webSocket.enableHeartbeat(15000, 3000, 2);

  Serial.println("Ready — open the Render game; stomp pads.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    wsReady = false;
    Serial.println("WiFi lost — reconnecting…");
    WiFi.reconnect();
    delay(1000);
    return;
  }

  webSocket.loop(); // keep WSS alive / flush sends

  unsigned long now = millis();
  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    bool raw = digitalRead(PAD_PINS[i]);

    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
    }

    if ((now - lastChangeMs[i]) >= DEBOUNCE_MS && raw != lastStable[i]) {
      lastStable[i] = raw;
      sendPad(i, raw == LOW); // LOW = pressed — non-blocking over WSS
    }
  }
}
