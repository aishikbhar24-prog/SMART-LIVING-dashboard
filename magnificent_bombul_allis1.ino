#include <LiquidCrystal.h>

// =====================================================
// LCD
// RS, E, D4, D5, D6, D7
// =====================================================
LiquidCrystal lcd(12, 11, 4, 3, A3, A4);

// =====================================================
// INPUTS
// =====================================================
const int pirPin    = 2;
const int ldrPin    = A0;
const int tempPin   = A1;
const int energyPin = A2;

// =====================================================
// OUTPUTS
// =====================================================
const int fanPin    = 5;
const int buzzerPin = 7;

const int led1 = 8;
const int led2 = 9;
const int led3 = 10;

// =====================================================
// SYSTEM SETTINGS
// =====================================================

// LDR
const int DARK_THRESHOLD = 400;

// Temperature
const float FAN_TEMP = 28.0;

// Maximum simulated power
const float MAX_POWER = 1500.0;

// High power warning
const float BUZZER_POWER = 800.0;

// Electricity tariff
const float COST_PER_KWH = 8.0;

// Assumed appliance loads
const float LIGHT_POWER = 150.0;
const float FAN_POWER = 80.0;

// Estimated standby/unnecessary load
const float EMPTY_ROOM_SAVING = 100.0;

// Occupancy prediction contribution
const float OCCUPANCY_LOAD = 40.0;

// Temperature prediction factor
const float TEMP_LOAD_FACTOR = 50.0;

// High predicted demand
const float HIGH_DEMAND = 1200.0;

// Empty room power warning
const float EMPTY_POWER_LIMIT = 150.0;

// =====================================================
// ENERGY VARIABLES
// =====================================================

float totalEnergy = 0.0;
float currentPower = 0.0;
float predictedPower = 0.0;
float optimizedPower = 0.0;
float savingPower = 0.0;
float electricityCost = 0.0;

unsigned long previousEnergyTime = 0;

// =====================================================
// LCD
// =====================================================

int screen = 0;

const unsigned long SCREEN_INTERVAL = 5000;

unsigned long lastScreenChange = 0;

// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(9600);

  // Inputs
  pinMode(pirPin, INPUT);

  // Outputs
  pinMode(fanPin, OUTPUT);
  pinMode(buzzerPin, OUTPUT);

  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  pinMode(led3, OUTPUT);

  // Initial OFF state
  digitalWrite(fanPin, LOW);

  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
  digitalWrite(led3, LOW);

  noTone(buzzerPin);

  // LCD
  lcd.begin(16, 2);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("SMART ENERGY");

  lcd.setCursor(0, 1);
  lcd.print("MANAGEMENT");

  delay(2000);

  lcd.clear();

  // Start timers
  previousEnergyTime = millis();
  lastScreenChange = millis();
}

// =====================================================
// READ TEMPERATURE
// =====================================================

float readTemperature()
{
  int raw = analogRead(tempPin);

  float voltage = raw * (5.0 / 1023.0);

  // TMP36 formula
  float temperature = (voltage - 0.5) * 100.0;

  return temperature;
}

// =====================================================
// READ POWER
// =====================================================

float readPower()
{
  int raw = analogRead(energyPin);

  float power = (raw / 1023.0) * MAX_POWER;

  return power;
}

// =====================================================
// UPDATE ENERGY
// =====================================================

void updateEnergy(float power)
{
  unsigned long now = millis();

  unsigned long elapsedMilliseconds =
    now - previousEnergyTime;

  if (elapsedMilliseconds > 0)
  {
    // Convert milliseconds to hours
    float elapsedHours =
      elapsedMilliseconds / 3600000.0;

    // Energy = Power × Time
    float energyAdded =
      (power * elapsedHours) / 1000.0;

    totalEnergy += energyAdded;

    previousEnergyTime = now;
  }

  // Electricity cost
  electricityCost =
    totalEnergy * COST_PER_KWH;
}

// =====================================================
// PREDICT POWER
// =====================================================

float calculatePredictedPower(
  float power,
  bool occupied,
  float temperature,
  bool lights,
  bool fan)
{
  float predicted = power;

  // Occupancy contribution
  if (occupied)
  {
    predicted += OCCUPANCY_LOAD;
  }

  // Temperature contribution
  if (temperature > FAN_TEMP)
  {
    predicted +=
      (temperature - FAN_TEMP)
      * TEMP_LOAD_FACTOR;
  }

  // Lighting contribution
  if (lights)
  {
    predicted += LIGHT_POWER;
  }

  // Fan contribution
  if (fan)
  {
    predicted += FAN_POWER;
  }

  return predicted;
}

