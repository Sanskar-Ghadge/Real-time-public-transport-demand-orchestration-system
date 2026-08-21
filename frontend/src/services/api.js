import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8080';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// ── Health Check ──────────────────────────────────────────────────
export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

// ── Demand Prediction ─────────────────────────────────────────────
export const predictDemand = async (data) => {
    const response = await api.post('/api/demand/predict', data);
    return response.data;
};

// ── Anomaly Detection ─────────────────────────────────────────────
export const detectAnomaly = async (data) => {
    const response = await api.post('/api/anomaly/detect', data);
    return response.data;
};

// ── Event Impact ──────────────────────────────────────────────────
export const predictEventImpact = async (data) => {
    const response = await api.post('/api/events/impact', data);
    return response.data;
};

// ── Live Buses Telemetry ──────────────────────────────────────────
export const getLiveBuses = async () => {
    const response = await api.get('/api/buses/live');
    return response.data;
};

// ── Fleet Capacity Stats ──────────────────────────────────────────
export const getFleetStats = async () => {
    const response = await api.get('/api/buses/stats');
    return response.data;
};

// ── Automated Recommendations ─────────────────────────────────────
export const getRecommendations = async () => {
    const response = await api.get('/api/buses/recommendations');
    return response.data;
};

// ── City Status Metrics ───────────────────────────────────────────
export const getCityStatus = async () => {
    const response = await api.get('/api/buses/city-status');
    return response.data;
};
