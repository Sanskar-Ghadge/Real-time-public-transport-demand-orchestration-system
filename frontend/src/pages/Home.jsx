import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { getCityStatus } from '../services/api';

// ── 3D WebGL Hero Canvas ─────────────────────────────────────────────
function Transit3DCanvas({ mode }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 18);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x0ea5e9, 3, 50);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x10b981, 2, 50);
        pointLight2.position.set(-10, -10, 10);
        scene.add(pointLight2);

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        let animateItems = [];

        if (mode === 'globe') {
            const sphereGeo = new THREE.IcosahedronGeometry(4.8, 3);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x0ea5e9,
                wireframe: true,
                transparent: true,
                opacity: 0.25
            });
            const wireSphere = new THREE.Mesh(sphereGeo, sphereMat);
            mainGroup.add(wireSphere);

            const innerGeo = new THREE.SphereGeometry(3.6, 32, 32);
            const innerMat = new THREE.MeshBasicMaterial({
                color: 0x0284c7,
                transparent: true,
                opacity: 0.15
            });
            const innerSphere = new THREE.Mesh(innerGeo, innerMat);
            mainGroup.add(innerSphere);

            const ringColors = [0x0ea5e9, 0x10b981, 0xf59e0b];
            const rings = [];
            const buses = [];

            for (let i = 0; i < 3; i++) {
                const ringGeo = new THREE.TorusGeometry(5.8 + i * 0.9, 0.03, 16, 100);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: ringColors[i],
                    transparent: true,
                    opacity: 0.45
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 3 + i * 0.4;
                ring.rotation.y = i * 0.5;
                mainGroup.add(ring);
                rings.push(ring);

                const busGeo = new THREE.SphereGeometry(0.25, 16, 16);
                const busMat = new THREE.MeshStandardMaterial({
                    color: ringColors[i],
                    emissive: ringColors[i],
                    emissiveIntensity: 0.9
                });
                const busMesh = new THREE.Mesh(busGeo, busMat);
                mainGroup.add(busMesh);
                buses.push({ mesh: busMesh, radius: 5.8 + i * 0.9, ring, speed: 0.015 + i * 0.005, angle: Math.random() * Math.PI * 2 });
            }

            const particleCount = 700;
            const particleGeo = new THREE.BufferGeometry();
            const particlePos = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = 4.8 + (Math.random() - 0.5) * 1.6;

                particlePos[i] = r * Math.sin(phi) * Math.cos(theta);
                particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                particlePos[i + 2] = r * Math.cos(phi);
            }

            particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
            const particleMat = new THREE.PointsMaterial({
                color: 0x38bdf8,
                size: 0.09,
                transparent: true,
                opacity: 0.75
            });
            const particleSystem = new THREE.Points(particleGeo, particleMat);
            mainGroup.add(particleSystem);

            animateItems = [
                () => {
                    wireSphere.rotation.y += 0.003;
                    wireSphere.rotation.x += 0.001;
                    particleSystem.rotation.y += 0.002;

                    buses.forEach(b => {
                        b.angle += b.speed;
                        const x = Math.cos(b.angle) * b.radius;
                        const y = Math.sin(b.angle) * b.radius;
                        const vec = new THREE.Vector3(x, y, 0);
                        vec.applyEuler(b.ring.rotation);
                        b.mesh.position.copy(vec);
                    });
                }
            ];
        } else {
            mainGroup.rotation.x = Math.PI / 6;
            mainGroup.rotation.y = -Math.PI / 5;

            const gridHelper = new THREE.GridHelper(16, 12, 0x0ea5e9, 0x1e293b);
            gridHelper.position.y = -2;
            mainGroup.add(gridHelper);

            const towers = [];
            const colors = [0x10b981, 0xf59e0b, 0xef4444, 0x0ea5e9];

            for (let x = -5; x <= 5; x += 2.5) {
                for (let z = -5; z <= 5; z += 2.5) {
                    const height = Math.random() * 4 + 1;
                    const towerGeo = new THREE.BoxGeometry(1.2, height, 1.2);
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const towerMat = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 0.3,
                        metalness: 0.8,
                        transparent: true,
                        opacity: 0.85
                    });
                    const tower = new THREE.Mesh(towerGeo, towerMat);
                    tower.position.set(x, -2 + height / 2, z);
                    mainGroup.add(tower);

                    towers.push({
                        mesh: tower,
                        baseHeight: height,
                        phase: Math.random() * Math.PI * 2,
                        speed: 0.03 + Math.random() * 0.02
                    });
                }
            }

            animateItems = [
                () => {
                    towers.forEach(t => {
                        t.phase += t.speed;
                        const scaleY = 1 + Math.sin(t.phase) * 0.35;
                        t.mesh.scale.set(1, scaleY, 1);
                    });
                    mainGroup.rotation.y += 0.002;
                }
            ];
        }

        let mouseX = 0;
        let mouseY = 0;
        const handleMouseMove = (e) => {
            const rect = currentMount.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
        };

        window.addEventListener('mousemove', handleMouseMove);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 2.5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            animateItems.forEach(fn => fn());
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!currentMount) return;
            const newW = currentMount.clientWidth;
            const newH = currentMount.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [mode]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '360px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px'
            }}
        />
    );
}

