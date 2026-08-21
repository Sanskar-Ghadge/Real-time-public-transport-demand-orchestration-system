from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import torch
import numpy as np

router = APIRouter()

# Request body structure
class DemandRequest(BaseModel):
    zone_id:       str
    hour:          int
    is_weekend:    int
    temp_max:      float
    temp_min:      float
    precipitation: float
    is_raining:    int
    weather_code:  int
    day_of_week:   int
    month:         int

@router.post("/predict")
async def predict_demand(request: DemandRequest):
    from main import demand_model, demand_scaler_X, demand_scaler_y

    # Build feature array
    features = np.array([[
        request.hour,
        request.is_weekend,
        request.temp_max,
        request.temp_min,
        request.precipitation,
        request.is_raining,
        request.weather_code,
        request.day_of_week,
        request.month
    ]])

    # Scale features
    features_scaled = demand_scaler_X.transform(features)

    # Create sequence (repeat for 24 timesteps)
    sequence = np.tile(features_scaled, (24, 1))
    sequence = torch.tensor(sequence, dtype=torch.float32).unsqueeze(0)

    # Predict
    with torch.no_grad():
        prediction_scaled = demand_model(sequence).numpy()

    prediction = demand_scaler_y.inverse_transform(prediction_scaled)

    return {
        "zone_id":          request.zone_id,
        "predicted_demand": round(float(prediction[0][0]), 2),
        "hour":             request.hour,
        "status":           "success"
    }
