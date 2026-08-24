import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, 
         Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as THREE from 'three';
import { predictDemand } from '../services/api';

const ZONES = [
    'ZONE_41.7200_-87.6250',
    'ZONE_41.7250_-87.6300',
    'ZONE_41.7300_-87.6200',
];

// 3D Neural Net Visualizer
function NeuralNet3DCanvas() {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight || 220;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 8);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x0ea5e9, 2, 20);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const group = new THREE.Group();
        scene.add(group);

        // 3 Layers: Input (4), LSTM Hidden (5), Output (1)
        const layers = [
            [-3, [ -1.5, -0.5, 0.5, 1.5 ]],
            [ 0, [ -2.0, -1.0, 0.0, 1.0, 2.0 ]],
            [ 3, [ 0.0 ]]
        ];

        const nodeMeshes = [];
        const nodeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.9 });
        const outMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.9 });

        layers.forEach(([x, yList], lIdx) => {
            yList.forEach(y => {
                const mat = lIdx === 2 ? outMat : nodeMat;
                const node = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mat);
                node.position.set(x, y, 0);
                group.add(node);
                nodeMeshes.push({ mesh: node, layer: lIdx, x, y });
            });
        });

        // Connection Lines
        const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
        const points = [];
        nodeMeshes.forEach(n1 => {
            nodeMeshes.forEach(n2 => {
                if (n2.layer === n1.layer + 1) {
                    points.push(n1.x, n1.y, 0);
                    points.push(n2.x, n2.y, 0);
                }
            });
        });
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            group.rotation.y = Math.sin(Date.now() * 0.001) * 0.25;
            group.rotation.x = Math.cos(Date.now() * 0.001) * 0.15;
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
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '220px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(5, 7, 15, 0.6)',
                border: '1px solid rgba(14, 165, 233, 0.25)'
            }}
        />
    );
}

function DemandForecast() {
    const [form, setForm]         = useState({
        zone_id: ZONES[0], hour: 8, is_weekend: 0,
        temp_max: 20, temp_min: 10, precipitation: 0,
        is_raining: 0, weather_code: 1, day_of_week: 2, month: 6
    });
    const [result, setResult]     = useState(null);
    const [loading, setLoading]   = useState(false);
    const [chartData, setChartData] = useState([]);

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
        card.style.boxShadow = `0 15px 30px rgba(14, 165, 233, 0.2)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
    };

    const setPreset = (presetType) => {
        if (presetType === 'RAIN') {
            setForm(f => ({ ...f, hour: 17, is_raining: 1, precipitation: 12.5, temp_max: 14 }));
        } else if (presetType === 'PEAK') {
            setForm(f => ({ ...f, hour: 8, is_raining: 0, precipitation: 0, is_weekend: 0, temp_max: 22 }));
        } else if (presetType === 'NIGHT') {
            setForm(f => ({ ...f, hour: 2, is_raining: 0, precipitation: 0, is_weekend: 1, temp_max: 15 }));
        }
    };

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
            
            setChartData(prev => {
                const label = `${res.zone_id.substring(5, 12)} H:${form.hour}`;
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header */}
            <div className="page-title-section">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h2 className="page-title" style={{ margin: 0 }}>📊 PyTorch LSTM Demand Forecaster</h2>
                        <span className="badge badge-cyan" style={{ fontSize: '11px' }}>2-LAYER RECURRENT NEURAL NET</span>
                    </div>
                    <p className="page-subtitle">Multi-feature temporal ridership forecasting with NOAA weather sensitivity</p>
                </div>
            </div>

            {/* Top Grid: Form + 3D Neural Canvas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* 🎛️ Input Form */}
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '28px',
                        border: '1px solid rgba(14, 165, 233, 0.35)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', margin: 0 }}>
                            Input Model Parameters
                        </h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="badge badge-cyan" onClick={() => setPreset('PEAK')} style={{ cursor: 'pointer' }}>☀️ Peak</button>
                            <button className="badge badge-orange" onClick={() => setPreset('RAIN')} style={{ cursor: 'pointer' }}>🌧️ Rain</button>
                            <button className="badge badge-purple" onClick={() => setPreset('NIGHT')} style={{ cursor: 'pointer' }}>🌙 Night</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label>Target Zone</label>
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
                            <label>Hour of Day ({form.hour}:00)</label>
                            <input
                                type="range" min="0" max="23"
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
                            <label>Max Temp ({form.temp_max}°C)</label>
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
                                <option value={0}>No (Dry)</option>
                                <option value={1}>Yes (Rainy)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Precipitation (mm)</label>
                            <input
                                type="number" step="0.5"
                                className="form-control"
                                value={form.precipitation}
                                onChange={e => setForm({ ...form, precipitation: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary"
                        style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '800' }}
                    >
                        {loading ? '⚡ Running PyTorch Inference...' : '🔮 Predict Demand (LSTM)'}
                    </button>
                </div>

                {/* 🧠 3D Neural Net Visualizer Card */}
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', margin: 0 }}>
                                🧠 PyTorch LSTM Architecture
                            </h3>
                            <span className="badge badge-green">64 HIDDEN UNITS</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '14px' }}>
                            Live 3D Graph representing feature vectors flowing through input, recurrent LSTM layers, and dense Z-score regressor.
                        </p>
                    </div>

                    <NeuralNet3DCanvas />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                        <span>Inputs: [hour, temp, rain, month]</span>
                        <span>Output: Z-Score Density</span>
                    </div>
                </div>

            </div>

            {/* 🎯 Prediction Output Card */}
            {result && (
                <div
                    className="glass-card result-card-glow"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '28px',
                        border: '1px solid rgba(14, 165, 233, 0.4)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <h3 style={{ color: 'var(--accent-cyan)', fontSize: '15px', fontWeight: '800', marginBottom: '18px', textTransform: 'uppercase' }}>
                        ⚡ LSTM Inference Output Matrix
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Zone</div>
                            <div style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>{result.zone_id}</div>
                        </div>

                        <div style={{ flex: 1, minWidth: '130px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Time</div>
                            <div style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>Hour {result.hour}:00</div>
                        </div>

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Demand Category</div>
                            <span className={`badge ${
                                result.predicted_demand > 1.0 ? 'badge-red' :
                                result.predicted_demand > 0.5 ? 'badge-orange' : 'badge-green'
                            }`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                {
                                    result.predicted_demand > 1.0 ? 'HIGH SURGE' :
                                    result.predicted_demand > 0.5 ? 'MODERATE' : 'NORMAL'
                                }
                            </span>
                        </div>

                        <div style={{ flex: 1, minWidth: '160px', textAlign: 'left' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Predicted Demand (Z-Score)</div>
                            <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--accent-cyan)' }}>
                                {result.predicted_demand}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📈 History Chart */}
            {chartData.length > 0 && (
                <div className="glass-card" style={{ padding: '24px' }}>
                    <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', marginBottom: '20px' }}>
                        📈 Query History & Distribution Comparison
                    </h3>
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
                                    name="Predicted Demand Value (Z-Score)"
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
