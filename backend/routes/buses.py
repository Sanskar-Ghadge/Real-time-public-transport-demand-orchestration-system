from fastapi import APIRouter
import numpy as np

router = APIRouter()

# Chicago zone coordinates from dataset
ZONES = [
    {"zone_id": "ZONE_41.7200_-87.6250", "lat": 41.7200, "lon": -87.6250},
    {"zone_id": "ZONE_41.7250_-87.6300", "lat": 41.7250, "lon": -87.6300},
    {"zone_id": "ZONE_41.7300_-87.6200", "lat": 41.7300, "lon": -87.6200},
    {"zone_id": "ZONE_41.8800_-87.6300", "lat": 41.8800, "lon": -87.6300},
    {"zone_id": "ZONE_41.8850_-87.6350", "lat": 41.8850, "lon": -87.6350},
]

def generate_buses():
    buses = []
    for i in range(20):
        zone = ZONES[i % len(ZONES)]
        buses.append({
            "bus_id":    f"BUS_{str(i+1).zfill(3)}",
            "lat":       float(zone["lat"] + np.random.uniform(-0.005, 0.005)),
            "lon":       float(zone["lon"] + np.random.uniform(-0.005, 0.005)),
            "zone_id":   zone["zone_id"],
            "occupancy": int(np.random.randint(5, 95)),
            "capacity":  60,
            "route":     f"Route {np.random.randint(1, 15)}",
            "speed_kmh": int(np.random.randint(10, 45)),
            "status":    "active"
        })
    return buses

@router.get("/live")
async def get_live_buses():
    buses = generate_buses()
    return {
        "total_buses": len(buses),
        "buses": buses,
        "status": "success"
    }

@router.get("/stats")
async def get_fleet_stats():
    buses = generate_buses()
    return {
        "total":     len(buses),
        "available": len([b for b in buses if b["occupancy"] < 40]),
        "half_full": len([b for b in buses if 40 <= b["occupancy"] < 80]),
        "full":      len([b for b in buses if b["occupancy"] >= 80]),
        "avg_occupancy": round(
            float(sum(b["occupancy"] for b in buses) / len(buses)), 1
        )
    }

@router.get("/recommendations")
async def get_fleet_recommendations():
    buses      = generate_buses()
    empty      = [b for b in buses if b["occupancy"] < 40]
    full_zones = [b for b in buses if b["occupancy"] > 80]

    recommendations = []
    for i, full_bus in enumerate(full_zones[:3]):
        if i < len(empty):
            recommendations.append({
                "bus_id":      empty[i]["bus_id"],
                "action":      "REROUTE",
                "from_zone":   empty[i]["zone_id"],
                "to_zone":     full_bus["zone_id"],
                "reason":      f"Zone {full_bus['zone_id']} at "
                               f"{full_bus['occupancy']}% capacity",
                "eta_minutes": int(np.random.randint(3, 15)),
                "priority":    "HIGH" if full_bus["occupancy"] > 90 
                               else "MEDIUM"
            })

    return {
        "recommendations": recommendations,
        "total":           len(recommendations),
        "status":          "success"
    }

@router.get("/city-status")
async def get_city_status():
    import datetime
    buses = generate_buses()
    hour  = datetime.datetime.now().hour

    if 7 <= hour <= 10:
        demand_level = "HIGH"
        peak_status  = "Morning Peak Hour"
    elif 17 <= hour <= 20:
        demand_level = "HIGH"
        peak_status  = "Evening Peak Hour"
    elif 0 <= hour <= 5:
        demand_level = "LOW"
        peak_status  = "Off Peak Hours"
    else:
        demand_level = "MODERATE"
        peak_status  = "Normal Operations"

    return {
        "total_buses":     len(buses),
        "avg_occupancy":   round(
            float(sum(b["occupancy"] for b in buses) / len(buses)), 1
        ),
        "demand_level":    demand_level,
        "peak_status":     peak_status,
        "active_alerts":   2,
        "system_health":   "OPERATIONAL",
        "last_updated":    datetime.datetime.now().strftime("%H:%M:%S")
    }
