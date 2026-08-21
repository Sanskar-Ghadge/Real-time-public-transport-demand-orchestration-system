import React, { useState, useEffect } from 'react';
import { detectAnomaly } from '../services/api';

const TEST_CASES = [
    { zone_id: 'ZONE_41.7200_-87.6250', hour: 2, demand: 85.0, is_weekend: 0 },
    { zone_id: 'ZONE_41.7250_-87.6300', hour: 8, demand: 15.0, is_weekend: 0 },
    { zone_id: 'ZONE_41.7300_-87.6200', hour: 23, demand: 92.0, is_weekend: 1 },
    { zone_id: 'ZONE_41.7200_-87.6250', hour: 14, demand: 12.0, is_weekend: 1 },
];

function AnomalyAlerts() {
    const [alerts, setAlerts]     = useState([]);
    const [loading, setLoading]   = useState(false);
    const [scanning, setScanning] = useState(false);

    const runScan = async () => {
        setLoading(true);
        setScanning(true);
        const newAlerts = [];

        for (const testCase of TEST_CASES) {
            try {
                const res = await detectAnomaly(testCase);
                newAlerts.push({
                    ...res,
                    timestamp: new Date().toLocaleTimeString(),
                    hour: testCase.hour,
                    demand: testCase.demand
                });
            } catch (err) {
                console.error('Error conducting anomaly check:', err);
            }
        }

        setAlerts(prev => [...newAlerts, ...prev]);
        setLoading(false);
        setScanning(false);
    };

    // Auto scan every 30 seconds
    useEffect(() => {
        runScan();
        const interval = setInterval(runScan, 30000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity) => {
        if (severity === 'HIGH')   return 'var(--accent-red)';
        if (severity === 'MEDIUM') return 'var(--accent-orange)';
        return 'var(--accent-green)';
    };

    const getSeverityBadgeClass = (severity) => {
        if (severity === 'HIGH')   return 'badge-red';
        if (severity === 'MEDIUM') return 'badge-orange';
        return 'badge-green';
    };

    const anomalies = alerts.filter(a => a.is_anomaly);
    const normals   = alerts.filter(a => !a.is_anomaly);

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="page-title-section">
                <div>
                    <h2 className="page-title">🚨 Anomaly Detection</h2>
                    <p className="page-subtitle">Isolation Forest model scanning live telemetry streams for crowd surges</p>
                </div>
                <button
                    onClick={runScan}
                    disabled={loading}
                    className="btn-primary"
                >
                    {scanning ? '🔄 Scanning Network...' : '🔍 Trigger Scan Now'}
                </button>
            </div>

            {/* Summary Cards Row */}
            <div className="stats-container">
                <div className="stat-item" style={{ borderLeft: '4px solid var(--accent-red)' }}>
                    <span className="stat-lbl">Anomalies Detected</span>
                    <span className="stat-val" style={{ color: 'var(--accent-red)' }}>{anomalies.length}</span>
                </div>
                <div className="stat-item" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                    <span className="stat-lbl">Normal Telemetry</span>
                    <span className="stat-val" style={{ color: 'var(--accent-green)' }}>{normals.length}</span>
                </div>
                <div className="stat-item" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                    <span className="stat-lbl">Total Scans Executed</span>
                    <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>{alerts.length}</span>
                </div>
            </div>

            {/* Alert Feed Container */}
            <div className="glass-card">
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Live Alert Feed</h3>
                
                {alerts.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', fontSize: '14px' }}>
                        Establishing telemetry handshake. Awaiting scanner signals...
                    </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            className="glass-card"
                            style={{
                                padding: '16px 20px',
                                borderLeft: `5px solid ${getSeverityColor(alert.is_anomaly ? alert.severity : 'NORMAL')}`,
                                background: 'rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#fff' }}>
                                        {alert.zone_id}
                                    </span>
                                    <span className={`badge ${getSeverityBadgeClass(alert.is_anomaly ? alert.severity : 'NORMAL')}`}>
                                        {alert.is_anomaly ? `${alert.severity} ANOMALY` : 'NORMAL'}
                                    </span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                    ⌛ {alert.timestamp}
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                {alert.message}
                            </p>
                            
                            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                                <span>Hour: {alert.hour}:00</span>
                                <span>|</span>
                                <span>Ridership: {alert.demand} pax/hr</span>
                                <span>|</span>
                                <span>Model Score: {alert.score}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnomalyAlerts;
