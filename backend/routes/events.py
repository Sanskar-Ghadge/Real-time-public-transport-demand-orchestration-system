from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd

router = APIRouter()

class EventRequest(BaseModel):
    zone_id:        str
    event_type:     int
    event_size:     int
    distance_km:    float
    hours_to_event: float
    day_of_week:    int

@router.post("/impact")
async def predict_event_impact(request: EventRequest):
    from main import event_model

    features = pd.DataFrame([{
        'event_type':     request.event_type,
        'event_size':     request.event_size,
        'distance_km':    request.distance_km,
        'hours_to_event': request.hours_to_event,
        'day_of_week':    request.day_of_week
    }])

    raw_multiplier = float(event_model.predict(features)[0])

    # Apply distance attenuation for events beyond 5 km
    if request.distance_km > 5.0:
        decay_factor = max(0.1, 1.0 - ((request.distance_km - 5.0) / 45.0) * 0.75)
        multiplier = max(1.0, 1.0 + (raw_multiplier - 1.0) * decay_factor)
    else:
        multiplier = raw_multiplier

    if multiplier >= 3.0:
        impact_level = "HIGH"
    elif multiplier >= 1.5:
        impact_level = "MEDIUM"
    else:
        impact_level = "LOW"

    return {
        "zone_id":      request.zone_id,
        "multiplier":   round(float(multiplier), 2),
        "impact_level": impact_level,
        "message":      f"Demand expected to be {round(float(multiplier), 2)}x normal",
        "status":       "success"
    }
