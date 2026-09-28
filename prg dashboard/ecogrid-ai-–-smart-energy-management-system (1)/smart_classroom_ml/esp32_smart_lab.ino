/*
 * SMART AUTOMATION OF CLASSROOM LABS - ESP32 FIRMWARE
 * 
 * Hardware Setup:
 * - DHT22 (Temp & Humidity): Pin GPIO 4
 * - LDR Module (Light Lux Analog): Pin GPIO 34 (ADC1)
 * - MQ-135 (CO2 / Air Quality): Pin GPIO 35 (ADC1)
 * - HC-SR501 PIR Motion Sensor: Pin GPIO 27 (Digital Input)
 * - ACS712 Current Sensor: Pin GPIO 32 (ADC1)
 * - 4-Channel 5V Relay Module:
 *    * Relay 1 (Lights): GPIO 16
 *    * Relay 2 (Fans): GPIO 17 (PWM capable for speed control)
 *    * Relay 3 (AC Compressor): GPIO 18
 *    * Relay 4 (Lab Equipment / Workstations): GPIO 19
 * - Manual Override Pushbutton: GPIO 23
 * - Status NeoPixel / Alert LED: GPIO 2
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Wi-Fi & MQTT Credentials
const char* WIFI_SSID = "CAMPUS_IOT_WIFI";
const char* WIFI_PASSWORD = "CampusSecurePass123";
const char* MQTT_SERVER = "broker.hivemq.com";
const int MQTT_PORT = 1883;

// MQTT Topics
const char* TOPIC_TELEMETRY = "ecocampus/lab101/telemetry";
const char* TOPIC_ACTUATORS = "ecocampus/lab101/actuators";

// Pin Configurations
#define DHTPIN 4
#define DHTTYPE DHT22
#define PIN_LDR 34
#define PIN_MQ135 35
#define PIN_PIR 27
#define PIN_ACS712 32
#define PIN_RELAY_LIGHTS 16
#define PIN_RELAY_FANS 17
#define PIN_RELAY_AC 18
#define PIN_RELAY_EQUIPMENT 19
#define PIN_MANUAL_BUTTON 23
#define PIN_STATUS_LED 2

// PWM Configuration for Fan Control
#define FAN_PWM_CHANNEL 0
#define FAN_PWM_FREQ 5000
#define FAN_PWM_RES 8

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Operational States
bool manualOverride = false;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 5000; // 5-second sampling loop

void setupWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed! Running in offline fallback safety mode.");
  }
}

void mqttCallback(char* topic, byte* message, unsigned int length) {
  Serial.print("MQTT message arrived on topic: ");
  Serial.println(topic);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message, length);
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  // If manual override is engaged, ignore server commands to maintain local control
  if (manualOverride) {
    Serial.println("Manual override active. Ignoring automated MQTT command.");
    return;
  }

  int relayLights = doc["relay_lights"] | 0;
  int relayFans = doc["relay_fans"] | 0;
  int relayAC = doc["relay_ac"] | 0;
  int relayEquipment = doc["relay_equipment"] | 0;
  int fanPwm = doc["pwm_fan_speed"] | 0;

  // Active-LOW Relays: LOW = Relay Activated (ON), HIGH = Relay Deactivated (OFF)
  digitalWrite(PIN_RELAY_LIGHTS, relayLights == 1 ? LOW : HIGH);
  digitalWrite(PIN_RELAY_AC, relayAC == 1 ? LOW : HIGH);
  digitalWrite(PIN_RELAY_EQUIPMENT, relayEquipment == 1 ? LOW : HIGH);

  // Modulate Fan Speed via PWM
  ledcWrite(FAN_PWM_CHANNEL, relayFans == 1 ? fanPwm : 0);

  Serial.println("Actuator Relays Updated via ML Command:");
  Serial.printf(" Lights: %d | Fans: %d (PWM %d) | AC: %d | Workstations: %d\n", 
                relayLights, relayFans, fanPwm, relayAC, relayEquipment);
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT broker...");
    String clientId = "ESP32_Lab101_" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("Connected!");
      client.subscribe(TOPIC_ACTUATORS);
      Serial.printf("Subscribed to '%s'\n", TOPIC_ACTUATORS);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 4 seconds...");
      delay(4000);
      break; // Non-blocking retry in main loop
    }
  }
}

float readACS712Current() {
  // ACS712-20A: 100mV / Amp, 2.5V zero-current offset
  long rawSum = 0;
  for (int i = 0; i < 50; i++) {
    rawSum += analogRead(PIN_ACS712);
    delayMicroseconds(100);
  }
  float avgRaw = rawSum / 50.0;
  float voltage = (avgRaw / 4095.0) * 3.3;
  float currentAmps = abs((voltage - 1.65) / 0.1);
  return currentAmps < 0.15 ? 0.05 : currentAmps; // Filter noise floor
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Pin Modes
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_LDR, INPUT);
  pinMode(PIN_MQ135, INPUT);
  pinMode(PIN_MANUAL_BUTTON, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);

  // Relay outputs (Default Safe State: OFF)
  pinMode(PIN_RELAY_LIGHTS, OUTPUT);
  pinMode(PIN_RELAY_AC, OUTPUT);
  pinMode(PIN_RELAY_EQUIPMENT, OUTPUT);
  digitalWrite(PIN_RELAY_LIGHTS, HIGH);
  digitalWrite(PIN_RELAY_AC, HIGH);
  digitalWrite(PIN_RELAY_EQUIPMENT, HIGH);

  // PWM for Fan
  ledcSetup(FAN_PWM_CHANNEL, FAN_PWM_FREQ, FAN_PWM_RES);
  ledcAttachPin(PIN_RELAY_FANS, FAN_PWM_CHANNEL);
  ledcWrite(FAN_PWM_CHANNEL, 0);

  setupWiFi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(mqttCallback);

  Serial.println("ESP32 Smart Classroom Controller Online.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // Check Manual Override Button
  if (digitalRead(PIN_MANUAL_BUTTON) == LOW) {
    delay(50); // Debounce
    if (digitalRead(PIN_MANUAL_BUTTON) == LOW) {
      manualOverride = !manualOverride;
      digitalWrite(PIN_STATUS_LED, manualOverride ? HIGH : LOW);
      Serial.printf(">>> Manual Override toggled: %s <<<\n", manualOverride ? "ACTIVE" : "OFF");
      while (digitalRead(PIN_MANUAL_BUTTON) == LOW); // Wait release
    }
  }

  // Periodic Telemetry Publishing
  unsigned long now = millis();
  if (now - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;

    // Read Sensors
    float tempC = dht.readTemperature();
    float humPct = dht.readHumidity();
    int pirMotion = digitalRead(PIN_PIR);
    
    // Light lux conversion from LDR
    int rawLDR = analogRead(PIN_LDR);
    float lightLux = map(rawLDR, 0, 4095, 0, 1000);

    // CO2 ppm estimate from MQ-135 analog voltage
    int rawMQ = analogRead(PIN_MQ135);
    float co2Ppm = map(rawMQ, 0, 4095, 400, 2000);

    // Current & Power
    float currentAmps = readACS712Current();
    float voltageV = 220.0;
    float powerW = voltageV * currentAmps;

    // Noise level (simulated / sound detector threshold)
    float noiseDb = pirMotion ? random(45, 68) : random(28, 35);

    // Package JSON
    StaticJsonDocument<512> doc;
    doc["temp_c"] = isnan(tempC) ? 25.0 : tempC;
    doc["humidity_pct"] = isnan(humPct) ? 50.0 : humPct;
    doc["co2_ppm"] = co2Ppm;
    doc["light_lux"] = lightLux;
    doc["pir_motion"] = pirMotion;
    doc["noise_db"] = noiseDb;
    doc["voltage_v"] = voltageV;
    doc["current_amps"] = currentAmps;
    doc["power_w"] = powerW;
    doc["hour_of_day"] = 14; // Can be synced via NTP Client
    doc["is_weekend"] = 0;
    doc["schedule_active"] = 1;
    doc["manual_override"] = manualOverride;

    char buffer[512];
    serializeJson(doc, buffer);

    if (client.connected()) {
      client.publish(TOPIC_TELEMETRY, buffer);
      Serial.print("[MQTT TX] Sent Telemetry: ");
      Serial.println(buffer);
    } else {
      // Local Fallback Safety Automation if MQTT is disconnected
      Serial.println("Offline Fallback Safety Rule Executing...");
      if (pirMotion == 0) {
        digitalWrite(PIN_RELAY_LIGHTS, HIGH); // OFF
        ledcWrite(FAN_PWM_CHANNEL, 0);
      } else {
        if (lightLux < 300) digitalWrite(PIN_RELAY_LIGHTS, LOW); // ON
        if (tempC > 26.0) ledcWrite(FAN_PWM_CHANNEL, 200);
      }
    }
  }
}
