import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { predictEventImpact } from '../services/api';

const EVENT_TYPES = [
    { value: 0, label: 'Concert', icon: '🎵', desc: 'Music concerts & arenas' },
    { value: 1, label: 'Cricket / Sports', icon: '🏏', desc: 'Stadium matches' },
    { value: 2, label: 'Festival', icon: '🎪', desc: 'City street festivals' },
    { value: 3, label: 'Protest / Rally', icon: '🪧', desc: 'Public gatherings' },
    { value: 4, label: 'Holiday / Parade', icon: '🏖️', desc: 'Seasonal events' }
];

const EVENT_SIZES = [
    { value: 0, label: 'Small (<5k pax)' },
    { value: 1, label: 'Medium (5k-25k pax)' },
    { value: 2, label: 'Large (>25k pax)' }
];

// 3D Event Stadium & Multiplier Shockwave Component
function Event3DCanvas({ eventType, distance }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight || 220;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 4, 6);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const group = new THREE.Group();
        scene.add(group);

        // Central Stadium Ring
        const stadiumGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 32);
        const stadiumMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
        const stadium = new THREE.Mesh(stadiumGeo, stadiumMat);
        group.add(stadium);

        // Expanding Shockwave Rings
        const shockwaves = [];
        const ringColors = [0xf59e0b, 0xef4444, 0x0ea5e9];

        for (let i = 1; i <= 3; i++) {
            const shockGeo = new THREE.TorusGeometry(1.4 + i * 0.8, 0.04, 16, 50);
            const shockMat = new THREE.MeshBasicMaterial({ color: ringColors[i - 1], transparent: true, opacity: 0.7 });
            const shock = new THREE.Mesh(shockGeo, shockMat);
            shock.rotation.x = Math.PI / 2;
            group.add(shock);
            shockwaves.push({ mesh: shock, baseScale: 1 + i * 0.3, speed: 0.02 + i * 0.01 });
        }

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            group.rotation.y += 0.008;

            shockwaves.forEach((sw, idx) => {
                const s = 1 + Math.sin(Date.now() * 0.003 + idx) * 0.2;
                sw.mesh.scale.set(s, s, s);
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
    }, [eventType, distance]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '220px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(5, 7, 15, 0.6)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
        />
    );
}

