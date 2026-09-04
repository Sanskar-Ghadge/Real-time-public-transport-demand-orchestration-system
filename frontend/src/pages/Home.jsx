import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { motion, useReducedMotion } from 'framer-motion';
import { getCityStatus } from '../services/api';

// ── Digital Odometer Roll-Up Counter Component ───────────────────────
function OdometerNumber({ targetValue, suffix = '', duration = 1200 }) {
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        const numericVal = typeof targetValue === 'number'
            ? targetValue
            : parseFloat(String(targetValue).replace(/[^0-9.]/g, '')) || 0;

        let startTimestamp = null;
        let startVal = displayVal;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startVal + (numericVal - startVal) * easeProgress);
            setDisplayVal(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }, [targetValue, duration]);

    return (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 'bold' }}>
            {displayVal}{suffix}
        </span>
    );
}

// ── 3D WebGL Hero Canvas — Particle Transit System & Camera Panning ─
function Transit3DCanvas({ mode }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 20);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x06b6d4, 4, 60);
        pointLight1.position.set(12, 12, 12);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x10b981, 3, 60);
        pointLight2.position.set(-12, -12, 12);
        scene.add(pointLight2);

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        let animateItems = [];

        if (mode === 'globe') {
            const nodeCount = 800;
            const particleGeo = new THREE.BufferGeometry();
            const particlePos = new Float32Array(nodeCount * 3);
            const particleColors = new Float32Array(nodeCount * 3);

            const palette = [
                new THREE.Color(0x06b6d4),
                new THREE.Color(0x10b981),
                new THREE.Color(0xf59e0b),
                new THREE.Color(0xec4899),
                new THREE.Color(0x38bdf8)
            ];

            for (let i = 0; i < nodeCount * 3; i += 3) {
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = 5.2 + (Math.random() - 0.5) * 1.8;

                particlePos[i]     = r * Math.sin(phi) * Math.cos(theta);
                particlePos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
                particlePos[i + 2] = r * Math.cos(phi);

                const color = palette[Math.floor(Math.random() * palette.length)];
                particleColors[i]     = color.r;
                particleColors[i + 1] = color.g;
                particleColors[i + 2] = color.b;
            }

            particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
            particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

            const particleMat = new THREE.PointsMaterial({
                size: 0.14,
                vertexColors: true,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });

            const transitParticleSystem = new THREE.Points(particleGeo, particleMat);
            mainGroup.add(transitParticleSystem);

            const innerGlobeGeo = new THREE.IcosahedronGeometry(4.8, 2);
            const innerGlobeMat = new THREE.MeshBasicMaterial({
                color: 0x0284c7,
                wireframe: true,
                transparent: true,
                opacity: 0.15
            });
            const innerGlobe = new THREE.Mesh(innerGlobeGeo, innerGlobeMat);
            mainGroup.add(innerGlobe);

            const telemetryBusNodes = [];
            const nodeGeo = new THREE.SphereGeometry(0.22, 12, 12);

            for (let i = 0; i < 6; i++) {
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: palette[i % palette.length],
                    emissive: palette[i % palette.length],
                    emissiveIntensity: 1.2,
                    roughness: 0.2
                });
                const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);

                const phi = Math.random() * Math.PI;
                const theta = Math.random() * Math.PI * 2;
                const r = 5.4;

                nodeMesh.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );

                mainGroup.add(nodeMesh);

                telemetryBusNodes.push({
                    mesh: nodeMesh,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.04 + Math.random() * 0.03
                });
            }

            const ringColors = [0x06b6d4, 0x10b981, 0xf59e0b];
            const rings = [];

            for (let i = 0; i < 3; i++) {
                const ringGeo = new THREE.TorusGeometry(6.2 + i * 1.1, 0.025, 12, 80);
                const ringMat = new THREE.MeshBasicMaterial({
                    color: ringColors[i],
                    transparent: true,
                    opacity: 0.4
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 3 + i * 0.45;
                ring.rotation.y = i * 0.6;
                mainGroup.add(ring);
                rings.push(ring);
            }

            animateItems = [
                () => {
                    transitParticleSystem.rotation.y += 0.002;
                    transitParticleSystem.rotation.x += 0.0008;
                    innerGlobe.rotation.y += 0.0015;

                    telemetryBusNodes.forEach((node) => {
                        node.phase += node.speed;
                        const pulseScale = 1 + Math.sin(node.phase) * 0.45;
                        node.mesh.scale.setScalar(pulseScale);
                        node.mesh.material.emissiveIntensity = 0.8 + Math.sin(node.phase) * 0.6;
                    });

                    rings.forEach((r, idx) => {
                        r.rotation.z += 0.003 * (idx + 1);
                    });
                }
            ];
        } else {
            mainGroup.rotation.x = Math.PI / 6;
            mainGroup.rotation.y = -Math.PI / 5;

            const gridHelper = new THREE.GridHelper(18, 14, 0x06b6d4, 0x1e293b);
            gridHelper.position.y = -2;
            mainGroup.add(gridHelper);

            const towers = [];
            const colors = [0x10b981, 0xf59e0b, 0xef4444, 0x06b6d4, 0x8b5cf6];

            for (let x = -6; x <= 6; x += 2.5) {
                for (let z = -6; z <= 6; z += 2.5) {
                    const height = Math.random() * 4.5 + 1;
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

        let targetMouseX = 0;
        let targetMouseY = 0;
        let currentMouseX = 0;
        let currentMouseY = 0;

        const handleMouseMove = (e) => {
            const rect = currentMount.getBoundingClientRect();
            targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            targetMouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
        };

        currentMount.addEventListener('mousemove', handleMouseMove);

        let animationFrameId = null;
        let isVisible = true;

        const animate = () => {
            if (!isVisible) return;
            animationFrameId = requestAnimationFrame(animate);

            currentMouseX += (targetMouseX - currentMouseX) * 0.05;
            currentMouseY += (targetMouseY - currentMouseY) * 0.05;

            camera.position.x = currentMouseX * 3.5;
            camera.position.y = currentMouseY * 3.5;
            camera.lookAt(scene.position);

            animateItems.forEach(fn => fn());
            renderer.render(scene, camera);
        };

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                if (!animationFrameId) animate();
            } else if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }, { threshold: 0.05 });

        observer.observe(currentMount);
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
            observer.disconnect();
            currentMount.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
                minHeight: '380px',
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

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        currentMount.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 2, 20);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const group = new THREE.Group();
        scene.add(group);

        let animateFunc = () => {};

        if (type === 'map') {
            const grid = new THREE.GridHelper(6, 8, 0x06b6d4, 0x1e293b);
            grid.rotation.x = Math.PI / 4;
            group.add(grid);

            const busMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981 });
            const busMat2 = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const busMat3 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

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
            const nodeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0284c7, emissiveIntensity: 0.8 });

            for (let i = 0; i < 6; i++) {
                const node = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), nodeMat);
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
            const coneGeo = new THREE.ConeGeometry(2, 2.5, 24, 1, true);
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
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 12, 40), ring1Mat);
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.04, 12, 40), ring1Mat);
            const ring3 = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.03, 12, 40), ring1Mat);

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

        let animationFrameId = null;
        let isVisible = true;

        const animate = () => {
            if (!isVisible) return;
            animationFrameId = requestAnimationFrame(animate);
            animateFunc();
            renderer.render(scene, camera);
        };

        const observer = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                if (!animationFrameId) animate();
            } else if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }, { threshold: 0.05 });

        observer.observe(currentMount);
        animate();

        return () => {
            observer.disconnect();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
                background: 'rgba(5, 7, 15, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px'
            }}
        />
    );
}

