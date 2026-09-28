"""
Synthetic High-Fidelity Dataset Generator for:
"SMART AUTOMATION OF CLASSROOM LABS"
Generates 1,200 time-indexed observations representing 2 weeks of real-world classroom/lab IoT telemetry.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_classroom_lab_data(output_path="classroom_lab_data.csv", n_samples=1200, random_seed=42):
    np.random.seed(random_seed)
    
    start_time = datetime(2026, 9, 1, 8, 0, 0)
    timestamps = [start_time + timedelta(minutes=15 * i) for i in range(n_samples)]
    
    records = []
    prev_occ = 0
    
    for ts in timestamps:
        hour = ts.hour
        day_of_week = ts.strftime('%A')
        is_weekend = 1 if ts.weekday() >= 5 else 0
        
        # Scheduled classes/labs: Weekdays between 9:00 and 17:00
        is_scheduled_time = (9 <= hour <= 12) or (13 <= hour <= 17)
        schedule_active = 1 if (not is_weekend and is_scheduled_time and np.random.rand() > 0.15) else 0
        
        # Occupancy state probability: strongly linked to schedule, but accounts for off-schedule study or empty lab
        if schedule_active:
            occupied = 1 if np.random.rand() > 0.08 else 0
        elif not is_weekend and (8 <= hour <= 19):
            occupied = 1 if np.random.rand() > 0.65 else 0
        else:
            occupied = 1 if np.random.rand() > 0.96 else 0  # rare night/weekend access
            
        if occupied:
            occupant_count = np.random.randint(12, 38)
            pir_motion = 1 if np.random.rand() > 0.05 else 0
            noise_db = np.random.normal(loc=58.0 + (occupant_count * 0.4), scale=5.0)
            co2_ppm = np.random.normal(loc=850.0 + (occupant_count * 18.0), scale=75.0)
            temp_c = np.random.normal(loc=25.5 + (occupant_count * 0.05), scale=1.0)
            humidity_pct = np.random.normal(loc=55.0 + (occupant_count * 0.15), scale=3.5)
            # Indoor lighting is active
            light_lux = np.random.normal(loc=460.0, scale=40.0) if (8 <= hour <= 18) else np.random.normal(loc=380.0, scale=30.0)
            active_pcs = int(occupant_count * np.random.uniform(0.7, 1.0))
            fans_active = 1 if temp_c > 24.5 else 0
            ac_active = 1 if temp_c > 26.0 else 0
            
            # Base power: Lights (400W) + Fans (250W) + AC (1400W) + Workstations (70W each)
            power_w = 400 + (250 if fans_active else 0) + (1400 if ac_active else 0) + (active_pcs * 75) + np.random.normal(50, 15)
            equipment_status = "HIGH_USAGE" if power_w > 1800 else "NORMAL_USAGE"
            
            # Target fan speed required: 0 to 5
            if temp_c < 23.0:
                fan_speed = 0
            elif temp_c < 25.0:
                fan_speed = 2
            elif temp_c < 27.0:
                fan_speed = 3
            else:
                fan_speed = 5
                
            lighting_required = 1 if light_lux < 300 else 0
        else:
            occupant_count = 0
            pir_motion = 1 if np.random.rand() > 0.94 else 0  # false sensor bounce or cleaner passing
            noise_db = np.random.normal(loc=32.0, scale=3.0)
            co2_ppm = np.random.normal(loc=420.0, scale=25.0)
            temp_c = np.random.normal(loc=22.5, scale=1.2)
            humidity_pct = np.random.normal(loc=48.0, scale=3.0)
            # Ambient natural light only
            if 6 <= hour <= 18:
                light_lux = np.random.normal(loc=120.0, scale=35.0)
            else:
                light_lux = np.random.normal(loc=15.0, scale=5.0)
                
            # Occasional energy waste anomaly: lights/fans left ON in empty lab
            waste_anomaly = np.random.rand() > 0.92
            if waste_anomaly:
                power_w = np.random.normal(loc=750.0, scale=60.0)
                equipment_status = "WASTE_DETECTED"
            else:
                power_w = np.random.normal(loc=45.0, scale=8.0) # standby equipment
                equipment_status = "STANDBY"
                
            fan_speed = 0
            lighting_required = 0

        # Inject 1.5% abnormal sensor telemetry (e.g. electrical surge, sensor disconnect)
        abnormal_condition = 0
        if np.random.rand() > 0.985:
            abnormal_condition = 1
            if np.random.rand() > 0.5:
                # Voltage sag or surge
                voltage_v = np.random.choice([185.0, 258.0])
                power_w = power_w * 1.5
            else:
                # Sensor spike
                co2_ppm = 2600.0
                temp_c = 42.0

        voltage_v = 220.0 + np.random.normal(0, 2.5) if not abnormal_condition else 190.0
        current_amps = round(power_w / max(voltage_v, 1.0), 2)
        
        records.append({
            'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
            'hour_of_day': hour,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'schedule_active': schedule_active,
            'temperature_c': round(temp_c, 2),
            'humidity_pct': round(humidity_pct, 2),
            'co2_ppm': round(max(350.0, co2_ppm), 1),
            'light_lux': round(max(0.0, light_lux), 1),
            'pir_motion': pir_motion,
            'noise_db': round(max(20.0, noise_db), 1),
            'voltage_v': round(voltage_v, 1),
            'current_amps': current_amps,
            'power_w': round(max(5.0, power_w), 1),
            'equipment_status': equipment_status,
            'prev_occupancy': prev_occ,
            'occupant_count': occupant_count,
            'required_fan_speed': fan_speed,
            'required_lighting': lighting_required,
            'abnormal_condition': abnormal_condition,
            'occupancy_status': 'OCCUPIED' if occupied == 1 else 'EMPTY'
        })
        prev_occ = occupied

    df = pd.DataFrame(records)
    # Inject ~1% realistic missing values to test preprocessing robustness
    missing_mask = np.random.rand(*df[['temperature_c', 'humidity_pct', 'co2_ppm', 'light_lux']].shape) < 0.012
    df.loc[:, ['temperature_c', 'humidity_pct', 'co2_ppm', 'light_lux']] = np.where(
        missing_mask, np.nan, df[['temperature_c', 'humidity_pct', 'co2_ppm', 'light_lux']]
    )

    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} rows to '{output_path}'.")
    return df

if __name__ == '__main__':
    generate_classroom_lab_data('/smart_classroom_ml/classroom_lab_data.csv')