// ── Mini 3D Feature Preview Canvas Component ──────────────────────────
function Feature3DPreview({ type }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight || 180;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(0, 0, 7);

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

        let animateFunc = () => {};

        if (type === 'map') {
            const grid = new THREE.GridHelper(6, 8, 0x0ea5e9, 0x1e293b);
            grid.rotation.x = Math.PI / 4;
            group.add(grid);

            const busMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981 });
            const busMat2 = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const busMat3 = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });

            const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), busMat1);
            const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), busMat2);
            const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), busMat3);

            group.add(b1);
            group.add(b2);
            group.add(b3);

            let t = 0;
            animateFunc = () => {
                t += 0.025;
                group.rotation.z += 0.003;
                b1.position.set(Math.cos(t) * 2, Math.sin(t) * 2, 0.3);
                b2.position.set(Math.cos(t + 2) * 1.5, Math.sin(t + 2) * 1.5, 0.3);
                b3.position.set(Math.cos(t + 4) * 2.2, Math.sin(t + 4) * 2.2, 0.3);
            };
        } else if (type === 'forecast') {
            const nodes = [];
            const nodeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.8 });
            
            for (let i = 0; i < 8; i++) {
                const node = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), nodeMat);
                node.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2);
                group.add(node);
                nodes.push(node);
            }

            const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
            const lineGeo = new THREE.BufferGeometry();
            const points = [];
            nodes.forEach((n1, idx) => {
                if (idx < nodes.length - 1) {
                    points.push(n1.position.x, n1.position.y, n1.position.z);
                    points.push(nodes[idx + 1].position.x, nodes[idx + 1].position.y, nodes[idx + 1].position.z);
                }
            });
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            group.add(lines);

            animateFunc = () => {
                group.rotation.y += 0.01;
                group.rotation.x += 0.005;
            };
        } else if (type === 'anomaly') {
            const coneGeo = new THREE.ConeGeometry(2, 2.5, 32, 1, true);
            const coneMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.4 });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.rotation.x = Math.PI / 2;
            group.add(cone);

            const spikeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const spike1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), spikeMat);
            const spike2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4), spikeMat);
            spike1.position.set(0.8, 0.5, 0);
            spike2.position.set(-0.9, -0.6, 0);
            group.add(spike1);
            group.add(spike2);

            let phase = 0;
            animateFunc = () => {
                group.rotation.z += 0.02;
                phase += 0.05;
                spike1.scale.y = 1 + Math.sin(phase) * 0.4;
                spike2.scale.y = 1 + Math.cos(phase) * 0.4;
            };
        } else if (type === 'events') {
            const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 16, 50), ring1Mat);
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.04, 16, 50), ring1Mat);
            const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.03, 16, 50), ring1Mat);

            group.add(ring1);
            group.add(ring2);
            group.add(ring3);

            let pulse = 0;
            animateFunc = () => {
                pulse += 0.03;
                group.rotation.x = Math.PI / 3;
                group.rotation.z += 0.005;

                ring1.scale.setScalar(1 + Math.sin(pulse) * 0.15);
                ring2.scale.setScalar(1 + Math.sin(pulse + 1) * 0.2);
                ring3.scale.setScalar(1 + Math.sin(pulse + 2) * 0.25);
            };
        }

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            animateFunc();
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
    }, [type]);

    return (
        <div
            ref={mountRef}
            style={{
                width: '100%',
                height: '180px',
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(5, 7, 15, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '16px'
            }}
        />
    );
}

