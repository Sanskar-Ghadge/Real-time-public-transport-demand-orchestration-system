import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("--- Testing Live Buses Telemetry Endpoint ---")
try:
    res = requests.get(f"{BASE_URL}/api/buses/live")
    print(f"Status Code: {res.status_code}")
    print(f"Total buses: {res.json().get('total_buses')}")
    print(f"Sample Bus: {res.json().get('buses')[0]}")
except Exception as e:
    print(f"Error querying live buses: {e}")

print("\n--- Testing Fleet Stats Endpoint ---")
try:
    res = requests.get(f"{BASE_URL}/api/buses/stats")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {json.dumps(res.json(), indent=2)}")
except Exception as e:
    print(f"Error querying fleet stats: {e}")

print("\n--- Testing Fleet Recommendations Endpoint ---")
try:
    res = requests.get(f"{BASE_URL}/api/buses/recommendations")
    print(f"Status Code: {res.status_code}")
    print(f"Response: {json.dumps(res.json(), indent=2)}")
except Exception as e:
    print(f"Error querying recommendations: {e}")