// =====================================================
// CALCULATE OPTIMIZED POWER
// =====================================================

float calculateOptimizedPower(
  float predicted,
  bool occupied,
  int ldr)
{
  float optimized = predicted;

  // If room is empty,
  // unnecessary load can be removed
  if (!occupied)
  {
    optimized -= EMPTY_ROOM_SAVING;
  }

  // If environment is bright,
  // unnecessary lighting can be removed
  if (ldr >= DARK_THRESHOLD)
  {
    optimized -= LIGHT_POWER;
  }

  // Never allow negative power
  if (optimized < 0)
  {
    optimized = 0;
  }

  return optimized;
}

// =====================================================
// CONTROL LIGHTS
// =====================================================

bool controlLights(bool occupied, int ldr)
{
  bool lights = false;

  // Lights ON only when:
  // Person present + dark environment

  if (occupied && ldr < DARK_THRESHOLD)
  {
    lights = true;
  }

  if (lights)
  {
    digitalWrite(led1, HIGH);
    digitalWrite(led2, HIGH);
    digitalWrite(led3, HIGH);
  }
  else
  {
    digitalWrite(led1, LOW);
    digitalWrite(led2, LOW);
    digitalWrite(led3, LOW);
  }

  return lights;
}

// =====================================================
// CONTROL FAN
// =====================================================

bool controlFan(bool occupied, float temperature)
{
  bool fan = false;

  if (occupied && temperature >= FAN_TEMP)
  {
    fan = true;
  }

  if (fan)
  {
    digitalWrite(fanPin, HIGH);
  }
  else
  {
    digitalWrite(fanPin, LOW);
  }

  return fan;
}

// =====================================================
// CONTROL BUZZER
// =====================================================

void controlBuzzer(float power)
{
  if (power >= BUZZER_POWER)
  {
    tone(buzzerPin, 1000);
  }
  else
  {
    noTone(buzzerPin);
  }
}

// =====================================================
// AI RECOMMENDATION
// =====================================================

String getRecommendation(
  float power,
  float predicted,
  bool occupied,
  bool lights,
  int ldr)
{
  if (power >= BUZZER_POWER)
  {
    return "REDUCE LOAD";
  }

  if (predicted > HIGH_DEMAND)
  {
    return "HIGH DEMAND";
  }

  if (!occupied && power > EMPTY_POWER_LIMIT)
  {
    return "TURN OFF LOAD";
  }

  if (!occupied && lights)
  {
    return "LIGHTS OFF";
  }

  if (!occupied)
  {
    return "ROOM EMPTY";
  }

  if (ldr >= DARK_THRESHOLD && lights)
  {
    return "LIGHT NOT NEEDED";
  }

  return "SYSTEM OPTIMAL";
}

// =====================================================
// LCD SCREEN 0
// =====================================================

void displayMain(
  float temperature,
  float power,
  bool occupied,
  bool fan)
{
  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("T:");
  lcd.print(temperature, 1);
  lcd.print("C ");

  lcd.print("P:");
  lcd.print(power, 0);
  lcd.print("W");

  lcd.setCursor(0, 1);

  lcd.print("PIR:");

  if (occupied)
    lcd.print("ON ");
  else
    lcd.print("OFF");

  lcd.print("F:");

  if (fan)
    lcd.print("ON");
  else
    lcd.print("OFF");
}

// =====================================================
// LCD SCREEN 1
// =====================================================

void displayLights(int ldr, bool lights)
{
  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("LIGHT:");

  if (lights)
    lcd.print("ON");
  else
    lcd.print("OFF");

  lcd.setCursor(0, 1);

  lcd.print("LDR:");
  lcd.print(ldr);

  if (ldr < DARK_THRESHOLD)
    lcd.print(" DARK");
  else
    lcd.print(" BRIGHT");
}

// =====================================================
// LCD SCREEN 2
// =====================================================

void displayEnergy()
{
  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("E:");
  lcd.print(totalEnergy, 3);
  lcd.print("kWh");

  lcd.setCursor(0, 1);

  lcd.print("Rs:");
  lcd.print(electricityCost, 2);
}

// =====================================================
// LCD SCREEN 3
// =====================================================

void displayPrediction()
{
  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("PRED:");
  lcd.print(predictedPower, 0);
  lcd.print("W");

  lcd.setCursor(0, 1);

  lcd.print("OPT:");
  lcd.print(optimizedPower, 0);
  lcd.print("W");
}