// ── Main Home Page Component ───────────────────────────────────────
function Home() {
    const navigate = useNavigate();
    const [cityStatus, setCityStatus] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [vizMode, setVizMode]       = useState('globe');
    const [activeGuideTab, setActiveGuideTab] = useState(0);

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
        card.style.boxShadow = `0 15px 35px rgba(14, 165, 233, 0.25)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
    };

    const guideSteps = [
        {
            id: 'map',
            title: '1. Live City Map',
            icon: '🗺️',
            badge: 'SIMULATED TELEMETRY MODE',
            route: '/map',
            description: 'Track 20 active buses moving across Chicago coordinates in real time with live occupancy status badges and demand circles.',
            details: [
                { label: 'Green Badge (<40%)', desc: 'Sufficient seating capacity available for passengers.', color: 'var(--accent-green)' },
                { label: 'Yellow Badge (40-80%)', desc: 'Moderate passenger capacity utilization.', color: 'var(--accent-orange)' },
                { label: 'Red Badge (>80%)', desc: 'High occupancy alert — triggers automated rerouting recommendation.', color: 'var(--accent-red)' },
                { label: 'Red Heatmap Circles', desc: 'High-density passenger boarding zones (>60 pax/hr).', color: 'var(--accent-cyan)' }
            ]
        },
        {
            id: 'forecast',
            title: '2. Demand Forecast',
            icon: '📊',
            badge: 'PYTORCH 2-LAYER LSTM',
            route: '/demand',
            description: 'Query the PyTorch LSTM neural network model to forecast future hourly ridership with NOAA weather sensitivity.',
            details: [
                { label: 'Temporal Features', desc: 'Hour of day (0-23), weekend flag, and month parameters.', color: 'var(--accent-cyan)' },
                { label: 'NOAA Weather Inputs', desc: 'Temperature range, precipitation (mm), and rainfall flag.', color: 'var(--accent-green)' },
                { label: 'Normalized Z-Scores', desc: 'Computes crowd density relative to baseline averages.', color: 'var(--accent-orange)' },
                { label: 'Visual Distribution', desc: 'Renders bar chart comparison using Recharts library.', color: 'var(--accent-purple)' }
            ]
        },
        {
            id: 'anomaly',
            title: '3. Anomaly Scanner',
            icon: '🚨',
            badge: 'ISOLATION FOREST (100 TREES)',
            route: '/anomaly',
            description: 'Scan stream data for unexpected passenger spikes (e.g., 85 pax at 2 AM) using an Isolation Forest ensemble.',
            details: [
                { label: 'Automated Stream Scan', desc: 'Scans test scenarios every 30 seconds automatically.', color: 'var(--accent-cyan)' },
                { label: 'Contamination Threshold', desc: 'Trained at 5% contamination rate for high sensitivity.', color: 'var(--accent-red)' },
                { label: 'Severity Ratings', desc: 'Assigns NORMAL, MEDIUM, or HIGH surge ratings.', color: 'var(--accent-orange)' },
                { label: 'Decision Score', desc: 'Calculates exact tree isolation path depth scores.', color: 'var(--accent-green)' }
            ]
        },
        {
            id: 'events',
            title: '4. Event Impact',
            icon: '🎯',
            badge: 'XGBOOST DISTANCE-DECAY',
            route: '/events',
            description: 'Simulate public events (Concerts, Sports Matches, Festivals) to pre-position fleet capacity hours in advance.',
            details: [
                { label: 'Event Classification', desc: 'Supports Concert, Match, Festival, Protest, Holiday types.', color: 'var(--accent-cyan)' },
                { label: 'Distance Attenuation', desc: 'Applies decay multiplier formula beyond 5 km radius.', color: 'var(--accent-green)' },
                { label: 'Demand Multiplier', desc: 'Predicts multipliers up to 12.56x normal ridership.', color: 'var(--accent-red)' },
                { label: 'Fleet Preparation', desc: 'Pre-routes empty buses before venue crowds disperse.', color: 'var(--accent-orange)' }
            ]
        }
    ];

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
            
            {/* 1. HERO SECTION */}
            <div
                className="glass-card result-card-glow"
                style={{
                    padding: '36px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '28px',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(14, 165, 233, 0.35)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 35px rgba(14, 165, 233, 0.2)'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className="badge badge-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
                            🟢 SYSTEM ONLINE (DEMO MODE)
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '12px', padding: '6px 14px' }}>
                            ✨ 3D WEBGL ENGINE
                        </span>
                    </div>

                    <h1 style={{ fontSize: '38px', fontWeight: '900', margin: 0, color: '#fff', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
                        Smart Bus Transit Management System
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0, lineHeight: '1.65' }}>
                        An intelligent transit platform for real-time bus monitoring, passenger-demand forecasting, anomaly surge detection, and operational fleet planning.
                        Trained on Chicago CTA boarding records & NOAA weather telemetry.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <button
                            className={vizMode === 'globe' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setVizMode('globe')}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            🌐 3D Globe View
                        </button>
                        <button
                            className={vizMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setVizMode('grid')}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            🏙️ 3D City Demand Grid
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700' }} onClick={() => navigate('/map')}>
                            🗺️ Explore Live Map →
                        </button>
                        <button className="btn-success" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '700' }} onClick={() => navigate('/demand')}>
                            📊 View Demand Forecast →
                        </button>
                        <a href="#how-it-works" style={{ textDecoration: 'none' }}>
                            <button className="btn-secondary" style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600' }}>
                                ⚙️ How It Works ↓
                            </button>
                        </a>
                    </div>
                </div>

                <div style={{ height: '360px', width: '100%', position: 'relative' }}>
                    <Transit3DCanvas mode={vizMode} />
                    <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '16px',
                        fontSize: '11px',
                        color: 'var(--accent-cyan)',
                        background: 'rgba(15, 23, 42, 0.85)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(14, 165, 233, 0.3)'
                    }}>
                        🖱️ Drag mouse to tilt 3D camera
                    </div>
                </div>
            </div>

            {/* 2. REAL-TIME TRANSIT OVERVIEW (SIMULATION DATA) */}
            <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                            ⚡ Real-Time Transit Overview
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Generated via FastAPI backend endpoints (`/api/buses`)
                        </span>
                    </div>
                    <span className="badge badge-orange" style={{ padding: '6px 14px', fontSize: '11px' }}>
                        DEMO DATA / SIMULATION MODE
                    </span>
                </div>

                <div className="stats-container">
                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
                    >
                        <span className="stat-lbl">🚌 Active Buses (Simulated)</span>
                        <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>
                            {loading ? '...' : cityStatus?.total_buses || 20} Vehicles
                        </span>
                    </div>

                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
                    >
                        <span className="stat-lbl">📊 Average Fleet Occupancy</span>
                        <span className="stat-val" style={{ color: 'var(--accent-green)' }}>
                            {loading ? '...' : `${cityStatus?.avg_occupancy || 50}%`}
                        </span>
                    </div>

                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
                    >
                        <span className="stat-lbl">🕒 Peak Status</span>
                        <span className="stat-val" style={{ color: 'var(--accent-orange)' }}>
                            {loading ? '...' : cityStatus?.peak_status || 'Normal Operations'}
                        </span>
                    </div>

                    <div
                        className="stat-item"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' }}
                    >
                        <span className="stat-lbl">🔥 Current Network Demand</span>
                        <span className="stat-val" style={{ color: 'var(--accent-red)' }}>
                            {loading ? '...' : cityStatus?.demand_level || 'MODERATE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. MAIN MODULES */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 }}>
                            🚀 Implemented System Modules
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginTop: '4px' }}>
                            Interactive WebGL 3D previews for each active functional module
                        </p>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '12px' }}>
                        4 FUNCTIONAL PIPELINES
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    
                    {/* Module 1: Live Map */}
                    <div
                        className="glass-card"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(14, 165, 233, 0.08) 100%)',
                            border: '1px solid rgba(14, 165, 233, 0.25)'
                        }}
                        onClick={() => navigate('/map')}
                    >
                        <Feature3DPreview type="map" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Live Transit Map</h4>
                            <span className="badge badge-green" style={{ fontSize: '10px' }}>SIMULATION MODE</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            View 20 simulated buses moving across Chicago coordinates, inspect occupancy status badges, and dispatch rerouting actions.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Open Live Map →
                        </button>
                    </div>

                    {/* Module 2: Demand Forecast */}
                    <div
                        className="glass-card"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(16, 185, 129, 0.08) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                        }}
                        onClick={() => navigate('/demand')}
                    >
                        <Feature3DPreview type="forecast" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Demand Forecast</h4>
                            <span className="badge badge-cyan" style={{ fontSize: '10px' }}>PYTORCH LSTM</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Query the 2-layer PyTorch LSTM model to predict future passenger crowds based on temperature, rainfall, and hour of day.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Forecast →
                        </button>
                    </div>

                    {/* Module 3: Anomaly Scanner */}
                    <div
                        className="glass-card"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(239, 68, 68, 0.08) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                        }}
                        onClick={() => navigate('/anomaly')}
                    >
                        <Feature3DPreview type="anomaly" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Anomaly Scanner</h4>
                            <span className="badge badge-red" style={{ fontSize: '10px' }}>ISOLATION FOREST</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Scan stream data with an Isolation Forest ensemble (100 trees) to flag unexpected crowd surges and off-peak spikes.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Scanner →
                        </button>
                    </div>

                    {/* Module 4: Event Impact */}
                    <div
                        className="glass-card"
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(245, 158, 11, 0.08) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.25)'
                        }}
                        onClick={() => navigate('/events')}
                    >
                        <Feature3DPreview type="events" />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Event Impact</h4>
                            <span className="badge badge-orange" style={{ fontSize: '10px' }}>XGBOOST DECAY</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Simulate venue scale & spatial distance decay to calculate ridership multipliers for proactive fleet preparation.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Simulator →
                        </button>
                    </div>

                </div>
            </div>

            {/* 4. HOW TO USE THE PLATFORM */}
            <div
                className="glass-card"
                style={{
                    padding: '32px',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)'
                }}
            >
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        📖 How to Use the Platform (User Manual)
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Step-by-step instructions to test and evaluate all features of the system.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 1</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Open Live Map</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Navigate to <strong>Live Map</strong> to view simulated buses moving across Chicago coordinates with occupancy badges.
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 2</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Inspect Bus Telemetry</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Click any bus marker to view route name, current speed (km/h), occupancy (%), and zone location.
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-green" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 3</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Run Demand Forecast</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Go to <strong>Demand</strong>, adjust hour/weather parameters or click preset scenarios (Rain/Peak), then click Predict.
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-red" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 4</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Scan Anomalies</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Go to <strong>Anomalies</strong> and click Trigger Stream Scan to evaluate stream data against the Isolation Forest model.
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-orange" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 5</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Simulate Events</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Go to <strong>Events</strong>, select event category (Concert/Match), adjust distance slider, and compute ridership multiplier.
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '12px' }}>
                        <span className="badge badge-purple" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>STEP 6</span>
                        <h4 style={{ color: '#fff', fontSize: '15px', margin: '0 0 6px 0' }}>Execute Fleet Reroute</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            Review automated dispatcher recommendations on Live Map and click "Execute Reroute" to rebalance capacity.
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. HOW THE PROJECT WORKS (SYSTEM PIPELINE) */}
            <div id="how-it-works" className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        ⚙️ How the Project Works (System Pipeline)
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        End-to-end architecture showing how raw datasets flow into trained ML models, REST endpoints, and the Web UI.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div style={{ padding: '16px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: '10px' }}>
                            <strong style={{ color: 'var(--accent-cyan)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>1. DATA SOURCES</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>CTA passenger boarding records + NOAA weather (temp, rainfall, WMO codes).</p>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px' }}>
                            <strong style={{ color: 'var(--accent-green)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>2. PREPROCESSING</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>Cleaning, NaN imputation, feature engineering, and MinMaxScaler normalization.</p>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px' }}>
                            <strong style={{ color: 'var(--accent-orange)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>3. ML INFERENCE</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>PyTorch LSTM (Demand), Isolation Forest (Anomalies), XGBoost (Events).</p>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px' }}>
                            <strong style={{ color: 'var(--accent-purple)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>4. FASTAPI REST BACKEND</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>Exposes JSON endpoints (`/api/demand`, `/api/anomaly`, `/api/events`, `/api/buses`).</p>
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px' }}>
                            <strong style={{ color: 'var(--accent-red)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>5. REACT 3D DASHBOARD</strong>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>Interactive Leaflet city map, Three.js WebGL 3D canvases, and Recharts graphs.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. TECHNOLOGY STACK */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        💻 Verified Technology Stack
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Technologies actually used in this repository (verified via source code & package dependencies).
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '10px' }}>
                        <strong style={{ color: 'var(--accent-cyan)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Frontend</strong>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>React 19 & Vite 8</li>
                            <li>React Router DOM 7</li>
                            <li>Leaflet & React-Leaflet</li>
                            <li>Three.js (WebGL 3D)</li>
                            <li>Recharts</li>
                            <li>Axios HTTP Client</li>
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '10px' }}>
                        <strong style={{ color: 'var(--accent-green)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Backend API</strong>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>Python 3.10+</li>
                            <li>FastAPI Framework</li>
                            <li>Uvicorn ASGI Server</li>
                            <li>Pydantic Data Schemas</li>
                            <li>NumPy & Pandas</li>
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '10px' }}>
                        <strong style={{ color: 'var(--accent-orange)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Machine Learning</strong>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>PyTorch (LSTM Model)</li>
                            <li>Scikit-Learn (Isolation Forest)</li>
                            <li>XGBoost (Event Multiplier)</li>
                            <li>MinMaxScaler (Feature Scaling)</li>
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '10px' }}>
                        <strong style={{ color: 'var(--accent-purple)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Data & Assets</strong>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <li>CTA Hourly Boarding CSV</li>
                            <li>NOAA Weather Telemetry</li>
                            <li>OpenStreetMap Tiles</li>
                            <li>Simulated Telemetry Generator</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 7. DATA FLOW */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        🔄 System Data Flow
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        How user inputs and telemetry data move through the system to generate outputs.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-cyan)' }}>
                        <strong style={{ color: '#fff' }}>Step 1 — Input Collection:</strong> User selects zone, time, and weather parameters on the frontend OR backend generates simulated bus coordinates.
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-green)' }}>
                        <strong style={{ color: '#fff' }}>Step 2 — Feature Normalization:</strong> FastAPI receives JSON payloads and transforms raw inputs using fitted `MinMaxScaler` scalers matching training data distributions.
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-orange)' }}>
                        <strong style={{ color: '#fff' }}>Step 3 — Model Inference:</strong> PyTorch (LSTM sequence inference), Isolation Forest (decision path tree depth scoring), or XGBoost (event multiplier calculation with distance decay).
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--accent-purple)' }}>
                        <strong style={{ color: '#fff' }}>Step 4 — UI Rendering:</strong> FastAPI returns JSON responses. React updates Leaflet map markers, Three.js 3D WebGL canvases, and Recharts historical bar distributions.
                    </div>
                </div>
            </div>

            {/* 8. 3D VISUALIZATION EXPLANATION */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        🌐 3D WebGL Visualization Purpose & Controls
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Why 3D graphics are used and how visitors can interact with them.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                        <h4 style={{ color: 'var(--accent-cyan)', fontSize: '15px', margin: '0 0 10px 0' }}>Why 3D Visualization?</h4>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li>Spatially represents transit route networks and orbital fleet motion.</li>
                            <li>Visualizes passenger demand density as 3D height towers across city zones.</li>
                            <li>Provides an intuitive, engaging representation of ML neural graphs and radar scanners.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--accent-green)', fontSize: '15px', margin: '0 0 10px 0' }}>How to Interact:</h4>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li><strong>Hero 3D Canvas:</strong> Drag your mouse over the canvas to tilt and rotate the 3D camera.</li>
                            <li><strong>View Toggle:</strong> Click "3D Globe View" or "3D City Demand Grid" to switch 3D rendering modes.</li>
                            <li><strong>Leaflet Map:</strong> Drag to pan, scroll to zoom, and click bus markers for telemetry tooltips.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 9. AI/ML BEHIND THE PLATFORM */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        🤖 AI Behind the Platform (Implemented Models)
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Detailed breakdown of all 3 machine learning models trained and deployed in the system.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {/* Model 1 */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(14, 165, 233, 0.3)', padding: '20px', borderRadius: '12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '10px', marginBottom: '8px', display: 'inline-block' }}>PYTORCH NEURAL NET</span>
                        <h3 style={{ color: '#fff', fontSize: '17px', margin: '0 0 8px 0' }}>1. PyTorch LSTM Demand Model</h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>Purpose:</strong> Predicts hourly passenger boarding demand Z-scores.</div>
                            <div><strong>Input Features (9):</strong> Hour, weekend flag, max temp, min temp, precipitation, is_raining, weather code, day of week, month.</div>
                            <div><strong>Architecture:</strong> 2-Layer LSTM (64 hidden dim, dropout 0.2) + Linear FC layers.</div>
                            <div><strong>Output:</strong> Normalized Z-score value (e.g. `0.80` dry vs `2.79` heavy rain).</div>
                            <div><strong>Where Displayed:</strong> `/demand` page (Forecast output & bar chart).</div>
                        </div>
                    </div>

                    {/* Model 2 */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '12px' }}>
                        <span className="badge badge-red" style={{ fontSize: '10px', marginBottom: '8px', display: 'inline-block' }}>ENSEMBLE CLASSIFIER</span>
                        <h3 style={{ color: '#fff', fontSize: '17px', margin: '0 0 8px 0' }}>2. Isolation Forest Anomaly Scanner</h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>Purpose:</strong> Scans ridership telemetry for unexpected off-peak crowd surges.</div>
                            <div><strong>Input Features (3):</strong> Hour, ridership demand, weekend flag.</div>
                            <div><strong>Architecture:</strong> Ensemble of 100 Isolation Trees (contamination=0.05).</div>
                            <div><strong>Output:</strong> Anomaly flag (`-1` surge, `1` normal) + tree path isolation score.</div>
                            <div><strong>Where Displayed:</strong> `/anomaly` page (Stream alert feed & severity badges).</div>
                        </div>
                    </div>

                    {/* Model 3 */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '20px', borderRadius: '12px' }}>
                        <span className="badge badge-orange" style={{ fontSize: '10px', marginBottom: '8px', display: 'inline-block' }}>GRADIENT BOOSTING</span>
                        <h3 style={{ color: '#fff', fontSize: '17px', margin: '0 0 8px 0' }}>3. XGBoost Event Impact Model</h3>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>Purpose:</strong> Simulates public event ridership multipliers with distance decay.</div>
                            <div><strong>Input Features (5):</strong> Event type, event scale, distance (km), hours to event, day of week.</div>
                            <div><strong>Architecture:</strong> XGBRegressor + spatial distance decay math (`max(0.1, 1 - (d-5)/45 * 0.75)`).</div>
                            <div><strong>Output:</strong> Multiplier factor (e.g. `12.56x` for nearby festival vs `1.18x` for 50km away).</div>
                            <div><strong>Where Displayed:</strong> `/events` page (Multiplier circle & impact level).</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 10. PROJECT ARCHITECTURE DIAGRAM */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        🏗️ Structural Project Architecture
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        High-level component breakdown of repository files and layers.
                    </p>
                </div>

                <div style={{ background: 'rgba(5, 7, 15, 0.8)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--accent-cyan)', overflowX: 'auto', lineHeight: '1.6' }}>
                    <div>┌────────────────────────────────────────────────────────────────────────┐</div>
                    <div>│                        REACT 19 FRONTEND DASHBOARD (port 5173)         │</div>
                    <div>│   Home | Live Map (Leaflet) | Demand | Anomalies | Events | Three.js  │</div>
                    <div>└───────────────────────────────────┬────────────────────────────────────┘</div>
                    <div>                                    │ Axios HTTP REST</div>
                    <div>                                    ▼</div>
                    <div>┌────────────────────────────────────────────────────────────────────────┐</div>
                    <div>│                        FASTAPI PYTHON BACKEND (port 8080)              │</div>
                    <div>│   Routes: /api/demand  |  /api/anomaly  |  /api/events  |  /api/buses  │</div>
                    <div>└───────────────────────────────────┬────────────────────────────────────┘</div>
                    <div>                                    │ PyTorch / Scikit-Learn / XGBoost</div>
                    <div>                                    ▼</div>
                    <div>┌────────────────────────────────────────────────────────────────────────┐</div>
                    <div>│                        TRAINED MODEL ARTIFACTS (`models/saved/`)      │</div>
                    <div>│   demand_model_best.pth  |  anomaly_model.pkl  |  event_model.pkl    │</div>
                    <div>└───────────────────────────────────┬────────────────────────────────────┘</div>
                    <div>                                    │ Loaded Pandas Data & Scalers</div>
                    <div>                                    ▼</div>
                    <div>┌────────────────────────────────────────────────────────────────────────┐</div>
                    <div>│                        DATASET (`data/processed/`)                      │</div>
                    <div>│   Chicago CTA Hourly Boardings + NOAA Weather Telemetry Records        │</div>
                    <div>└────────────────────────────────────────────────────────────────────────┘</div>
                </div>
            </div>

            {/* 11. ABOUT THE PROJECT */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        ℹ️ About the Project
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Problem context, proposed solution, and real-world impact.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    <div>
                        <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>The Problem:</strong>
                        Public transit authorities struggle with unexpected crowd surges during bad weather or major sports/concert events, leading to bus overcrowding, increased wait times, and inefficient empty bus runs.
                    </div>

                    <div>
                        <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>The Solution:</strong>
                        An AI-driven orchestration system combining weather-aware neural networks, Isolation Forest surge detectors, and event distance decay models to give dispatchers actionable fleet rebalancing recommendations.
                    </div>

                    <div>
                        <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Real-World Usefulness:</strong>
                        Reduces passenger wait times, optimizes bus route allocations, eliminates 20–30% of empty bus runs, and aligns with UN Sustainable Development Goals (SDG 11 & SDG 13).
                    </div>
                </div>
            </div>

            {/* 12. USER VS OPERATOR INFORMATION */}
            <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        👥 User vs Operator Features
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Clear distinction between public passenger views and internal operator tools.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '20px', borderRadius: '12px' }}>
                        <span className="badge badge-green" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>COMMUTER / PASSENGER FEATURES</span>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li><strong>Live Bus Tracking:</strong> View active buses and seat availability indicators.</li>
                            <li><strong>Demand Forecast:</strong> Check expected crowd levels before commuting.</li>
                            <li><strong>Route Map:</strong> View zone ridership density and bus locations.</li>
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', padding: '20px', borderRadius: '12px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '11px', marginBottom: '8px', display: 'inline-block' }}>TRANSIT OPERATOR / DISPATCHER FEATURES</span>
                        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li><strong>Automated Rebalancing Console:</strong> One-click fleet rerouting recommendations.</li>
                            <li><strong>Anomaly Stream Scanner:</strong> Real-time Isolation Forest surge alerts.</li>
                            <li><strong>Event Impact Simulator:</strong> Proactive fleet pre-positioning prior to major events.</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default Home;