// ── Step-by-Step Animated SVG Pipeline Component ────────────────────
function DynamicPipelineVisualization() {
    const pipelineSteps = [
        {
            num: "01",
            title: "Data Sources",
            tag: "RAW STREAM",
            color: "#06b6d4",
            desc: "CTA passenger boarding CSV records + NOAA weather telemetry feeds."
        },
        {
            num: "02",
            title: "Preprocessing",
            tag: "SCALER & IMPUTE",
            color: "#10b981",
            desc: "Feature cleaning, NaN imputation, and MinMaxScaler Z-score normalization."
        },
        {
            num: "03",
            title: "ML Inference",
            tag: "PYTORCH & IFOREST",
            color: "#f59e0b",
            desc: "PyTorch 2-Layer LSTM demand, Isolation Forest anomaly scanner, XGBoost decay."
        },
        {
            num: "04",
            title: "FastAPI REST API",
            tag: "JSON BACKEND",
            color: "#8b5cf6",
            desc: "Uvicorn ASGI server serving REST endpoints (/api/demand, /api/buses)."
        },
        {
            num: "05",
            title: "React 3D Dashboard",
            tag: "WEBGL FRONTEND",
            color: "#ef4444",
            desc: "Interactive Leaflet city maps, Three.js 3D WebGL canvases, and Recharts graphs."
        }
    ];

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', position: 'relative', zIndex: 2 }}>
                {pipelineSteps.map((step, idx) => (
                    <div
                        key={idx}
                        className="glass-card"
                        style={{
                            padding: '20px',
                            background: 'rgba(10, 15, 30, 0.75)',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '14px',
                            border: `1px solid ${step.color}35`,
                            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 15px ${step.color}10`,
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px', fontWeight: '900', color: step.color, fontFamily: 'var(--font-mono, monospace)' }}>
                                {step.num}
                            </span>
                            <span
                                className="badge"
                                style={{
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    background: `${step.color}20`,
                                    color: step.color,
                                    border: `1px solid ${step.color}50`
                                }}
                            >
                                {step.tag}
                            </span>
                        </div>
                        <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: '800', margin: '0 0 6px 0' }}>
                            {step.title}
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
                            {step.desc}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '11px', color: step.color }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: step.color,
                                boxShadow: `0 0 8px ${step.color}`,
                                display: 'inline-block'
                            }} />
                            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '10px' }}>JSON TELEMETRY STREAMING</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(5, 7, 15, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ⚡ Real-Time Async JSON Data Pipeline (FastAPI ➔ React 3D Dashboard)
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Continuous Streaming Stream Rate: 30 FPS
                    </span>
                </div>

                <svg width="100%" height="40" viewBox="0 0 1000 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <path d="M 10 20 L 990 20" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="none" />
                    <path
                        d="M 10 20 L 990 20"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        fill="none"
                        className="animated-dash-line"
                    />
                    <circle r="5" fill="#06b6d4" filter="drop-shadow(0 0 6px #06b6d4)">
                        <animateMotion path="M 10 20 L 990 20" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle r="5" fill="#10b981" filter="drop-shadow(0 0 6px #10b981)">
                        <animateMotion path="M 10 20 L 990 20" dur="3s" begin="1s" repeatCount="indefinite" />
                    </circle>
                    <circle r="5" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)">
                        <animateMotion path="M 10 20 L 990 20" dur="3s" begin="2s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>
        </div>
    );
}

// ── SECTION 1: "How to Use the Platform (System Instructions)" ────────
function SystemInstructionsProcessFlow() {
    const shouldReduceMotion = useReducedMotion();

    const steps = [
        {
            num: 1,
            title: "Open Live Map",
            icon: "🗺️",
            color: "#06b6d4",
            desc: "Navigate to Live Map to view simulated buses moving across Chicago coordinates with occupancy badges."
        },
        {
            num: 2,
            title: "Inspect Bus Telemetry",
            icon: "🚌",
            color: "#06b6d4",
            desc: "Click any bus marker to view route name, current speed (km/h), occupancy (%), and zone location."
        },
        {
            num: 3,
            title: "Run Demand Forecast",
            icon: "📊",
            color: "#f59e0b",
            desc: "Go to Demand, adjust hour/weather parameters or click preset scenarios (Rain/Peak), then click Predict."
        },
        {
            num: 4,
            title: "Scan Anomalies",
            icon: "🚨",
            color: "#ef4444",
            desc: "Go to Anomalies and click Trigger Stream Scan to evaluate stream data against the Isolation Forest model."
        },
        {
            num: 5,
            title: "Simulate Events",
            icon: "🎯",
            color: "#8b5cf6",
            desc: "Go to Events, select event category (Concert/Match), adjust distance slider, and compute ridership multiplier."
        },
        {
            num: 6,
            title: "Execute Fleet Reroute",
            icon: "🔀",
            color: "#10b981",
            desc: "Review automated dispatcher recommendations on Live Map and click \"Execute Reroute\" to rebalance capacity."
        }
    ];

    return (
        <div className="glass-card" style={{ padding: '40px 28px', borderRadius: '24px', position: 'relative' }}>
            <div style={{ marginBottom: '36px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                    📖 How to Use the Platform (System Instructions)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Cinema-style numbered process flow with glowing center spine & interactive hover mechanics.
                </p>
            </div>

            <div style={{ position: 'relative', maxWidth: '960px', margin: '0 auto' }}>
                <div
                    className="center-spine-glowing"
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '20px',
                        bottom: '20px',
                        width: '4px',
                        transform: 'translateX(-50%)',
                        background: '#06b6d4',
                        borderRadius: '4px',
                        zIndex: 1
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', position: 'relative', zIndex: 2 }}>
                    {steps.map((step, idx) => {
                        const isLeft = idx % 2 === 0;
                        const xOffset = isLeft ? -60 : 60;

                        return (
                            <motion.div
                                key={step.num}
                                className="process-step-row"
                                initial={shouldReduceMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: xOffset }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ amount: 0.2, once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justify: isLeft ? 'flex-start' : 'flex-end',
                                    position: 'relative',
                                    width: '100%'
                                }}
                            >
                                <div
                                    className="step-card-hover-wrapper process-step-card"
                                    style={{
                                        width: 'calc(50% - 40px)',
                                        background: 'rgba(10, 15, 30, 0.82)',
                                        backdropFilter: 'blur(16px)',
                                        borderRadius: '16px',
                                        padding: '1.5rem',
                                        border: `1px solid ${step.color}45`,
                                        boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px ${step.color}10`,
                                        position: 'relative'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            [isLeft ? 'right' : 'left']: '-40px',
                                            width: '40px',
                                            height: '0px',
                                            borderTop: `2px dashed ${step.color}aa`,
                                            transform: 'translateY(-50%)'
                                        }}
                                    />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span className="step-icon-spin" style={{ fontSize: '24px' }}>
                                            {step.icon}
                                        </span>
                                        <h4 style={{ color: '#fff', fontSize: '17px', fontWeight: '800', margin: 0 }}>
                                            {step.title}
                                        </h4>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.55' }}>
                                        {step.desc}
                                    </p>
                                </div>

                                <div
                                    className="process-step-node"
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: step.color,
                                        boxShadow: `0 0 18px ${step.color}, 0 0 35px ${step.color}80`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justify: 'center',
                                        color: '#030712',
                                        fontWeight: '900',
                                        fontSize: '16px',
                                        fontFamily: 'var(--font-mono, monospace)',
                                        zIndex: 3,
                                        border: '3px solid #030712'
                                    }}
                                >
                                    {step.num}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Main Home Page Component ───────────────────────────────────────
function Home() {
    const navigate = useNavigate();
    const [cityStatus, setCityStatus] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [vizMode, setVizMode]       = useState('globe');

    const cardRectsRef = useRef(new Map());

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

    const handleCardMouseEnter = (e) => {
        const card = e.currentTarget;
        cardRectsRef.current.set(card, card.getBoundingClientRect());
    };

    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        let rect = cardRectsRef.current.get(card);
        if (!rect) {
            rect = card.getBoundingClientRect();
            cardRectsRef.current.set(card, rect);
        }
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.boxShadow = `0 20px 45px rgba(6, 182, 212, 0.28), 0 0 25px rgba(6, 182, 212, 0.15)`;
        card.style.borderColor = 'rgba(6, 182, 212, 0.45)';
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        cardRectsRef.current.delete(card);
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
        card.style.borderColor = '';
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '36px' }}>

            {/* 1. 3D HERO SECTION WITH PARTICLE SYSTEM & CAMERA PANNING */}
            <div
                className="glass-card result-card-glow"
                style={{
                    padding: '36px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '28px',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(10, 15, 30, 0.92) 60%, rgba(16, 185, 129, 0.12) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(6, 182, 212, 0.25)',
                    borderRadius: '24px'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className="badge badge-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
                            🟢 FASTAPI BACKEND ONLINE
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '12px', padding: '6px 14px' }}>
                            ✨ THREE.JS 3D PARTICLE ENGINE
                        </span>
                    </div>

                    <h1 style={{ fontSize: '40px', fontWeight: '900', margin: 0, color: '#fff', lineHeight: '1.15', letterSpacing: '-0.5px' }}>
                        Smart Bus Transit Demand Orchestration System
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0, lineHeight: '1.65' }}>
                        An intelligent real-time transit platform for telemetry monitoring, PyTorch passenger demand forecasting, Isolation Forest surge anomaly detection, and event fleet rebalancing.
                        Trained on Chicago CTA boarding records & NOAA weather telemetry.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <button
                            className={vizMode === 'globe' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setVizMode('globe')}
                            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600' }}
                        >
                            🌐 3D Transit Particles Globe
                        </button>
                        <button
                            className={vizMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setVizMode('grid')}
                            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '600' }}
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
                                ⚙️ Data Pipeline ↓
                            </button>
                        </a>
                    </div>
                </div>

                <div style={{ height: '380px', width: '100%', position: 'relative' }}>
                    <Transit3DCanvas mode={vizMode} />
                </div>
            </div>

            {/* 2. REAL-TIME TELEMETRY & ALERTS BANNER WITH DIGITAL ODOMETER */}
            <div
                className="glass-card"
                style={{
                    padding: '24px',
                    background: 'rgba(10, 15, 30, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '20px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                            ⚡ Live Telemetry & Network Alerts
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Real-time streaming stats via FastAPI REST API (`/api/buses`)
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '11px' }}>
                            🟢 LIVE MONITORING ACTIVE
                        </span>
                    </div>
                </div>

                <div className="stats-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div
                        className="stat-item glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <span className="stat-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            🚌 Active Buses (Telemetry)
                        </span>
                        <span className="stat-val" style={{ fontSize: '26px', color: 'var(--accent-cyan)', fontWeight: '800' }}>
                            {loading ? '...' : <OdometerNumber targetValue={cityStatus?.total_buses || 20} suffix=" Vehicles" />}
                        </span>
                    </div>

                    <div
                        className="stat-item glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <span className="stat-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            📊 Average Fleet Occupancy
                        </span>
                        <span className="stat-val" style={{ fontSize: '26px', color: 'var(--accent-green)', fontWeight: '800' }}>
                            {loading ? '...' : <OdometerNumber targetValue={cityStatus?.avg_occupancy || 50} suffix="%" />}
                        </span>
                    </div>

                    <div
                        className="stat-item glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className="stat-lbl" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                🕒 System Peak Status
                            </span>
                            <span className="badge badge-red pulse-badge-warning" style={{ fontSize: '10px', padding: '3px 8px', fontWeight: '700' }}>
                                ⚡ MORNING PEAK
                            </span>
                        </div>
                        <span className="stat-val" style={{ fontSize: '20px', color: 'var(--accent-orange)', fontWeight: '800', display: 'block', marginTop: '4px' }}>
                            {loading ? '...' : cityStatus?.peak_status || 'Morning Peak Hour — High Demand'}
                        </span>
                    </div>

                    <div
                        className="stat-item glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <span className="stat-lbl" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            🔥 Current Network Demand Level
                        </span>
                        <span className="stat-val" style={{ fontSize: '24px', color: 'var(--accent-red)', fontWeight: '800' }}>
                            {loading ? '...' : cityStatus?.demand_level || 'HIGH SURGE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. UPGRADED SYSTEM MODULE CARDS (GLASSMORPHISM + 3D HOVER TILT + SPRING SCALE) */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', margin: 0 }}>
                            🚀 System Functional Modules
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginTop: '4px' }}>
                            Dark glassmorphism cards with 3D cursor tilt physics and 1.05x WebGL mini-previews on hover
                        </p>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '12px', padding: '6px 14px' }}>
                        4 CORE ML PIPELINES
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>

                    <div
                        className="glass-card glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            background: 'linear-gradient(145deg, rgba(10, 15, 30, 0.85) 0%, rgba(6, 182, 212, 0.08) 100%)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '20px',
                            backdropFilter: 'blur(16px)'
                        }}
                        onClick={() => navigate('/map')}
                    >
                        <div className="inner-preview-container">
                            <Feature3DPreview type="map" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Live Transit Map</h4>
                            <span className="badge badge-green" style={{ fontSize: '10px' }}>TELEMETRY</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Track 20 simulated buses moving across Chicago coordinates, inspect occupancy status badges, and dispatch automated rerouting actions.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Open Live Map →
                        </button>
                    </div>

                    <div
                        className="glass-card glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            background: 'linear-gradient(145deg, rgba(10, 15, 30, 0.85) 0%, rgba(16, 185, 129, 0.08) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '20px',
                            backdropFilter: 'blur(16px)'
                        }}
                        onClick={() => navigate('/demand')}
                    >
                        <div className="inner-preview-container">
                            <Feature3DPreview type="forecast" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Demand Forecast</h4>
                            <span className="badge badge-cyan" style={{ fontSize: '10px' }}>PYTORCH LSTM</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Query the 2-layer PyTorch LSTM neural model to forecast future hourly ridership with NOAA weather sensitivity parameters.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Forecast →
                        </button>
                    </div>

                    <div
                        className="glass-card glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            background: 'linear-gradient(145deg, rgba(10, 15, 30, 0.85) 0%, rgba(239, 68, 68, 0.08) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '20px',
                            backdropFilter: 'blur(16px)'
                        }}
                        onClick={() => navigate('/anomaly')}
                    >
                        <div className="inner-preview-container">
                            <Feature3DPreview type="anomaly" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Anomaly Scanner</h4>
                            <span className="badge badge-red" style={{ fontSize: '10px' }}>ISOLATION FOREST</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Scan stream data with an Isolation Forest ensemble (100 trees) to flag unexpected passenger spikes and off-peak crowd surges.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Scanner →
                        </button>
                    </div>

                    <div
                        className="glass-card glass-module-card"
                        onMouseEnter={handleCardMouseEnter}
                        onMouseMove={handleCardMouseMove}
                        onMouseLeave={handleCardMouseLeave}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            background: 'linear-gradient(145deg, rgba(10, 15, 30, 0.85) 0%, rgba(245, 158, 11, 0.08) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '20px',
                            backdropFilter: 'blur(16px)'
                        }}
                        onClick={() => navigate('/events')}
                    >
                        <div className="inner-preview-container">
                            <Feature3DPreview type="events" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800' }}>Event Impact</h4>
                            <span className="badge badge-orange" style={{ fontSize: '10px' }}>XGBOOST DECAY</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, marginBottom: '18px', lineHeight: '1.5' }}>
                            Simulate venue scale & spatial distance decay to calculate ridership multipliers for proactive fleet pre-positioning.
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px', width: '100%', fontWeight: '700' }}>
                            Launch Simulator →
                        </button>
                    </div>

                </div>
            </div>

            {/* 4. DYNAMIC SYSTEM DATA PIPELINE VISUALIZATION */}
            <div id="how-it-works" className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: 0, marginBottom: '4px' }}>
                        ⚙️ System Data Pipeline & Data Streaming
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Step-by-step architecture with continuous glowing dots simulating real-time JSON data streaming from FastAPI backend to the 3D Dashboard.
                    </p>
                </div>

                <DynamicPipelineVisualization />
            </div>

            {/* 5. SYSTEM INSTRUCTIONS PROCESS FLOW */}
            <SystemInstructionsProcessFlow />

        </div>
    );
}

export default Home;
