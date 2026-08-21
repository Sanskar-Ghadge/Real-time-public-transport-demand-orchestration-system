import urllib.request
import json

def test_endpoint(url, data):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            print(f"\n--- Testing Endpoint: {url} ---")
            print(f"Status Code: {response.status}")
            print("Response Payload:", json.loads(response.read().decode('utf-8')))
    except Exception as e:
        print(f"\nFailed to call {url}: {e}")

# Root Health Check
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/") as response:
        print("\n--- Testing Root Endpoint ---")
        print("Status Code:", response.status)
        print("Response Payload:", json.loads(response.read().decode('utf-8')))
except Exception as e:
    print("Root check failed:", e)

# Anomaly Detection
anomaly_data = {
    "zone_id": "ZONE_41.7200_-87.6250",
    "hour": 2,
    "demand": 85.0,
    "is_weekend": 0
}
test_endpoint("http://127.0.0.1:8000/api/anomaly/detect", anomaly_data)

# Event Impact
event_data = {
    "zone_id": "ZONE_41.7200_-87.6250",
    "event_type": 2,
    "event_size": 2,
    "distance_km": 0.3,
    "hours_to_event": 1.0,
    "day_of_week": 6
}
test_endpoint("http://127.0.0.1:8000/api/events/impact", event_data)

# Demand Predict
demand_data = {
    "zone_id": "ZONE_41.7200_-87.6250",
    "hour": 8,
    "is_weekend": 0,
    "temp_max": 20.0,
    "temp_min": 10.0,
    "precipitation": 0.0,
    "is_raining": 0,
    "weather_code": 0,
    "day_of_week": 2,
    "month": 6
}
test_endpoint("http://127.0.0.1:8000/api/demand/predict", demand_data)
