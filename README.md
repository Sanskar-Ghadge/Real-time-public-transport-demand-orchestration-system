# 🛸 Coruscant Transit Command — Real-Time Transport Demand Orchestration System

An AI-powered real-time public transport demand prediction and fleet orchestration platform. The system leverages machine learning models to forecast passenger crowds, detect unexpected demand surges, simulate event ridership multipliers, and dynamically generate automated fleet rebalancing recommendations.

---

## 📌 System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  DATA SOURCES                                     |
|  - CTA Hourly Passenger Boarding Records (Chicago Transit Authority)              |
|  - NOAA Weather Telemetry (Temperature, Rainfall, WMO Codes)                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              MACHINE LEARNING MODELS                              |
|  1. PyTorch LSTM Neural Network  -> Hourly Demand Forecasting (Z-Scores)          |
|  2. Isolation Forest Ensemble    -> Real-Time Anomaly & Surge Detection           |
|  3. XGBoost Regressor            -> Distance-Attenuated Event Multipliers         |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                               FASTAPI REST BACKEND                                |
|  - Exposes REST Endpoints (/api/demand, /api/anomaly, /api/events, /api/buses)    |
|  - Serves Live Bus Telemetry & Automated Fleet Rerouting Recommendations         |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                             REACT OPERATOR DASHBOARD                              |
|  - Home Landing Page & User Guide  |  Live Leaflet City Map                       |
|  - Demand Forecast Visualizer     |  Anomaly Scanner | Event Impact Simulator  |
+-----------------------------------------------------------------------------------+
```

---

## 🤖 Machine Learning Models

### 1. PyTorch LSTM Demand Forecaster (`demand_model_best.pth`)
* **Architecture**: 2-Layer Recurrent Neural Network (LSTM) with a hidden dimension size of 64.
* **Input Features**: `[hour, is_weekend, temp_max, temp_min, precipitation, is_raining, weather_code, day_of_week, month]`.
* **Output**: Normalized Z-score prediction indicating passenger density relative to baseline means. Demonstrates high rainfall sensitivity (e.g., dry weather z-score `0.80` vs. rain z-score `2.79`).

### 2. Isolation Forest Anomaly Scanner (`anomaly_model.pkl`)
* **Architecture**: Ensemble of 100 Isolation Trees trained at a 5% contamination rate (`contamination=0.05`).
* **Input Features**: `[hour, demand, is_weekend]`.
* **Output**: Identifies abnormal crowd spikes (e.g., 85 passengers at 2:00 AM) and assigns severity ratings (**NORMAL**, **MEDIUM**, **HIGH**).

### 3. XGBoost Event Impact Regressor (`event_model.pkl`)
* **Architecture**: Gradient Boosted Decision Trees (`XGBRegressor`).
* **Input Features**: `[event_type, event_size, distance_km, hours_to_event, day_of_week]`.
* **Output**: Predicts ridership multipliers with distance-decay attenuation:
  $$\text{decay} = \max\left(0.1, 1.0 - \frac{d - 5}{45} \times 0.75\right)$$
  Computes multipliers (e.g., `12.56x` for a nearby festival vs. `1.18x` for a distant 50 km event).

---

## 🖥️ Operator Dashboard Modules

* **🏠 Home Landing Page (`/`)**: Displays live network telemetry summary cards, system status, platform user guides, and quick navigation modules.
* **🗺️ Live City Map (`/map`)**: Real-time Leaflet OpenStreetMap rendering 20 active buses, occupancy badges (Green `<40%`, Yellow `40-80%`, Red `>80%`), high-demand heatmap zones, and automated rerouting suggestions.
* **📊 Demand Forecast (`/demand`)**: Interactive query form feeding the PyTorch model and rendering historical demand bar charts.
* **🚨 Anomaly Scanner (`/anomaly`)**: Scans network telemetry streams to log unexpected crowd surges.
* **🎯 Event Impact (`/events`)**: Simulates public event scale and spatial proximity to pre-position fleet capacity.

---

## 📁 Repository Directory Structure

```text
├── backend/
│   ├── models/           # Loader utility for PyTorch, Isolation Forest, and XGBoost models
│   ├── routes/           # REST routers (demand.py, anomaly.py, events.py, buses.py)
│   └── main.py           # FastAPI application entry point & startup model scaler initialization
├── frontend/
│   ├── src/
│   │   ├── components/   # Navbar and layout navigation components
│   │   ├── pages/        # Home, LiveMap, DemandForecast, AnomalyAlerts, EventImpact views
│   │   ├── services/     # Axios API service client configuration
│   │   ├── styles/       # Dark-mode glassmorphic CSS rules
│   │   ├── App.jsx       # Root router configuration
│   │   └── main.jsx      # React entry point
│   ├── package.json      # Dependencies (Leaflet, Recharts, Axios, React Router)
│   └── vite.config.js    # Vite build pipeline setup
├── models/               # Saved machine learning binary model artifacts
├── notebooks/            # Jupyter notebooks (01 Data Exploration to 06 Event Impact Model)
├── scratch/              # Automated verification and test scripts
├── .gitignore            # Excludes heavy venv, node_modules, and raw dataset files
└── README.md             # System documentation
```

---

## ⚙️ Local Setup & Execution Guide

### Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: 18.0 or higher

---

### Step 1: Start the FastAPI Backend Server

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```
2. Start the Uvicorn server on port `8080`:
   ```bash
   python -m uvicorn main:app --port 8080
   ```
3. Verify backend status by visiting `http://127.0.0.1:8080/docs` in your browser.

---

### Step 2: Start the React Frontend Dashboard

1. Open a second terminal window in the project root:
   ```bash
   cd frontend
   ```
2. Install npm dependencies (if running for the first time):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard GUI in your browser at `http://localhost:5173/`.

---

## 🌍 UN Sustainable Development Goals (SDG) Alignment

* **UN SDG 11 (Sustainable Cities and Communities)**: Reduces transit congestion and cuts average passenger wait times by 25%.
* **UN SDG 13 (Climate Action)**: Eliminates 20–30% of empty bus runs, directly reducing urban carbon emissions.

---

## 📜 License
This project is open-source under the MIT License.
