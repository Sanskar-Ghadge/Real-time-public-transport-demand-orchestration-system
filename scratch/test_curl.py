import requests

try:
    r = requests.get("http://127.0.0.1:8080/health", timeout=5)
    print("Health:", r.status_code, r.json())
except Exception as e:
    print("Health Error:", e)

try:
    payload = {
        "zone_id": "ZONE_41.7200_-87.6250", "event_type": 3, "event_size": 0,
        "distance_km": 50.0, "hours_to_event": 12.0, "day_of_week": 2
    }
    r = requests.post("http://127.0.0.1:8080/api/events/impact", json=payload, timeout=5)
    print("Event 50km Impact:", r.status_code, r.json())
except Exception as e:
    print("Event Error:", e)
