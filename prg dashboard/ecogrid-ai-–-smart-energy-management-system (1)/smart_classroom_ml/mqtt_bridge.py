"""
Real-Time MQTT Microservice & Decision Engine for:
"SMART AUTOMATION OF CLASSROOM LABS"
Listens for ESP32 telemetry, executes ML inference, and publishes actuator commands.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd

try:
    import paho.mqtt.client as mqtt
    HAS_PAHO = True
except ImportError:
    HAS_PAHO = False

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')

# Load trained models & metadata
print(f"Loading ML models from '{ARTIFACTS_DIR}'...")
model_occupancy = joblib.load(os.path.join(ARTIFACTS_DIR, 'model_occupancy.pkl'))
model_power = joblib.load(os.path.join(ARTIFACTS_DIR, 'model_power.pkl'))
model_anomaly = joblib.load(os.path.join(ARTIFACTS_DIR, 'model_anomaly.pkl'))
scaler = joblib.load(os.path.join(ARTIFACTS_DIR, 'scaler.pkl'))

with open(os.path.join(ARTIFACTS_DIR, 'feature_columns.json'), 'r') as f:
    feature_cols = json.load(f)

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
TOPIC_TELEMETRY = "ecocampus/lab101/telemetry"
TOPIC_ACTUATORS = "ecocampus/lab101/actuators"
TOPIC_ALERTS = "ecocampus/lab101/alerts"

def process_sensor_reading(payload: dict) -> dict:
    """
    Extracts features, scales data, runs ML inference, and computes actuator relays.
    """
    temp_c = float(payload.get('temp_c', 25.0))
    humidity_pct = float(payload.get('humidity_pct', 55.0))
    co2_ppm = float(payload.get('co2_ppm', 650.0))
    light_lux = float(payload.get('light_lux', 320.0))
    pir_motion = int(payload.get('pir_motion', 1))
    noise_db = float(payload.get('noise_db', 45.0))
    voltage_v = float(payload.get('voltage_v', 220.0))
    current_amps = float(payload.get('current_amps', 3.5))
    power_w = float(payload.get('power_w', voltage_v * current_amps))
    hour_of_day = int(payload.get('hour_of_day', 12))
    is_weekend = int(payload.get('is_weekend', 0))
    schedule_active = int(payload.get('schedule_active', 1))
    prev_occupancy = int(payload.get('prev_occupancy', 0))

    # Engineered Features
    thi = round(temp_c - 0.55 * (1 - 0.01 * humidity_pct) * (temp_c - 14.5), 2)
    co2_temp = round(co2_ppm / (temp_c + 1e-5), 2)
    activity_factor = round(pir_motion * noise_db, 2)
    va = round(voltage_v * current_amps, 2)
    co2_above = max(0.0, co2_ppm - 400.0)
    hour_sin = np.sin(2 * np.pi * hour_of_day / 24.0)
    hour_cos = np.cos(2 * np.pi * hour_of_day / 24.0)

    features_df = pd.DataFrame([{
        'hour_of_day': hour_of_day, 'is_weekend': is_weekend, 'schedule_active': schedule_active,
        'temperature_c': temp_c, 'humidity_pct': humidity_pct, 'co2_ppm': co2_ppm,
        'light_lux': light_lux, 'pir_motion': pir_motion, 'noise_db': noise_db,
        'voltage_v': voltage_v, 'current_amps': current_amps,
        'thi_heat_index': thi, 'co2_temp_ratio': co2_temp, 'activity_factor': activity_factor,
        'apparent_power_va': va, 'co2_above_ambient': co2_above,
        'hour_sin': hour_sin, 'hour_cos': hour_cos, 'prev_occupancy': prev_occupancy
    }])[feature_cols]

    scaled = scaler.transform(features_df)

    # ML Inference
    occ_pred = int(model_occupancy.predict(scaled)[0])
    occ_conf = float(model_occupancy.predict_proba(scaled)[0][occ_pred]) * 100
    pred_power = round(float(model_power.predict(scaled)[0]), 1)
    is_anomaly = bool(model_anomaly.predict(scaled)[0] == -1)

    # Automation Rules
    if is_anomaly:
        actuators = {
            "mode": "EMERGENCY_PROTECTION",
            "relay_lights": 1,
            "relay_fans": 0,
            "relay_ac": 0,
            "relay_equipment": 0,
            "pwm_fan_speed": 0,
            "ac_setpoint": None,
            "alert": "CRITICAL: Sensor/Electrical anomaly detected! Non-essential circuits isolated."
        }
    elif occ_pred == 0:
        actuators = {
            "mode": "ECO_STANDBY",
            "relay_lights": 0,
            "relay_fans": 0,
            "relay_ac": 0,
            "relay_equipment": 0,
            "pwm_fan_speed": 0,
            "ac_setpoint": None,
            "alert": "Lab Empty: All appliances turned OFF. Standby power enabled."
        }
    else:
        # Occupied
        lights_on = 1 if light_lux < 300.0 else 0
        if temp_c >= 27.0:
            ac_on, ac_target, fan_on, fan_pwm = 1, 23.0, 1, 255
        elif temp_c >= 24.5:
            ac_on, ac_target, fan_on, fan_pwm = 1, 24.5, 1, 180
        elif temp_c >= 22.5:
            ac_on, ac_target, fan_on, fan_pwm = 0, None, 1, 120
        else:
            ac_on, ac_target, fan_on, fan_pwm = 0, None, 0, 0

        actuators = {
            "mode": "OCCUPIED_COMFORT",
            "relay_lights": lights_on,
            "relay_fans": fan_on,
            "relay_ac": ac_on,
            "relay_equipment": 1,
            "pwm_fan_speed": fan_pwm,
            "ac_setpoint": ac_target,
            "alert": "Classroom Active: Lighting & Climate automatically modulated."
        }

    return {
        "status": "OCCUPIED" if occ_pred == 1 else "EMPTY",
        "confidence_pct": round(occ_conf, 1),
        "actual_power_w": power_w,
        "predicted_power_w": pred_power,
        "anomaly": is_anomaly,
        "actuators": actuators
    }

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with result code {rc}")
    client.subscribe(TOPIC_TELEMETRY)
    print(f"Subscribed to telemetry topic: '{TOPIC_TELEMETRY}'")

def on_message(client, userdata, msg):
    try:
        raw_json = json.loads(msg.payload.decode('utf-8'))
        print(f"\n[MQTT Inbound] Received from ESP32: {raw_json}")
        
        result = process_sensor_reading(raw_json)
        
        outbound_payload = json.dumps(result["actuators"])
        client.publish(TOPIC_ACTUATORS, outbound_payload)
        print(f"[MQTT Outbound] Published to '{TOPIC_ACTUATORS}': {outbound_payload}")
        
        if result["anomaly"]:
            client.publish(TOPIC_ALERTS, json.dumps({"alert": result["actuators"]["alert"]}))
    except Exception as e:
        print(f"Error processing MQTT message: {e}")

if __name__ == '__main__':
    test_packet = {
        'temp_c': 27.5, 'humidity_pct': 62.0, 'co2_ppm': 1050.0,
        'light_lux': 195.0, 'pir_motion': 1, 'noise_db': 58.0,
        'voltage_v': 220.0, 'current_amps': 4.1, 'power_w': 902.0
    }
    res = process_sensor_reading(test_packet)
    print("Self-test Result for MQTT Message Processor:")
    print(json.dumps(res, indent=2))