// =====================================================
// LCD SCREEN 4
// =====================================================

void displayAI(String recommendation)
{
  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print("AI:");

  lcd.print(recommendation);

  lcd.setCursor(0, 1);

  lcd.print("SAVE:");
  lcd.print(savingPower, 0);
  lcd.print("W");
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop()
{
  // ===================================================
  // READ SENSORS
  // ===================================================

  int pir = digitalRead(pirPin);

  int ldr = analogRead(ldrPin);

  float temperature = readTemperature();

  currentPower = readPower();


  // ===================================================
  // OCCUPANCY
  // ===================================================

  bool occupied = (pir == HIGH);


  // ===================================================
  // CONTROL LIGHTS
  // ===================================================

  bool lights =
    controlLights(occupied, ldr);


  // ===================================================
  // CONTROL FAN
  // ===================================================

  bool fan =
    controlFan(occupied, temperature);


  // ===================================================
  // BUZZER
  // ===================================================

  controlBuzzer(currentPower);


  // ===================================================
  // ENERGY
  // ===================================================

  updateEnergy(currentPower);


  // ===================================================
  // PREDICTION
  // ===================================================

  predictedPower =
    calculatePredictedPower(
      currentPower,
      occupied,
      temperature,
      lights,
      fan
    );


  // ===================================================
  // OPTIMIZATION
  // ===================================================

  optimizedPower =
    calculateOptimizedPower(
      predictedPower,
      occupied,
      ldr
    );


  // ===================================================
  // SAVING
  // ===================================================

  savingPower =
    predictedPower - optimizedPower;

  if (savingPower < 0)
  {
    savingPower = 0;
  }


  // ===================================================
  // AI RECOMMENDATION
  // ===================================================

  String recommendation =
    getRecommendation(
      currentPower,
      predictedPower,
      occupied,
      lights,
      ldr
    );


  // ===================================================
  // CHANGE LCD SCREEN
  // ===================================================

  if (millis() - lastScreenChange >= SCREEN_INTERVAL)
  {
    screen++;

    if (screen > 4)
    {
      screen = 0;
    }

    lastScreenChange = millis();
  }


  // ===================================================
  // DISPLAY
  // ===================================================

  if (screen == 0)
  {
    displayMain(
      temperature,
      currentPower,
      occupied,
      fan
    );
  }

  else if (screen == 1)
  {
    displayLights(
      ldr,
      lights
    );
  }

  else if (screen == 2)
  {
    displayEnergy();
  }

  else if (screen == 3)
  {
    displayPrediction();
  }

  else if (screen == 4)
  {
    displayAI(recommendation);
  }


  // ===================================================
  // SERIAL MONITOR
  // ===================================================

  Serial.println();
  Serial.println("================================");
  Serial.println(" SMART ENERGY MANAGEMENT");
  Serial.println("================================");

  Serial.print("PIR / Occupancy : ");

  if (occupied)
    Serial.println("OCCUPIED");
  else
    Serial.println("EMPTY");


  Serial.print("LDR             : ");
  Serial.println(ldr);


  Serial.print("Temperature     : ");
  Serial.print(temperature, 2);
  Serial.println(" C");


  Serial.print("Current Power   : ");
  Serial.print(currentPower, 2);
  Serial.println(" W");


  Serial.print("Energy          : ");
  Serial.print(totalEnergy, 5);
  Serial.println(" kWh");


  Serial.print("Electricity Cost: Rs ");
  Serial.println(electricityCost, 4);


  Serial.print("Predicted Power : ");
  Serial.print(predictedPower, 2);
  Serial.println(" W");


  Serial.print("Optimized Power : ");
  Serial.print(optimizedPower, 2);
  Serial.println(" W");


  Serial.print("Potential Saving: ");
  Serial.print(savingPower, 2);
  Serial.println(" W");


  Serial.print("Lights          : ");

  if (lights)
    Serial.println("ON");
  else
    Serial.println("OFF");


  Serial.print("Fan             : ");

  if (fan)
    Serial.println("ON");
  else
    Serial.println("OFF");


  Serial.print("Buzzer          : ");

  if (currentPower >= BUZZER_POWER)
    Serial.println("ON");
  else
    Serial.println("OFF");


  Serial.print("AI Recommendation: ");
  Serial.println(recommendation);

  Serial.println("================================");

  delay(200);
}