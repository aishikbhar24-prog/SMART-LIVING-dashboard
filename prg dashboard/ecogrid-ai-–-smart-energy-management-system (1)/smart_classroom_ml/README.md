# SMART AUTOMATION OF CLASSROOM LABS (IoT + Machine Learning)

An end-to-end Machine Learning, IoT, and Embedded Automation system for real-time monitoring, occupancy detection, load forecasting, and autonomous equipment regulation in academic laboratories and classrooms.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                           PHYSICAL CLASSROOM LAB SENSORS                          |
|  [DHT22: Temp/Humidity]   [MQ-135: CO2]   [LDR: Lux]   [PIR: Motion]   [ACS712: Amps]  |
+------------------------------------------+----------------------------------------+
                                           | (Analog / Digital GPIOs)
                                           v
+-----------------------------------------------------------------------------------+
|                                 ESP32 MICROCONTROLLER                             |
|  - Samples sensors every 5s                                                        |
|  - Encodes JSON telemetry payload                                                 |
|  - Fail-safe fallback logic if network disconnects                                |
|  - Drives 4-channel Relays: Lights, Fans (PWM), AC Compressor, Workstation Bus     |
+------------------------------------------+----------------------------------------+
                                           | Wi-Fi (MQTT: ecocampus/lab101/telemetry)
                                           v
+-----------------------------------------------------------------------------------+
|                        MQTT BROKER (Mosquitto / HiveMQ)                           |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                     SERVER-SIDE ML PIPELINE & DECISION ENGINE                     |
|  1. Preprocessing & Imputation (StandardScaler, SimpleImputer)                     |
|  2. Feature Engineering (Heat Index, CO2 Ratio, Activity Factor, Cyclical Time)    |
|  3. Primary Model: Logistic Regression / Random Forest (Occupancy: 0 / 1)          |
|  4. Secondary Model: Linear/Gradient Boosting Regressor (Power Draw: Watts)        |
|  5. Safety Engine: Isolation Forest (Electrical / Sensor Outlier Detection)        |
|  6. Automation Rule Engine: Generates deterministic relay control commands        |
+------------------------------------------+----------------------------------------+
                                           |
                       +-------------------+-------------------+
                       | (MQTT Actuator Commands)             | (Live Metrics)
                       v                                       v
        +-------------------------------+       +-------------------------------+
        |    ESP32 ACTUATOR RECEIVER    |       |   WEB MONITORING DASHBOARD    |
        | - Switches Relays 1-4         |       | - Real-time occupancy graph   |
        | - Modulates Fan Speed (PWM)   |       | - Power consumption & savings |
        | - Enforces Manual Override    |       | - Anomaly alerts & manual toggles |
        +-------------------------------+       +-------------------------------+
```

---

## 2. Directory Structure

```
smart_classroom_ml/
├── classroom_lab_data.csv       # 1,200 observation IoT multi-sensor telemetry dataset
├── generate_dataset.py          # Synthetic dataset generator script
├── pipeline.py                  # End-to-end 13-step ML analysis, training & evaluation
├── mqtt_bridge.py               # MQTT subscriber/publisher daemon & live inference
├── esp32_smart_lab.ino          # Full Arduino C++ firmware for ESP32 & sensors
├── requirements.txt             # Python dependencies
├── README.md                    # Project documentation
└── artifacts/                   # Serialized ML artifacts
    ├── model_occupancy.pkl      # Trained occupancy classifier
    ├── model_power.pkl          # Trained power consumption regressor
    ├── model_anomaly.pkl        # Trained Isolation Forest model
    ├── scaler.pkl               # Fitted StandardScaler
    └── feature_columns.json     # Feature list metadata
```

---

## 3. Quickstart & Execution

### A. Environment Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### B. Run End-to-End ML Pipeline
```bash
python3 pipeline.py
```
This script runs dataset inspection, missing value imputation, feature engineering, cross-validation across 5 classifiers and 4 regressors, confusion matrix calculation, explainability analysis, artifact saving, and live inference demonstration.

### C. Run Real-Time MQTT Telemetry Bridge
```bash
python3 mqtt_bridge.py
```

### D. Flash ESP32 Microcontroller
1. Open `esp32_smart_lab.ino` in the Arduino IDE.
2. Install required libraries via Library Manager:
   - `DHT sensor library` by Adafruit
   - `PubSubClient` by Nick O'Leary
   - `ArduinoJson` by Benoît Blanchon
3. Update Wi-Fi credentials (`WIFI_SSID` and `WIFI_PASSWORD`).
4. Select board **ESP32 Dev Module** and click **Upload**.

---

## 4. Hardware Pinout Schematic

| Component | Sensor / Actuator Pin | ESP32 GPIO | Description |
|---|---|---|---|
| DHT22 | Data Pin | GPIO 4 | Ambient Temperature & Relative Humidity |
| LDR Module | Analog Output (AO) | GPIO 34 (ADC1) | Room Illuminance (0–1000 lux) |
| MQ-135 | Analog Output (AO) | GPIO 35 (ADC1) | CO2 & Air Quality proxy (ppm) |
| HC-SR501 | Digital Output (OUT)| GPIO 27 | Passive Infrared Motion Detection |
| ACS712-20A | Analog Output (OUT)| GPIO 32 (ADC1) | Hall-Effect AC Current Monitor |
| Relay 1 | IN1 | GPIO 16 | Main Lighting Array Relay |
| Relay 2 | IN2 | GPIO 17 (PWM) | Ceiling Fans Controller |
| Relay 3 | IN3 | GPIO 18 | AC Compressor Contactor Relay |
| Relay 4 | IN4 | GPIO 19 | Computer Workstation Bus Relay |
| Pushbutton | Pin 1 to GND | GPIO 23 | Manual Override Toggle Switch |
| Status LED | Anode (+ via 220Ω) | GPIO 2 | Indicator for Manual Override / Anomaly |

---

## 5. Automation Decision Matrix

| Condition | Occupancy Prediction | Temperature | Ambient Lux | Light Relay | Fan Relay / PWM | AC Relay | Equipment Relay |
|---|---|---|---|---|---|---|---|
| Lab Empty | EMPTY (0) | Any | Any | OFF (0) | OFF (PWM 0) | OFF (0) | OFF (Standby) |
| Active Class | OCCUPIED (1) | < 23°C | < 300 lux | ON (1) | OFF (PWM 0) | OFF (0) | ON (1) |
| Active Class | OCCUPIED (1) | 23°C–25°C | ≥ 300 lux | OFF (0) | ON (PWM 110) | OFF (0) | ON (1) |
| Active Class | OCCUPIED (1) | 25°C–27.5°C| < 300 lux | ON (1) | ON (PWM 180) | ON (24.5°C) | ON (1) |
| Active Class | OCCUPIED (1) | ≥ 27.5°C | < 300 lux | ON (1) | ON (PWM 255) | ON (23.0°C) | ON (1) |
| Hardware Anomaly | ANY | Abnormal | Any | ON (Safety)| OFF (0) | OFF (0) | OFF (Isolated) |
| Manual Mode | ANY | Any | Any | Manual | Manual | Manual | Manual |