function EventImpact() {
    const [form, setForm]       = useState({
        zone_id: 'ZONE_41.7200_-87.6250',
        event_type: 2, event_size: 2,
        distance_km: 0.3, hours_to_event: 1.0, day_of_week: 6
    });
    const [result, setResult]   = useState(null);
    const [loading, setLoading] = useState(false);

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
        card.style.boxShadow = `0 15px 30px rgba(245, 158, 11, 0.25)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await predictEventImpact({
                ...form,
                event_type:     parseInt(form.event_type),
                event_size:     parseInt(form.event_size),
                distance_km:    parseFloat(form.distance_km),
                hours_to_event: parseFloat(form.hours_to_event),
                day_of_week:    parseInt(form.day_of_week)
            });
            setResult(res);
        } catch (err) {
            alert('Error: ' + err.message);
        }
        setLoading(false);
    };

    const getImpactColor = (level) => {
        if (level === 'HIGH')   return 'var(--accent-red)';
        if (level === 'MEDIUM') return 'var(--accent-orange)';
        return 'var(--accent-green)';
    };

    const getImpactBadgeClass = (level) => {
        if (level === 'HIGH')   return 'badge-red';
        if (level === 'MEDIUM') return 'badge-orange';
        return 'badge-green';
    };

    // Calculated distance attenuation for preview
    const calculatedDecay = form.distance_km > 5.0
        ? Math.max(0.1, 1.0 - ((form.distance_km - 5.0) / 45.0) * 0.75).toFixed(2)
        : '1.00 (Full Radius)';

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header */}
            <div className="page-title-section">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h2 className="page-title" style={{ margin: 0 }}>🎯 XGBoost Event Multiplier Predictor</h2>
                        <span className="badge badge-orange" style={{ fontSize: '11px' }}>SPATIAL DISTANCE DECAY MODEL</span>
                    </div>
                    <p className="page-subtitle">Simulate event scale & spatial proximity to pre-position fleet capacity hours in advance</p>
                </div>
            </div>

            {/* Event Type Visual Card Selectors */}
            <div>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
                    Select Event Category
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    {EVENT_TYPES.map(t => (
                        <div
                            key={t.value}
                            onClick={() => setForm({ ...form, event_type: t.value })}
                            onMouseMove={handleCardMouseMove}
                            onMouseLeave={handleCardMouseLeave}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                background: form.event_type === t.value ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: form.event_type === t.value ? '2px solid var(--accent-orange)' : '1px solid var(--glass-border)',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                        >
                            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{t.icon}</div>
                            <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>{t.label}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>{t.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Form + 3D Simulation Canvas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                
                {/* Parameters Form */}
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '28px',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', marginBottom: '20px' }}>
                        Simulation Parameters
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label>Event Size Scale</label>
                            <select
                                className="form-control"
                                value={form.event_size}
                                onChange={e => setForm({ ...form, event_size: e.target.value })}
                            >
                                {EVENT_SIZES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Distance to Zone ({form.distance_km} km)</label>
                            <input
                                type="range" step="0.1" min="0.1" max="10"
                                className="form-control"
                                value={form.distance_km}
                                onChange={e => setForm({ ...form, distance_km: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Hours Until Event ({form.hours_to_event}h)</label>
                            <input
                                type="number" step="0.5" min="0" max="24"
                                className="form-control"
                                value={form.hours_to_event}
                                onChange={e => setForm({ ...form, hours_to_event: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Day of Week</label>
                            <select
                                className="form-control"
                                value={form.day_of_week}
                                onChange={e => setForm({ ...form, day_of_week: e.target.value })}
                            >
                                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d, i) => (
                                    <option key={i} value={i}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(5, 7, 15, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span>Distance Decay Factor: <strong style={{ color: 'var(--accent-orange)' }}>{calculatedDecay}</strong></span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-success"
                        style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '800' }}
                    >
                        {loading ? '⚡ Simulating XGBoost Model...' : '⚡ Calculate Demand Multiplier'}
                    </button>
                </div>

                {/* 3D Shockwave Canvas Card */}
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', margin: 0 }}>
                            🎯 3D Event Stadium & Multiplier Shockwaves
                        </h3>
                        <span className="badge badge-orange">SHOCKWAVE SIMULATOR</span>
                    </div>

                    <Event3DCanvas eventType={form.event_type} distance={form.distance_km} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        <span>Model: XGBoost Regressor</span>
                        <span>Attenuation: Decay Math Enabled</span>
                    </div>
                </div>

            </div>

            {/* 🎯 Simulation Result */}
            {result && (
                <div 
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{ 
                        padding: '28px',
                        border: `1.5px solid ${getImpactColor(result.impact_level)}`,
                        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)`,
                        boxShadow: `0 15px 35px ${getImpactColor(result.impact_level)}2b`,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>
                        ⚡ Multiplier Simulation Output
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', minWidth: '130px' }}>
                            <div className="multiplier-circle" style={{ 
                                color: getImpactColor(result.impact_level),
                                borderColor: `${getImpactColor(result.impact_level)}66`,
                                boxShadow: `0 0 25px ${getImpactColor(result.impact_level)}33`,
                                background: 'rgba(5, 7, 15, 0.8)'
                            }}>
                                {result.multiplier}x
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase', fontWeight: '700' }}>Ridership Multiplier</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Threat Matrix Level:</span>
                                <span className={`badge ${getImpactBadgeClass(result.impact_level)}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                    {result.impact_level} IMPACT MULTIPLIER
                                </span>
                            </div>

                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                                {result.message}
                            </div>

                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Target Zone: <strong style={{ color: 'var(--accent-cyan)' }}>{result.zone_id}</strong> | Distance Attenuation Applied
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default EventImpact;
