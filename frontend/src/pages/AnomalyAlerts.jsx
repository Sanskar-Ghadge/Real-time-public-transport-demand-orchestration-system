import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { detectAnomaly } from '../services/api';

const TEST_CASES = [
    { zone_id: 'ZONE_41.7200_-87.6250', hour: 2, demand: 85.0, is_weekend: 0 },
    { zone_id: 'ZONE_41.7250_-87.6300', hour: 8, demand: 15.0, is_weekend: 0 },
    { zone_id: 'ZONE_41.7300_-87.6200', hour: 23, demand: 92.0, is_weekend: 1 },
    { zone_id: 'ZONE_41.7200_-87.6250', hour: 14, demand: 12.0, is_weekend: 1 },
];

// 3D Isolation Forest Radar Sweeper Component
function Radar3DCanvas({ scanning }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight || 200;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 5, 6);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const group = new THREE.Group();
        scene.add(group);

        // Concentric Radar Circles
        for (let r = 1; r <= 3; r++) {
            const circleGeo = new THREE.RingGeometry(r - 0.03, r, 64);
            const circleMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(circleGeo, circleMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }

        // Radar Sweeper Beam
        const beamGeo = new THREE.ConeGeometry(3, 3, 32, 1, false, 0, Math.PI / 3);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.rotation.x = Math.PI / 2;
        group.add(beam);

        // 3D Anomaly Surge Beacons
        const spikes = [];
        const spikeColors = [0xef4444, 0xf59e0b, 0x10b981];
        
        for (let i = 0; i < 4; i++) {
            const spikeGeo = new THREE.SphereGeometry(0.18, 16, 16);
            const spikeMat = new THREE.MeshStandardMaterial({ color: spikeColors[i % 3], emissive: spikeColors[i % 3], emissiveIntensity: 0.8 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            const angle = (i * Math.PI) / 2;
            const dist = 1.2 + Math.random() * 1.5;
            spike.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
            group.add(spike);
            spikes.push({ mesh: spike, angle, dist });
        }

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            beam.rotation.z += scanning ? 0.06 : 0.02;

            spikes.forEach(s => {
                s.mesh.scale.setScalar(1 + Math.sin(Date.now() * 0.005 + s.angle) * 0.3);
            });

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [scanning]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '200px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(5, 7, 15, 0.6)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
        />
    );
}

function AnomalyAlerts() {
    const [alerts, setAlerts]             = useState([]);
    const [loading, setLoading]           = useState(false);
    const [scanning, setScanning]         = useState(false);
    const [filterMode, setFilterMode]     = useState('ALL');
    const [acknowledged, setAcknowledged] = useState({});

    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
        card.style.boxShadow = `0 15px 30px rgba(239, 68, 68, 0.25)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
    };

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

    useEffect(() => {
        runScan();
        const interval = setInterval(runScan, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = (index) => {
        setAcknowledged(prev => ({ ...prev, [index]: true }));
    };

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

    const filteredAlerts = alerts.filter(a => {
        if (filterMode === 'ANOMALY') return a.is_anomaly;
        if (filterMode === 'HIGH') return a.is_anomaly && a.severity === 'HIGH';
        return true;
    });

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header Section */}
            <div className="page-title-section">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h2 className="page-title" style={{ margin: 0 }}>🚨 Isolation Forest Anomaly Scanner</h2>
                        <span className="badge badge-red" style={{ fontSize: '11px' }}>100 TREES (CONTAMINATION=0.05)</span>
                    </div>
                    <p className="page-subtitle">Scanning real-time telemetry streams for unexpected crowd surges and demand spikes</p>
                </div>
                <button
                    onClick={runScan}
                    disabled={loading}
                    className="btn-primary"
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '800' }}
                >
                    {scanning ? '🔄 Scanning Network...' : '🔍 Trigger Stream Scan'}
                </button>
            </div>

            {/* Top Grid: Stats Cards + 3D Radar Visualizer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* Stats Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        onClick={() => setFilterMode('HIGH')}
                        style={{
                            cursor: 'pointer',
                            borderLeft: '4px solid var(--accent-red)',
                            background: filterMode === 'HIGH' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                    >
                        <span className="stat-lbl">🚨 High Severity Surges</span>
                        <span className="stat-val" style={{ color: 'var(--accent-red)' }}>
                            {alerts.filter(a => a.is_anomaly && a.severity === 'HIGH').length} Critical
                        </span>
                    </div>

                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        onClick={() => setFilterMode('ANOMALY')}
                        style={{
                            cursor: 'pointer',
                            borderLeft: '4px solid var(--accent-orange)',
                            background: filterMode === 'ANOMALY' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-secondary)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                    >
                        <span className="stat-lbl">⚠️ Total Anomalies Detected</span>
                        <span className="stat-val" style={{ color: 'var(--accent-orange)' }}>
                            {anomalies.length} Flagged
                        </span>
                    </div>

                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        onClick={() => setFilterMode('ALL')}
                        style={{
                            cursor: 'pointer',
                            borderLeft: '4px solid var(--accent-cyan)',
                            background: filterMode === 'ALL' ? 'rgba(14, 165, 233, 0.2)' : 'var(--bg-secondary)',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                    >
                        <span className="stat-lbl">📡 Total Scans Executed</span>
                        <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>
                            {alerts.length} Records
                        </span>
                    </div>
                </div>

                {/* 3D Radar Scanner */}
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', margin: 0 }}>
                            📡 3D Telemetry Radar Sweeper
                        </h3>
                        <span className="badge badge-red">
                            {scanning ? 'SCANNING STREAM...' : 'RADAR ONLINE'}
                        </span>
                    </div>

                    <Radar3DCanvas scanning={scanning} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        <span>Algorithm: Isolation Trees</span>
                        <span>Auto-scan: 30s interval</span>
                    </div>
                </div>

            </div>

            {/* 📜 Alert Feed */}
            <div className="glass-card" style={{ padding: '28px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 }}>
                        📜 Real-Time Stream Alert Feed
                    </h3>

                    {/* Filter Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className={filterMode === 'ALL' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setFilterMode('ALL')}
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                            All ({alerts.length})
                        </button>
                        <button
                            className={filterMode === 'ANOMALY' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setFilterMode('ANOMALY')}
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                            Anomalies ({anomalies.length})
                        </button>
                    </div>
                </div>

                {filteredAlerts.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px', fontSize: '14px' }}>
                        Establishing stream telemetry handshake. Awaiting scanner signals...
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredAlerts.map((alert, index) => (
                        <div
                            key={index}
                            className="glass-card"
                            onMouseMove={handleCardMouseMove}
                            onMouseLeave={handleCardMouseLeave}
                            style={{
                                padding: '20px',
                                borderLeft: `5px solid ${getSeverityColor(alert.is_anomaly ? alert.severity : 'NORMAL')}`,
                                background: 'rgba(5, 7, 15, 0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '16px', color: '#fff' }}>
                                        {alert.zone_id}
                                    </span>
                                    <span className={`badge ${getSeverityBadgeClass(alert.is_anomaly ? alert.severity : 'NORMAL')}`}>
                                        {alert.is_anomaly ? `${alert.severity} SURGE ANOMALY` : 'NORMAL TELEMETRY'}
                                    </span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                    ⌛ Telemetry Time: {alert.timestamp}
                                </span>
                            </div>

                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                                {alert.message}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                    <span>Hour: <strong style={{ color: '#fff' }}>{alert.hour}:00</strong></span>
                                    <span>|</span>
                                    <span>Ridership: <strong style={{ color: 'var(--accent-cyan)' }}>{alert.demand} pax/hr</strong></span>
                                    <span>|</span>
                                    <span>Isolation Score: <strong style={{ color: 'var(--accent-orange)' }}>{alert.score}</strong></span>
                                </div>

                                {alert.is_anomaly && (
                                    acknowledged[index] ? (
                                        <span className="badge badge-green" style={{ padding: '6px 12px' }}>✓ SURGE ACKNOWLEDGED</span>
                                    ) : (
                                        <button
                                            className="btn-success"
                                            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700' }}
                                            onClick={() => handleAcknowledge(index)}
                                        >
                                            ⚡ Acknowledge & Deploy Fleet
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default AnomalyAlerts;
