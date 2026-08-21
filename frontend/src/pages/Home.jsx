import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCityStatus } from '../services/api';

function Home() {
    const navigate = useNavigate();
    const [cityStatus, setCityStatus] = useState(null);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await getCityStatus();
                setCityStatus(data);
            } catch (err) {
                console.error('Failed to fetch city status:', err);
            }
            setLoading(false);
        };
        fetchStatus();
    }, []);

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Hero Section */}
            <div className="glass-card result-card-glow" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <span className="badge badge-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
                        🟢 SYSTEM ONLINE & OPERATIONAL
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                        Version 1.0.0 | AI Transit Orchestration System
                    </span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#fff', lineHeight: '1.2' }}>
                    🛸 Coruscant Transit Command
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0, maxWidth: '850px', lineHeight: '1.6' }}>
                    An AI-powered real-time public transport demand prediction and fleet orchestration platform.
                    Predict passenger crowds with PyTorch LSTMs, detect real-time anomalies with Isolation Forests, and dynamically rebalance bus fleets.
                </p>
            </div>

            {/* Live City Status Bar */}
            <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', margin: 0 }}>
                    ⚡ Real-time Network Telemetry Summary
                </h3>
                <div className="stats-container" style={{ marginTop: '16px' }}>
                    <div className="stat-item">
                        <span className="stat-lbl">🚌 Active Fleet</span>
                        <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>
                            {loading ? '...' : cityStatus?.total_buses || 20} Buses
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-lbl">📊 Average Occupancy</span>
                        <span className="stat-val" style={{ color: 'var(--accent-green)' }}>
                            {loading ? '...' : `${cityStatus?.avg_occupancy || 50}%`}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-lbl">🕒 Peak Status</span>
                        <span className="stat-val" style={{ color: 'var(--accent-orange)' }}>
                            {loading ? '...' : cityStatus?.peak_status || 'Normal Operations'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-lbl">🔥 Network Demand</span>
                        <span className="stat-val" style={{ color: 'var(--accent-red)' }}>
                            {loading ? '...' : cityStatus?.demand_level || 'MODERATE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Platform User Guide & Access Instructions */}
            <div className="glass-card" style={{ padding: '28px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0, marginBottom: '8px' }}>
                        📖 Platform User Guide & Navigation Manual
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Follow these instructions to navigate and test all features of the operator dashboard effectively.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    {/* Guide 1: Live Map */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🗺️</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>1. Live City Map</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0, marginBottom: '12px' }}>
                            Track 20 active buses moving across Chicago in real time. Hover or click markers to inspect telemetry:
                        </p>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li><strong style={{ color: 'var(--accent-green)' }}>Green Badge (&lt;40%)</strong>: Available capacity.</li>
                            <li><strong style={{ color: 'var(--accent-orange)' }}>Yellow Badge (40-80%)</strong>: Moderate capacity.</li>
                            <li><strong style={{ color: 'var(--accent-red)' }}>Red Badge (&gt;80%)</strong>: High occupancy alert.</li>
                            <li><strong style={{ color: 'var(--accent-cyan)' }}>Red Circles</strong>: Zones with &gt;60 passengers/hr.</li>
                        </ul>
                    </div>

                    {/* Guide 2: Demand Forecast */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px' }}>📊</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>2. Demand Forecast</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0, marginBottom: '12px' }}>
                            Query the trained PyTorch LSTM neural network to predict future passenger crowds:
                        </p>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li>Select target zone, hour (0-23), and day type.</li>
                            <li>Toggle weather inputs (e.g. <strong>Is Raining = Yes</strong>).</li>
                            <li>Click <strong>Predict Demand</strong> to compute normalized Z-scores and demand level badges.</li>
                        </ul>
                    </div>

                    {/* Guide 3: Anomaly Alerts */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🚨</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>3. Anomaly Alerts</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0, marginBottom: '12px' }}>
                            Run the Isolation Forest model to scan stream data for abnormal passenger spikes:
                        </p>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li>Click <strong>Trigger Scan Now</strong> to scan test scenarios.</li>
                            <li>Identifies unexpected surges (e.g., 85 pax at 2 AM).</li>
                            <li>Renders color-coded severity cards (NORMAL / MEDIUM / HIGH).</li>
                        </ul>
                    </div>

                    {/* Guide 4: Event Impact */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🎯</span>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>4. Event Impact</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', margin: 0, marginBottom: '12px' }}>
                            Simulate public events to pre-position fleet capacity hours before crowds disperse:
                        </p>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li>Choose event type (Concert, Match, Festival).</li>
                            <li>Input event scale, distance (km), and start time.</li>
                            <li>Calculates demand multiplier (e.g. <strong>12.56x multiplier</strong> for large festivals).</li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Interactive Feature Cards */}
            <div>
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    🚀 Quick Feature Navigation
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    
                    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => navigate('/map')}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗺️</div>
                        <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 6px 0' }}>Live City Map</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, marginBottom: '16px' }}>
                            View 20 tracked buses, live occupancy metrics, and automated rerouting suggestions.
                        </p>
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}>Launch Map →</button>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => navigate('/demand')}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                        <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 6px 0' }}>Demand Forecast</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, marginBottom: '16px' }}>
                            Predict future passenger demand using weather and temporal LSTM parameters.
                        </p>
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}>Launch Forecast →</button>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => navigate('/anomaly')}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚨</div>
                        <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 6px 0' }}>Anomaly Scanner</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, marginBottom: '16px' }}>
                            Scan network telemetry to flag unusual crowd surges with Isolation Forests.
                        </p>
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}>Launch Scanner →</button>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => navigate('/events')}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                        <h4 style={{ color: '#fff', fontSize: '16px', margin: '0 0 6px 0' }}>Event Impact</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, marginBottom: '16px' }}>
                            Simulate venue proximity and event scale to calculate ridership multipliers.
                        </p>
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}>Launch Simulator →</button>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Home;
