/*
 * VibeGuard NeuroEdge - Arduino Firmware
 * Target: Arduino Uno / Nano / Nano 33 BLE / ESP32
 * Sensors:
 *   - MPU6050 Accelerometer (I2C: A4=SDA, A5=SCL)
 *   - Tachometer / Hall Sensor (Interrupt Digital Pin 2)
 *   - DS18B20 / NTC Temperature Probe (Analog Pin A0)
 *   - Safety Interlock Relay Module (Digital Pin 7)
 * Output: Serial JSON packets at 115200 baud
 */

#include <Wire.h>

const int MPU_ADDR = 0x68;
const int RELAY_PIN = 7;
const int TACHO_PIN = 2;
const int TEMP_PIN = A0;

volatile unsigned long pulse_count = 0;
unsigned long last_rpm_calc = 0;
float current_rpm = 0.0;
unsigned long packet_seq = 0;

void countPulse() {
  pulse_count++;
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // Wait for serial connection
  
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Closed (normal operation)
  
  pinMode(TACHO_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(TACHO_PIN), countPulse, FALLING);
  
  // Initialize MPU6050
  Wire.begin();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1
  Wire.write(0);    // Wake up MPU
  Wire.endTransmission(true);

  // Set Accelerometer to +/- 8g
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1C); // ACCEL_CONFIG
  Wire.write(0x10); // 8g scale
  Wire.endTransmission(true);
}

void loop() {
  // Check for incoming commands from Snapdragon PC (e.g., TRIP_RELAY or RESET_RELAY)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "TRIP_RELAY") {
      digitalWrite(RELAY_PIN, LOW); // Open relay, halt motor
    } else if (cmd == "RESET_RELAY") {
      digitalWrite(RELAY_PIN, HIGH); // Re-energize
    }
  }

  // Calculate RPM once every 500ms
  unsigned long now = millis();
  if (now - last_rpm_calc >= 500) {
    detachInterrupt(digitalPinToInterrupt(TACHO_PIN));
    // Assuming 1 pulse per shaft revolution
    current_rpm = (pulse_count * 60000.0) / (now - last_rpm_calc);
    pulse_count = 0;
    last_rpm_calc = now;
    attachInterrupt(digitalPinToInterrupt(TACHO_PIN), countPulse, FALLING);
  }

  // Read Temperature (Analog thermistor approximation)
  int raw_temp = analogRead(TEMP_PIN);
  float voltage = raw_temp * (5.0 / 1023.0);
  float temp_c = (voltage - 0.5) * 100.0; // TMP36 scaling or thermistor map
  if (temp_c < 0 || temp_c > 150) temp_c = 35.0; // Fallback bound

  // Read Burst of 64 Acceleration samples from MPU6050
  packet_seq++;
  Serial.print("{\"seq\":");
  Serial.print(packet_seq);
  Serial.print(",\"rpm\":");
  Serial.print(current_rpm);
  Serial.print(",\"temp_c\":");
  Serial.print(temp_c, 1);
  Serial.print(",\"ax\":[");

  for (int i = 0; i < 64; i++) {
    Wire.beginTransmission(MPU_ADDR);
    Wire.write(0x3B); // ACCEL_XOUT_H
    Wire.endTransmission(false);
    Wire.requestFrom(MPU_ADDR, 2, true);
    
    int16_t raw_ax = (Wire.read() << 8) | Wire.read();
    float ax_g = raw_ax / 4096.0; // +/- 8g scale factor

    Serial.print(ax_g, 3);
    if (i < 63) Serial.print(",");
    delayMicroseconds(1000); // 1 kHz sampling interval
  }

  Serial.println("]}");
  delay(50); // Transmit at ~20Hz packet rate
}
