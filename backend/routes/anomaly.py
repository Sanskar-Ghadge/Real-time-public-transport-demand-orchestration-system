from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter()

class AnomalyRequest(BaseModel):
    zone_id:    str
    hour:       int
    demand:     float
    is_weekend: int

@router.post("/detect")
async def detect_anomaly(request: AnomalyRequest):
    from main import anomaly_model, anomaly_scaler

    features = np.array([[
        request.hour,
        request.demand,
        request.is_weekend
    ]])

    features_scaled = anomaly_scaler.transform(features)
    prediction      = anomaly_model.predict(features_scaled)[0]
    score           = anomaly_model.decision_function(features_scaled)[0]

    # Convert numpy.bool_ to a standard Python bool for FastAPI JSON serialization
    is_anomaly = bool(prediction == -1)

    if is_anomaly:
        severity = "HIGH" if score < -0.3 else "MEDIUM"
    else:
        severity = "NORMAL"

    return {
        "zone_id":    request.zone_id,
        "is_anomaly": is_anomaly,
        "severity":   severity,
        "score":      round(float(score), 4),
        "hour":       request.hour,
        "demand":     request.demand,
        "message":    f"Unusual demand spike detected in {request.zone_id}" 
                      if is_anomaly else "Demand is normal",
        "status":     "success"
    }
