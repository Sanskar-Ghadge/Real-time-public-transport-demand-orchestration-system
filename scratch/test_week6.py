import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("===========================================")
print("   CORUSCANT TRANSIT COMMAND - WEEK 6 TEST ")
print("===========================================")

# 1. City Status Test
print("\n--- 1. City Status Endpoint Check ---")
try:
    res = requests.get(f"{BASE_URL}/api/buses/city-status")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {json.dumps(res.json(), indent=2)}")
except Exception as e:
    print(f"Failed city status query: {e}")

# 2. Demand Forecast Test (Weather Sensitivity Test)
print("\n--- 2. Demand Forecast Weather Sensitivity Test ---")
payload_dry = {
    "zone_id": "ZONE_41.7200_-87.6250", "hour": 8, "is_weekend": 0,
    "temp_max": 20, "temp_min": 10, "precipitation": 0.0, "is_raining": 0,
    "weather_code": 0, "day_of_week": 2, "month": 6
}
payload_rain = {
    "zone_id": "ZONE_41.7200_-87.6250", "hour": 8, "is_weekend": 0,
    "temp_max": 20, "temp_min": 10, "precipitation": 15.0, "is_raining": 1,
    "weather_code": 61, "day_of_week": 2, "month": 6
}
try:
    res_dry = requests.post(f"{BASE_URL}/api/demand/predict", json=payload_dry).json()
    res_rain = requests.post(f"{BASE_URL}/api/demand/predict", json=payload_rain).json()
    print(f"Dry Weather Demand (Z-Score): {res_dry.get('predicted_demand')}")
    print(f"Rain Weather Demand (Z-Score): {res_rain.get('predicted_demand')}")
    print(f"Weather Sensitivity Verified: {res_rain.get('predicted_demand') >= res_dry.get('predicted_demand')}")
except Exception as e:
    print(f"Failed demand forecast test: {e}")

# 3. Anomaly Test
print("\n--- 3. Anomaly Detection Test ---")
surge_payload = {"zone_id": "ZONE_41.7200_-87.6250", "hour": 2, "demand": 85.0, "is_weekend": 0}
try:
    res_anomaly = requests.post(f"{BASE_URL}/api/anomaly/detect", json=surge_payload).json()
    print(f"Midnight Surge (2 AM, 85 pax) -> Anomaly: {res_anomaly.get('is_anomaly')}, Severity: {res_anomaly.get('severity')}")
except Exception as e:
    print(f"Failed anomaly test: {e}")

# 4. Event Impact Test
print("\n--- 4. Event Impact Regression Test ---")
festival_payload = {
    "zone_id": "ZONE_41.7200_-87.6250", "event_type": 2, "event_size": 2,
    "distance_km": 0.3, "hours_to_event": 1.0, "day_of_week": 6
}
try:
    res_event = requests.post(f"{BASE_URL}/api/events/impact", json=festival_payload).json()
    print(f"Large Festival (0.3km, 1hr) -> Multiplier: {res_event.get('multiplier')}x, Impact Level: {res_event.get('impact_level')}")
except Exception as e:
    print(f"Failed event impact test: {e}")
