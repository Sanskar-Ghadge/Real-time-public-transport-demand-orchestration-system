from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from models.loader import (load_demand_model,
                           load_anomaly_model,
                           load_event_model)
from routes import demand, anomaly, events, buses
import pandas as pd
import os

# ── Create FastAPI App ─────────────────────────────────────────────
app = FastAPI(
    title="Coruscant Transit Command API",
    description="Real-Time Transport Demand and Fleet Orchestration",
    version="1.0.0"
)

# ── Allow Frontend to Connect ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load All Models on Startup ─────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    global demand_model, anomaly_model, anomaly_scaler
    global event_model, demand_scaler_X, demand_scaler_y

    print("Loading all models...")

    demand_model              = load_demand_model()
    anomaly_model, anomaly_scaler = load_anomaly_model()
    event_model               = load_event_model()

    # Load scalers
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    df = pd.read_csv(os.path.join(BASE_DIR, 
                     '../data/processed/combined_dataset_small.csv'))

    features = ['hour', 'is_weekend', 'temp_max', 'temp_min',
                'precipitation', 'is_raining', 'weather_code',
                'day_of_week', 'month']

    df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
    df['month']       = pd.to_datetime(df['date']).dt.month
    df['demand_normalized'] = df.groupby('zone_id')['demand'].transform(
        lambda x: (x - x.mean()) / (x.std() + 1e-8)
    )

    demand_scaler_X = MinMaxScaler()
    demand_scaler_y = MinMaxScaler()
    demand_scaler_X.fit(df[features])
    demand_scaler_y.fit(df['demand_normalized'].values.reshape(-1, 1))

    print("All models loaded successfully")

# ── Register Routes ────────────────────────────────────────────────
app.include_router(demand.router,  prefix="/api/demand",  tags=["Demand"])
app.include_router(anomaly.router, prefix="/api/anomaly", tags=["Anomaly"])
app.include_router(events.router,  prefix="/api/events",  tags=["Events"])
app.include_router(buses.router,   prefix="/api/buses",   tags=["Buses"])

# ── Health Check ───────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "Coruscant Transit Command API is running",
        "status":  "online",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
