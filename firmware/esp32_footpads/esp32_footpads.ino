/*
 * GAME BOX — ESP32 foot pads → cloud app (Render)
 *
 * Flow:
 *   Foot switch → ESP32 → HTTPS POST → https://YOUR-APP.onrender.com/api/pad
 *                                    → browsers receive events on /ws
 *
 * You do NOT configure local IP or WebSocket SoftAP.
 * Just set GAME_URL to your deployed Render link.
 *
 * Libraries: none extra (WiFi + HTTPClient + WiFiClientSecure built-in)
 *
 * Wiring (pressed = LOW, internal pull-up):
 *   Pad 0 (A / Cyan)   → GPIO 32 → GND
 *   Pad 1 (S / Lime)   → GPIO 33 → GND
 *   Pad 2 (K / Violet) → GPIO 25 → GND
 *   Pad 3 (L / Pink)   → GPIO 26 → GND
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ——— 1) Home WiFi (2.4 GHz only) ———
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";

// ——— 2) Deployed game URL (no trailing slash) ———
const char *GAME_URL = "https://jumping.onrender.com";

const uint8_t PAD_PINS[4] = {32, 33, 25, 26};
const uint8_t PAD_COUNT = 4;
const uint16_t DEBOUNCE_MS = 25;
const uint16_t HTTP_TIMEOUT_MS = 4000;

bool lastStable[PAD_COUNT];
bool lastRaw[PAD_COUNT];
unsigned long lastChangeMs[PAD_COUNT];

WiFiClientSecure secureClient;

bool postJson(const char *path, const String &body) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(GAME_URL) + path;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setReuse(true);

  if (!http.begin(secureClient, url)) {
    Serial.println("[http] begin failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");
  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.printf("[http] POST %s → %d %s\n", path, code, resp.c_str());
  return code >= 200 && code < 300;
}

void sendPad(uint8_t pad, bool down) {
  String body = String("{\"t\":\"") + (down ? "down" : "up") +
                "\",\"pad\":" + String(pad) + "}";
  Serial.println(body);
  postJson("/api/pad", body);
}

void sendLog(const String &msg) {
  String body = String("{\"msg\":\"") + msg + "\"}";
  postJson("/api/log", body);
}

bool connectWifi() {
  Serial.printf("Connecting to WiFi \"%s\" ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
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
  delay(300);
  Serial.println("\n=== GAME BOX Foot Pads → Cloud ===");
  Serial.printf("GAME_URL  %s\n", GAME_URL);

  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    pinMode(PAD_PINS[i], INPUT_PULLUP);
    bool raw = digitalRead(PAD_PINS[i]);
    lastRaw[i] = raw;
    lastStable[i] = raw;
    lastChangeMs[i] = millis();
  }

  // Render uses a public CA cert; skip verify for hobby reliability
  secureClient.setInsecure();

  if (!connectWifi()) {
    Serial.println("Stop — fix WiFi and reset.");
    return;
  }

  sendLog("esp32-boot");
  Serial.println("Ready — open the Render game; stomp pads to jump.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting…");
    WiFi.reconnect();
    delay(1500);
    return;
  }

  unsigned long now = millis();
  for (uint8_t i = 0; i < PAD_COUNT; i++) {
    bool raw = digitalRead(PAD_PINS[i]);

    if (raw != lastRaw[i]) {
      lastRaw[i] = raw;
      lastChangeMs[i] = now;
    }

    if ((now - lastChangeMs[i]) >= DEBOUNCE_MS && raw != lastStable[i]) {
      lastStable[i] = raw;
      sendPad(i, raw == LOW); // LOW = pressed
    }
  }
}
