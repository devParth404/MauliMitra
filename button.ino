#include <WiFi.h>
#include <HTTPClient.h>

// =====================================================
// WIFI SETTINGS
// =====================================================

const char* ssid = "ESPTEST";
const char* password = "12345678";


// =====================================================
// MAULI MITRA DEVICE
// =====================================================

const char* DEVICE_ID = "MM-001";


// =====================================================
// BACKEND
// =====================================================
// IMPORTANT:
// This must be the IP address of the laptop
// running Node.js backend.
//
// Example:
// Laptop 1 = 10.79.73.6
//
// DO NOT use localhost here.
// =====================================================

const char* BACKEND_URL =
    "http://10.79.73.6:3000/api/esp32/button";


// =====================================================
// BUTTON
// GPIO 4 = D4
// Button connected between GPIO 4 and GND
// =====================================================

#define BUTTON_PIN 4


// =====================================================
// DEBOUNCE
// =====================================================

unsigned long lastPressTime = 0;

const unsigned long DEBOUNCE_TIME = 1000;


// =====================================================
// WIFI CONNECTION
// =====================================================

void connectWiFi() {

  Serial.println();
  Serial.println("================================");
  Serial.println("       CONNECTING TO WIFI");
  Serial.println("================================");

  Serial.print("SSID: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);

  WiFi.setSleep(false);

  WiFi.begin(
    ssid,
    password
  );

  int attempts = 0;

  while (
    WiFi.status() != WL_CONNECTED &&
    attempts < 30
  ) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (
    WiFi.status() == WL_CONNECTED
  ) {

    Serial.println();
    Serial.println("================================");
    Serial.println("        WIFI CONNECTED");
    Serial.println("================================");

    Serial.print("ESP32 IP: ");
    Serial.println(
      WiFi.localIP()
    );

    Serial.print("Backend: ");
    Serial.println(
      BACKEND_URL
    );

    Serial.print("Signal: ");
    Serial.print(
      WiFi.RSSI()
    );

    Serial.println(" dBm");

  }

  else {

    Serial.println();
    Serial.println("================================");
    Serial.println("      WIFI CONNECTION FAILED");
    Serial.println("================================");

  }
}


// =====================================================
// SEND BUTTON REQUEST
// =====================================================

bool sendRequest() {

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    Serial.println(
      "ERROR: WiFi is not connected."
    );

    return false;
  }


  HTTPClient http;


  Serial.println();
  Serial.println("================================");
  Serial.println("       SENDING REQUEST");
  Serial.println("================================");

  Serial.print("Backend: ");
  Serial.println(
    BACKEND_URL
  );


  // Start HTTP connection

  http.begin(
    BACKEND_URL
  );


  // JSON header

  http.addHeader(
    "Content-Type",
    "application/json"
  );


  // Timeout

  http.setTimeout(
    5000
  );


  // ===================================================
  // JSON
  // ===================================================
  //
  // No zone.
  // No predefined location.
  //
  // Location will be supplied separately by
  // the live location tracker.
  // ===================================================

  String json = "{";

  json +=
    "\"deviceId\":\"" +
    String(DEVICE_ID) +
    "\",";

  json +=
    "\"deviceName\":\"Mauli Mitra " +
    String(DEVICE_ID) +
    "\",";

  json +=
    "\"deviceType\":\"ESP32 Button\"";

  json += "}";


  Serial.println();
  Serial.println(
    "Request JSON:"
  );

  Serial.println(
    json
  );


  // ===================================================
  // POST
  // ===================================================

  int httpCode =
    http.POST(
      json
    );


  // ===================================================
  // RESPONSE
  // ===================================================

  if (
    httpCode > 0
  ) {

    Serial.print(
      "HTTP Response Code: "
    );

    Serial.println(
      httpCode
    );


    String response =
      http.getString();


    Serial.println();
    Serial.println(
      "Backend Response:"
    );

    Serial.println(
      response
    );


    if (
      httpCode >= 200 &&
      httpCode < 300
    ) {

      Serial.println();
      Serial.println(
        "================================"
      );

      Serial.println(
        "   REQUEST SENT SUCCESSFULLY"
      );

      Serial.println(
        "================================"
      );


      http.end();

      return true;
    }

  }

  else {

    Serial.print(
      "HTTP POST ERROR: "
    );

    Serial.println(
      http.errorToString(
        httpCode
      )
    );

  }


  http.end();

  return false;
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  // IMPORTANT:
  // Serial Monitor = 115200 baud

  Serial.begin(
    115200
  );

  delay(
    1000
  );


  // Button

  pinMode(
    BUTTON_PIN,
    INPUT_PULLUP
  );


  // ===================================================
  // STARTUP INFORMATION
  // ===================================================

  Serial.println();

  Serial.println(
    "================================"
  );

  Serial.println(
    "       MAULI MITRA ESP32"
  );

  Serial.println(
    "================================"
  );


  Serial.print(
    "Device ID: "
  );

  Serial.println(
    DEVICE_ID
  );


  Serial.println(
    "Zones: DISABLED"
  );


  Serial.println(
    "Live Location: ENABLED"
  );


  Serial.print(
    "Backend URL: "
  );

  Serial.println(
    BACKEND_URL
  );


  // ===================================================
  // WIFI
  // ===================================================

  connectWiFi();


  // ===================================================
  // READY
  // ===================================================

  Serial.println();

  Serial.println(
    "================================"
  );

  Serial.println(
    "         SYSTEM READY"
  );

  Serial.println(
    "================================"
  );

  Serial.println(
    "Press the Mauli Mitra button..."
  );

  Serial.println();

}


// =====================================================
// LOOP
// =====================================================

void loop() {


  // ===================================================
  // CHECK WIFI
  // ===================================================

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    Serial.println();

    Serial.println(
      "WiFi disconnected."
    );

    Serial.println(
      "Reconnecting..."
    );


    connectWiFi();


    delay(
      1000
    );

  }


  // ===================================================
  // BUTTON
  // ===================================================

  if (
    digitalRead(
      BUTTON_PIN
    ) == LOW
  ) {


    unsigned long currentTime =
      millis();


    // =================================================
    // DEBOUNCE
    // =================================================

    if (
      currentTime -
      lastPressTime >=
      DEBOUNCE_TIME
    ) {


      lastPressTime =
        currentTime;


      Serial.println();

      Serial.println(
        "================================"
      );

      Serial.println(
        "     EMERGENCY BUTTON PRESSED"
      );

      Serial.println(
        "================================"
      );


      Serial.print(
        "Device ID: "
      );

      Serial.println(
        DEVICE_ID
      );


      Serial.println(
        "Location: LIVE DEVICE TRACKING"
      );


      // =================================================
      // SEND
      // =================================================

      if (
        WiFi.status() ==
        WL_CONNECTED
      ) {

        bool success =
          sendRequest();


        if (
          success
        ) {

          Serial.println();

          Serial.println(
            "Dashboard request created!"
          );

        }

        else {

          Serial.println();

          Serial.println(
            "Request failed."
          );

        }

      }

      else {

        Serial.println(
          "WiFi unavailable."
        );

      }


      // =================================================
      // WAIT RELEASE
      // =================================================

      Serial.println(
        "Waiting for button release..."
      );


      while (
        digitalRead(
          BUTTON_PIN
        ) == LOW
      ) {

        delay(
          10
        );

      }


      Serial.println(
        "Button released."
      );


      Serial.println();

    }

  }


  delay(
    30
  );

}