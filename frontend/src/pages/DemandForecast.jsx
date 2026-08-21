import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, 
         Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { predictDemand } from '../services/api';

const ZONES = [
    'ZONE_41.7200_-87.6250',
    'ZONE_41.7250_-87.6300',
    'ZONE_41.7300_-87.6200',
];

function DemandForecast() {
    const [form, setForm]         = useState({
        zone_id: ZONES[0], hour: 8, is_weekend: 0,
        temp_max: 20, temp_min: 10, precipitation: 0,
        is_raining: 0, weather_code: 1, day_of_week: 2, month: 6
    });
    const [result, setResult]     = useState(null);
    const [loading, setLoading]   = useState(false);
    const [chartData, setChartData] = useState([]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await predictDemand({
                ...form,
                hour: parseInt(form.hour),
                is_weekend: parseInt(form.is_weekend),
                temp_max: parseFloat(form.temp_max),
                temp_min: parseFloat(form.temp_min),
                precipitation: parseFloat(form.precipitation),
                is_raining: parseInt(form.is_raining),
                weather_code: parseInt(form.weather_code),
                day_of_week: parseInt(form.day_of_week),
                month: parseInt(form.month)
            });
            setResult(res);
            
            // Add or update data point in chart
            setChartData(prev => {
                const label = `${res.zone_id.substring(5, 12)} H:${form.hour}`;
                // Avoid duplicates by filtering old entries for same zone & hour
                const filtered = prev.filter(item => item.key !== `${res.zone_id}-${form.hour}`);
                return [...filtered, {
                    key: `${res.zone_id}-${form.hour}`,
                    hour: label,
                    demand: res.predicted_demand
                }];
            });
        } catch (err) {
            alert('Error connecting to backend: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="page-title-section">
                <div>
                    <h2 className="page-title">📊 Demand Forecast</h2>
                    <p className="page-subtitle">LSTM neural network forecasting passenger ridership demand patterns</p>
                </div>
            </div>

            {/* Input Form Card */}
            <div className="glass-card">
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Input Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group">
                        <label>Zone ID</label>
                        <select
                            className="form-control"
                            value={form.zone_id}
                            onChange={e => setForm({ ...form, zone_id: e.target.value })}
                        >
                            {ZONES.map(z => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Hour (0-23)</label>
                        <input
                            type="number" min="0" max="23"
                            className="form-control"
                            value={form.hour}
                            onChange={e => setForm({ ...form, hour: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Day Type</label>
                        <select
                            className="form-control"
                            value={form.is_weekend}
                            onChange={e => setForm({ ...form, is_weekend: e.target.value })}
                        >
                            <option value={0}>Weekday</option>
                            <option value={1}>Weekend</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Max Temp (°C)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={form.temp_max}
                            onChange={e => setForm({ ...form, temp_max: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Is Raining?</label>
                        <select
                            className="form-control"
                            value={form.is_raining}
                            onChange={e => setForm({ ...form, is_raining: e.target.value })}
                        >
                            <option value={0}>No</option>
                            <option value={1}>Yes</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Month (1-12)</label>
                        <input
                            type="number" min="1" max="12"
                            className="form-control"
                            value={form.month}
                            onChange={e => setForm({ ...form, month: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', maxWidth: '240px' }}
                >
                    {loading ? '🔮 Querying model...' : '🔮 Predict Demand'}
                </button>
            </div>

            {/* Results Row */}
            {result && (
                <div className="glass-card result-card-glow">
                    <h3 style={{ color: 'var(--accent-cyan)', fontSize: '16px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase' }}>
                        Prediction Output
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Zone</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{result.zone_id}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Time</div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Hour {result.hour}:00</div>
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Demand Level</div>
                            <span className={`badge ${
                                result.predicted_demand > 1.0 ? 'badge-red' :
                                result.predicted_demand > 0.5 ? 'badge-orange' : 'badge-green'
                            }`}>
                                {
                                    result.predicted_demand > 1.0 ? 'HIGH DEMAND' :
                                    result.predicted_demand > 0.5 ? 'MODERATE DEMAND' : 'LOW DEMAND'
                                }
                            </span>
                        </div>
                        <div style={{ flex: 1, minWidth: '150px', textAlign: 'left' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Predicted Demand (Z-Score)</div>
                            <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                                {result.predicted_demand}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Historical Charts */}
            {chartData.length > 0 && (
                <div className="glass-card">
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Forecast History</h3>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="hour" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                                <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        borderColor: 'var(--glass-border)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }} 
                                />
                                <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }} />
                                <Bar
                                    dataKey="demand"
                                    fill="url(#cyanGrad)"
                                    name="Predicted Demand Value"
                                    radius={[6, 6, 0, 0]}
                                >
                                    <defs>
                                        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-cyan)" />
                                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.4} />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DemandForecast;
