"""
End-to-End Machine Learning System for:
"SMART AUTOMATION OF CLASSROOM LABS"
Covers Steps 1 through 13: Analysis, Preprocessing, Feature Engineering,
Model Training, Cross-Validation, Evaluation, Explainability, and Artifact Export.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor, IsolationForest
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report, mean_absolute_error, mean_squared_error, r2_score
)

def step_1_dataset_analysis(df: pd.DataFrame):
    print("\n" + "="*70)
    print("STEP 1: DATASET ANALYSIS & INSPECTION")
    print("="*70)
    print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
    print("\nColumns and Data Types:")
    for col, dtype in df.dtypes.items():
        print(f" - {col:25s}: {str(dtype):10s} (Unique values: {df[col].nunique()})")
        
    print("\nMissing Values:")
    missing = df.isnull().sum()
    print(missing[missing > 0] if missing.sum() > 0 else "No missing values found.")
    
    print("\nDuplicate Records:")
    duplicates = df.duplicated().sum()
    print(f"Total duplicate rows: {duplicates}")
    
    print("\nTarget Variable Candidate Analysis:")
    # We inspect candidate targets present in data
    candidate_targets = ['occupancy_status', 'occupant_count', 'power_w', 'required_fan_speed', 'abnormal_condition']
    for cand in candidate_targets:
        if cand in df.columns:
            if df[cand].dtype == 'object' or df[cand].nunique() <= 10:
                val_counts = df[cand].value_counts(normalize=True).to_dict()
                formatted_counts = {k: f"{v*100:.1f}%" for k, v in val_counts.items()}
                print(f" • '{cand}': Classification (Distribution: {formatted_counts})")
            else:
                print(f" • '{cand}': Continuous Regression (Range: {df[cand].min()} to {df[cand].max()})")
                
    print("\nDECISION ON TARGETS:")
    print(" 1. PRIMARY TARGET (Classification): 'occupancy_status' (OCCUPIED vs EMPTY)")
    print("    -> Fundamental signal to activate/deactivate equipment relays.")
    print(" 2. SECONDARY TARGET (Regression): 'power_w' (Expected Power Consumption)")
    print("    -> Essential for predictive load forecasting and peak shaving.")
    print(" 3. ANOMALY DETECTION: 'abnormal_condition' (Electrical surge / sensor failure)")
    print("="*70)

def step_2_and_3_preprocessing_and_feature_engineering(df: pd.DataFrame):
    print("\n" + "="*70)
    print("STEPS 2 & 3: PREPROCESSING & FEATURE ENGINEERING")
    print("="*70)
    
    data = df.copy()
    
    # Handle duplicates if any
    data = data.drop_duplicates().reset_index(drop=True)
    
    # Missing Value Imputation (Median for numerical features)
    numeric_cols = ['temperature_c', 'humidity_pct', 'co2_ppm', 'light_lux', 'noise_db', 'voltage_v', 'current_amps']
    imputer = SimpleImputer(strategy='median')
    data[numeric_cols] = imputer.fit_transform(data[numeric_cols])
    print(f"Imputed missing values for numerical columns using median values.")
    
    # -------------------------------------------------------------
    # FEATURE ENGINEERING (DOMAIN-SPECIFIC IOT SENSOR SIGNALS)
    # -------------------------------------------------------------
    # 1. Temperature-Humidity Discomfort Index / Heat Index proxy
    #    Useful because perceived heat dictates fan/AC cooling requirement
    data['thi_heat_index'] = (
        data['temperature_c'] - 0.55 * (1 - 0.01 * data['humidity_pct']) * (data['temperature_c'] - 14.5)
    ).round(2)
    
    # 2. Human Metabolic Signal Ratio: CO2 / Temperature interaction
    #    Humans release both CO2 and body heat; a simultaneous rise is a strong occupancy indicator
    data['co2_temp_ratio'] = (data['co2_ppm'] / (data['temperature_c'] + 1e-5)).round(2)
    
    # 3. Ambient Activity Factor: Motion * Noise
    #    Eliminates noise spikes when no motion is present (e.g., outdoor traffic)
    data['activity_factor'] = (data['pir_motion'] * data['noise_db']).round(2)
    
    # 4. Apparent Power (VA) and Power Factor Deviation
    data['apparent_power_va'] = (data['voltage_v'] * data['current_amps']).round(2)
    
    # 5. Delta CO2 from atmospheric baseline (400 ppm)
    data['co2_above_ambient'] = np.maximum(0, data['co2_ppm'] - 400.0)
    
    # 6. Cyclical Time Encoding: Hour of day mapped to sin/cos
    data['hour_sin'] = np.sin(2 * np.pi * data['hour_of_day'] / 24.0)
    data['hour_cos'] = np.cos(2 * np.pi * data['hour_of_day'] / 24.0)
    
    print("Engineered 6 new domain features:")
    print(" - 'thi_heat_index': Thermal comfort indicator for fan/AC control.")
    print(" - 'co2_temp_ratio': Exhaled CO2 vs room thermal balance.")
    print(" - 'activity_factor': Interaction between motion and audio volume.")
    print(" - 'apparent_power_va': Real-time electrical volt-amp product.")
    print(" - 'co2_above_ambient': Direct excess CO2 proxy for human density.")
    print(" - 'hour_sin', 'hour_cos': Continuous periodic time encoding.")
    
    # Encode Target
    data['target_occupancy'] = (data['occupancy_status'] == 'OCCUPIED').astype(int)
    
    feature_columns = [
        'hour_of_day', 'is_weekend', 'schedule_active',
        'temperature_c', 'humidity_pct', 'co2_ppm', 'light_lux',
        'pir_motion', 'noise_db', 'voltage_v', 'current_amps',
        'thi_heat_index', 'co2_temp_ratio', 'activity_factor',
        'apparent_power_va', 'co2_above_ambient', 'hour_sin', 'hour_cos',
        'prev_occupancy'
    ]
    
    return data, feature_columns, imputer

def step_4_5_6_train_and_evaluate_models(data: pd.DataFrame, feature_cols: list):
    print("\n" + "="*70)
    print("STEPS 4, 5 & 6: MODEL TRAINING, TUNING & EVALUATION")
    print("="*70)
    
    X = data[feature_cols]
    y_clf = data['target_occupancy']
    y_reg = data['power_w']
    
    # Train-test split (80% train, 20% test, stratified for classification)
    X_train, X_test, y_train_clf, y_test_clf, y_train_reg, y_test_reg = train_test_split(
        X, y_clf, y_reg, test_size=0.20, random_state=42, stratify=y_clf
    )
    
    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # -------------------------------------------------------------
    # 1. OCCUPANCY CLASSIFICATION MODELS
    # -------------------------------------------------------------
    classifiers = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(max_depth=5, min_samples_split=10, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42),
        'Support Vector Machine (RBF)': SVC(probability=True, kernel='rbf', C=1.5, random_state=42)
    }
    
    clf_results = []
    trained_clfs = {}
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    print("\n[CLASSIFICATION BENCHMARK: LAB OCCUPANCY (EMPTY vs OCCUPIED)]")
    print(f"{'Model':<28} | {'CV Accuracy':<11} | {'Test Acc':<9} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'ROC-AUC':<9}")
    print("-" * 100)
    
    for name, model in classifiers.items():
        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train_clf, cv=cv, scoring='accuracy')
        
        # Fit on train set
        model.fit(X_train_scaled, y_train_clf)
        trained_clfs[name] = model
        
        # Predictions
        preds = model.predict(X_test_scaled)
        probs = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else preds
        
        acc = accuracy_score(y_test_clf, preds)
        prec = precision_score(y_test_clf, preds)
        rec = recall_score(y_test_clf, preds)
        f1 = f1_score(y_test_clf, preds)
        roc = roc_auc_score(y_test_clf, probs)
        
        clf_results.append({
            'Model': name,
            'CV_Accuracy': cv_scores.mean(),
            'Test_Accuracy': acc,
            'Precision': prec,
            'Recall': rec,
            'F1_Score': f1,
            'ROC_AUC': roc
        })
        
        print(f"{name:<28} | {cv_scores.mean():<11.4f} | {acc:<9.4f} | {prec:<9.4f} | {rec:<9.4f} | {f1:<9.4f} | {roc:<9.4f}")
        
    best_clf_name = max(clf_results, key=lambda x: x['F1_Score'])['Model']
    best_clf = trained_clfs[best_clf_name]
    print(f"\n=> Best Performing Classifier: '{best_clf_name}'")
    
    # Detailed report for best classifier
    y_best_pred = best_clf.predict(X_test_scaled)
    print("\nConfusion Matrix for Best Model:")
    cm = confusion_matrix(y_test_clf, y_best_pred)
    print(f" [[True Empty: {cm[0,0]:3d}, False Occupied: {cm[0,1]:3d}],")
    print(f"  [False Empty: {cm[1,0]:3d}, True Occupied: {cm[1,1]:3d}]]")
    
    # -------------------------------------------------------------
    # 2. POWER CONSUMPTION REGRESSION MODELS
    # -------------------------------------------------------------
    regressors = {
        'Linear Regression': LinearRegression(),
        'Ridge Regression': Ridge(alpha=1.0),
        'Random Forest Regressor': RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42),
        'Gradient Boosting Regressor': GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
    }
    
    reg_results = []
    trained_regs = {}
    
    print("\n[REGRESSION BENCHMARK: EXPECTED POWER CONSUMPTION (Watts)]")
    print(f"{'Model':<30} | {'MAE (Watts)':<12} | {'RMSE (Watts)':<13} | {'R² Score':<9}")
    print("-" * 72)
    
    for name, model in regressors.items():
        model.fit(X_train_scaled, y_train_reg)
        trained_regs[name] = model
        
        preds = model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test_reg, preds)
        rmse = np.sqrt(mean_squared_error(y_test_reg, preds))
        r2 = r2_score(y_test_reg, preds)
        
        reg_results.append({
            'Model': name,
            'MAE': mae,
            'RMSE': rmse,
            'R2': r2
        })
        print(f"{name:<30} | {mae:<12.2f} | {rmse:<13.2f} | {r2:<9.4f}")
        
    best_reg_name = max(reg_results, key=lambda x: x['R2'])['Model']
    best_reg = trained_regs[best_reg_name]
    print(f"\n=> Best Performing Regressor: '{best_reg_name}' (R² = {max(reg_results, key=lambda x: x['R2'])['R2']:.4f})")
    
    # -------------------------------------------------------------
    # 3. ANOMALY DETECTION MODEL (Isolation Forest)
    # -------------------------------------------------------------
    iso_forest = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    iso_forest.fit(X_train_scaled)
    print("\n=> Trained Unsupervised Isolation Forest for hardware anomaly detection.")
    
    return {
        'best_clf': best_clf,
        'best_clf_name': best_clf_name,
        'best_reg': best_reg,
        'best_reg_name': best_reg_name,
        'iso_forest': iso_forest,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'clf_results': clf_results,
        'reg_results': reg_results
    }

def step_7_smart_automation_engine(occupancy_pred: int, temp_c: float, light_lux: float, power_w: float, is_anomaly: bool, manual_override: bool = False):
    """
    Step 7: Smart Automation Logic Engine
    Connects ML predictions directly to safe, deterministic hardware relay states.
    """
    if manual_override:
        return {
            'mode': 'MANUAL_OVERRIDE',
            'relay_light': 'MAINTAIN_CURRENT',
            'relay_fan': 'MAINTAIN_CURRENT',
            'relay_ac': 'MAINTAIN_CURRENT',
            'relay_equipment': 'MAINTAIN_CURRENT',
            'alert': 'Manual override is active. Automation decisions paused.'
        }
        
    if is_anomaly:
        return {
            'mode': 'SAFETY_SHUTDOWN',
            'relay_light': 1, # keep lights for safety egress
            'relay_fan': 0,
            'relay_ac': 0,
            'relay_equipment': 0, # cut equipment power to prevent fire/damage
            'alert': 'CRITICAL ALERT: Sensor/Electrical Anomaly Detected! Non-essential equipment isolated.'
        }
        
    if occupancy_pred == 0:
        # Lab is Empty
        # If power is high (>100W), flag waste
        waste_detected = power_w > 120.0
        return {
            'mode': 'ECO_STANDBY',
            'relay_light': 0,
            'relay_fan': 0,
            'relay_ac': 0,
            'relay_equipment': 0, # standby power mode
            'fan_speed_pwm': 0,
            'ac_setpoint_c': None,
            'alert': 'Energy Waste Detected: Empty room drawing power! Auto-shutoff triggered.' if waste_detected else 'Room empty: All systems in low-power standby.'
        }
    else:
        # Lab is Occupied
        # Light control: Only turn ON if ambient light is below standard classroom threshold (300 lux)
        relay_light = 1 if light_lux < 300.0 else 0
        
        # Fan & AC thermal control
        if temp_c >= 27.5:
            relay_ac = 1
            ac_setpoint_c = 23.0
            relay_fan = 1
            fan_speed_pwm = 255 # max
        elif temp_c >= 25.0:
            relay_ac = 1
            ac_setpoint_c = 24.5
            relay_fan = 1
            fan_speed_pwm = 175 # medium-high
        elif temp_c >= 23.0:
            relay_ac = 0
            ac_setpoint_c = None
            relay_fan = 1
            fan_speed_pwm = 110 # eco
        else:
            relay_ac = 0
            ac_setpoint_c = None
            relay_fan = 0
            fan_speed_pwm = 0
            
        return {
            'mode': 'OCCUPIED_OPTIMIZATION',
            'relay_light': relay_light,
            'relay_fan': relay_fan,
            'relay_ac': relay_ac,
            'relay_equipment': 1,
            'fan_speed_pwm': fan_speed_pwm,
            'ac_setpoint_c': ac_setpoint_c,
            'alert': 'Classroom active: Smart lighting and thermal management engaged.'
        }

def step_9_real_time_predict(raw_reading: dict, artifacts: dict):
    """
    Step 9: Accepts a raw JSON dictionary from ESP32/sensor and runs complete inference.
    """
    scaler = artifacts['scaler']
    best_clf = artifacts['best_clf']
    best_reg = artifacts['best_reg']
    iso_forest = artifacts['iso_forest']
    feature_cols = artifacts['feature_cols']
    
    # Feature calculations
    temp_c = float(raw_reading.get('temperature_c', 25.0))
    hum = float(raw_reading.get('humidity_pct', 55.0))
    co2 = float(raw_reading.get('co2_ppm', 650.0))
    lux = float(raw_reading.get('light_lux', 250.0))
    pir = int(raw_reading.get('pir_motion', 1))
    noise = float(raw_reading.get('noise_db', 45.0))
    voltage = float(raw_reading.get('voltage_v', 220.0))
    power = float(raw_reading.get('power_w', 650.0))
    current = round(power / max(voltage, 1.0), 2)
    hour = int(raw_reading.get('hour_of_day', 14))
    weekend = int(raw_reading.get('is_weekend', 0))
    sched = int(raw_reading.get('schedule_active', 1))
    prev_occ = int(raw_reading.get('prev_occupancy', 1))
    
    thi = round(temp_c - 0.55 * (1 - 0.01 * hum) * (temp_c - 14.5), 2)
    co2_temp = round(co2 / (temp_c + 1e-5), 2)
    act_fac = round(pir * noise, 2)
    va = round(voltage * current, 2)
    co2_above = max(0.0, co2 - 400.0)
    hour_sin = np.sin(2 * np.pi * hour / 24.0)
    hour_cos = np.cos(2 * np.pi * hour / 24.0)
    
    input_df = pd.DataFrame([{
        'hour_of_day': hour, 'is_weekend': weekend, 'schedule_active': sched,
        'temperature_c': temp_c, 'humidity_pct': hum, 'co2_ppm': co2,
        'light_lux': lux, 'pir_motion': pir, 'noise_db': noise,
        'voltage_v': voltage, 'current_amps': current,
        'thi_heat_index': thi, 'co2_temp_ratio': co2_temp, 'activity_factor': act_fac,
        'apparent_power_va': va, 'co2_above_ambient': co2_above,
        'hour_sin': hour_sin, 'hour_cos': hour_cos, 'prev_occupancy': prev_occ
    }])[feature_cols]
    
    scaled_feats = scaler.transform(input_df)
    
    # 1. Occupancy Prediction
    occ_pred = int(best_clf.predict(scaled_feats)[0])
    occ_prob = float(best_clf.predict_proba(scaled_feats)[0][occ_pred]) if hasattr(best_clf, 'predict_proba') else 1.0
    
    # 2. Predicted Power
    predicted_power = round(float(best_reg.predict(scaled_feats)[0]), 1)
    
    # 3. Anomaly check
    iso_score = iso_forest.predict(scaled_feats)[0]
    is_anomaly = True if iso_score == -1 else False
    
    # 4. Automation decisions
    decision = step_7_smart_automation_engine(
        occupancy_pred=occ_pred,
        temp_c=temp_c,
        light_lux=lux,
        power_w=power,
        is_anomaly=is_anomaly
    )
    
    return {
        'occupancy': 'OCCUPIED' if occ_pred == 1 else 'EMPTY',
        'confidence_score': round(occ_prob * 100, 1),
        'predicted_power_w': predicted_power,
        'actual_power_w': power,
        'anomaly_flag': is_anomaly,
        'automation_decision': decision
    }

def step_11_explainability(best_clf, feature_cols):
    print("\n" + "="*70)
    print("STEP 11: MODEL EXPLAINABILITY & FEATURE IMPORTANCE")
    print("="*70)
    if hasattr(best_clf, 'feature_importances_'):
        importances = best_clf.feature_importances_
        sorted_idx = np.argsort(importances)[::-1]
        print("Feature Importance Ranking for Occupancy Prediction:")
        for rank, idx in enumerate(sorted_idx[:8], 1):
            bar = "█" * int(importances[idx] * 40)
            print(f" {rank:2d}. {feature_cols[idx]:<22s}: {importances[idx]*100:5.2f}% | {bar}")
    elif hasattr(best_clf, 'coef_'):
        coeffs = np.abs(best_clf.coef_[0])
        sorted_idx = np.argsort(coeffs)[::-1]
        print("Top Feature Weights (Absolute Coefficients):")
        for rank, idx in enumerate(sorted_idx[:8], 1):
            print(f" {rank:2d}. {feature_cols[idx]:<22s}: {coeffs[idx]:.4f}")

def step_12_save_artifacts(artifacts: dict, output_dir: str):
    print("\n" + "="*70)
    print("STEP 12: SAVING TRAINED ARTIFACTS")
    print("="*70)
    os.makedirs(output_dir, exist_ok=True)
    
    joblib.dump(artifacts['best_clf'], os.path.join(output_dir, 'model_occupancy.pkl'))
    joblib.dump(artifacts['best_reg'], os.path.join(output_dir, 'model_power.pkl'))
    joblib.dump(artifacts['iso_forest'], os.path.join(output_dir, 'model_anomaly.pkl'))
    joblib.dump(artifacts['scaler'], os.path.join(output_dir, 'scaler.pkl'))
    
    with open(os.path.join(output_dir, 'feature_columns.json'), 'w') as f:
        json.dump(artifacts['feature_cols'], f, indent=2)
        
    print(f"Successfully saved all ML model artifacts to: '{output_dir}'")
    print(" - model_occupancy.pkl (Classifier)")
    print(" - model_power.pkl (Regressor)")
    print(" - model_anomaly.pkl (Isolation Forest)")
    print(" - scaler.pkl (StandardScaler)")
    print(" - feature_columns.json (Metadata)")

if __name__ == '__main__':
    data_path = '/app/applet/smart_classroom_ml/classroom_lab_data.csv'
    if not os.path.exists(data_path):
        data_path = 'classroom_lab_data.csv'
        
    df_raw = pd.read_csv(data_path)
    
    # 1. Dataset Analysis
    step_1_dataset_analysis(df_raw)
    
    # 2 & 3. Preprocessing & Feature Engineering
    df_processed, feature_cols, imputer = step_2_and_3_preprocessing_and_feature_engineering(df_raw)
    
    # 4, 5 & 6. Training & Evaluation
    trained_artifacts = step_4_5_6_train_and_evaluate_models(df_processed, feature_cols)
    
    # 11. Explainability
    step_11_explainability(trained_artifacts['best_clf'], feature_cols)
    
    # 12. Save Artifacts
    export_dir = '/app/applet/smart_classroom_ml/artifacts'
    step_12_save_artifacts(trained_artifacts, export_dir)
    
    # 9. Test Live Real-Time Prediction
    print("\n" + "="*70)
    print("STEP 9: REAL-TIME INFERENCE TEST ON NEW SENSOR STREAM")
    print("="*70)
    
    sample_occupied_telemetry = {
        'temperature_c': 28.0,
        'humidity_pct': 65.0,
        'co2_ppm': 1180.0,
        'light_lux': 180.0,
        'pir_motion': 1,
        'noise_db': 64.0,
        'power_w': 850.0,
        'voltage_v': 220.0,
        'hour_of_day': 10,
        'is_weekend': 0,
        'schedule_active': 1,
        'prev_occupancy': 1
    }
    
    pred_res = step_9_real_time_predict(sample_occupied_telemetry, trained_artifacts)
    print("Incoming Telemetry (Sample 1: Active Class in Progress):")
    print(f" Readings: Temp=28°C, Humidity=65%, CO2=1180ppm, Light=180lux, Motion=1, Power=850W")
    print("ML Output & Actuator Automation Directives:")
    print(json.dumps(pred_res, indent=2))
    
    sample_empty_waste_telemetry = {
        'temperature_c': 23.0,
        'humidity_pct': 48.0,
        'co2_ppm': 420.0,
        'light_lux': 450.0, # lights left on
        'pir_motion': 0,
        'noise_db': 31.0,
        'power_w': 720.0,   # fans + lights running with zero occupants!
        'voltage_v': 220.0,
        'hour_of_day': 19,
        'is_weekend': 0,
        'schedule_active': 0,
        'prev_occupancy': 0
    }
    
    pred_res_2 = step_9_real_time_predict(sample_empty_waste_telemetry, trained_artifacts)
    print("\nIncoming Telemetry (Sample 2: Empty Lab with Energy Waste):")
    print(f" Readings: Temp=23°C, Humidity=48%, CO2=420ppm, Light=450lux, Motion=0, Power=720W")
    print("ML Output & Actuator Automation Directives:")
    print(json.dumps(pred_res_2, indent=2))
