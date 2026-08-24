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
    title="Chicago Transit Command API",
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
    SCALER_PATH = os.path.join(BASE_DIR, '../models/saved/demand_scalers.pkl')

    with open(SCALER_PATH, 'rb') as f:
        scalers = pickle.load(f)
        demand_scaler_X = scalers['scaler_X']
        demand_scaler_y = scalers['scaler_y']

    print("All models and scalers loaded successfully")

# ── Register Routes ────────────────────────────────────────────────
app.include_router(demand.router,  prefix="/api/demand",  tags=["Demand"])
app.include_router(anomaly.router, prefix="/api/anomaly", tags=["Anomaly"])
app.include_router(events.router,  prefix="/api/events",  tags=["Events"])
app.include_router(buses.router,   prefix="/api/buses",   tags=["Buses"])

# ── Health Check ───────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "Chicago Transit Command API is running",
        "status":  "online",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
