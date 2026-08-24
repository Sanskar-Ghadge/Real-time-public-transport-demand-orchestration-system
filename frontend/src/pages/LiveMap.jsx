import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getLiveBuses, getFleetStats, getRecommendations } from '../services/api';

// Create custom glowing DIV icons for buses
const createCustomBusIcon = (occupancy) => {
    let color = '#10b981'; // Green
    let glowColor = 'rgba(16, 185, 129, 0.4)';
    if (occupancy >= 80) {
        color = '#ef4444'; // Red
        glowColor = 'rgba(239, 68, 68, 0.5)';
    } else if (occupancy >= 40) {
        color = '#f59e0b'; // Orange
        glowColor = 'rgba(245, 158, 11, 0.4)';
    }

    return L.divIcon({
        className: 'custom-bus-marker',
        html: `
            <div style="
                position: relative;
                width: 34px;
                height: 34px;
                background: rgba(15, 23, 42, 0.9);
                border: 2px solid ${color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 14px ${glowColor};
                color: #fff;
                font-weight: 800;
                font-size: 11px;
                cursor: pointer;
            ">
                <span>🚌</span>
                <span style="
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: ${color};
                    color: #000;
                    font-size: 9px;
                    font-weight: 900;
                    padding: 1px 4px;
                    border-radius: 8px;
                    box-shadow: 0 0 6px ${glowColor};
                ">${occupancy}%</span>
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });
};

const generateZones = () => {
    const zones = [];
    const centralLat = 41.88;
    const centralLon = -87.63;
    
    zones.push({
        id: `ZONE_41.7200_-87.6250`,
        lat: 41.7200,
        lon: -87.6250,
        demand: 85
    });

    for (let i = 1; i < 8; i++) {
        zones.push({
            id: `ZONE_${i} (Simulated)`,
            lat: centralLat + (Math.random() - 0.5) * 0.08,
            lon: centralLon + (Math.random() - 0.5) * 0.08,
            demand: Math.floor(Math.random() * 100)
        });
    }
    return zones;
};

function LiveMap() {
    const [buses, setBuses]                       = useState([]);
    const [stats, setStats]                       = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [zones]                                 = useState(generateZones());
    const [time, setTime]                         = useState(new Date());
    const [error, setError]                       = useState(null);
    const [filterStatus, setFilterStatus]         = useState('ALL');
    const [selectedBus, setSelectedBus]           = useState(null);
    const [dispatchedRecs, setDispatchedRecs]     = useState({});

    const fetchData = async () => {
        try {
            const busData = await getLiveBuses();
            const statData = await getFleetStats();
            const recData  = await getRecommendations();

            if (busData && busData.buses) {
                const formattedBuses = busData.buses.map(b => ({
                    id: b.bus_id,
                    lat: b.lat,
                    lon: b.lon,
                    occupancy: b.occupancy,
                    route: b.route,
                    speed: b.speed_kmh || 25,
                    zone_id: b.zone_id
                }));
                setBuses(formattedBuses);
            }

            if (statData) setStats(statData);
            if (recData && recData.recommendations) setRecommendations(recData.recommendations);

            setError(null);
            setTime(new Date());
        } catch (err) {
            console.error('API Connection error:', err);
            setError('Connecting to backend...');
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // 3D Card Hover Handler
    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.boxShadow = `0 15px 30px rgba(14, 165, 233, 0.2)`;
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = 'none';
    };

    const handleDispatch = (idx) => {
        setDispatchedRecs(prev => ({ ...prev, [idx]: true }));
    };

    const filteredBuses = buses.filter(b => {
        if (filterStatus === 'GREEN') return b.occupancy < 40;
        if (filterStatus === 'ORANGE') return b.occupancy >= 40 && b.occupancy < 80;
        if (filterStatus === 'RED') return b.occupancy >= 80;
        return true;
    });

    const getZoneColor = (demand) => {
        if (demand < 30) return '#10b981';
        if (demand < 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Page Header */}
            <div className="page-title-section" style={{ marginBottom: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h2 className="page-title" style={{ margin: 0 }}>🗺️ Live Transit Map</h2>
                        <span className="badge badge-orange" style={{ fontSize: '11px' }}>SIMULATION MODE / DEMO DATA</span>
                    </div>
                    <p className="page-subtitle">Simulated vehicle tracking across Chicago coordinates with live occupancy badges and fleet rebalancing</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-green" style={{ fontSize: '12px', padding: '6px 14px' }}>
                        🟢 DEMO STREAM: {time.toLocaleTimeString()}
                    </span>
                    {error && <span style={{ color: 'var(--accent-orange)', fontSize: '11px', display: 'block', marginTop: '4px' }}>{error}</span>}
                </div>
            </div>

            {/* 📊 Interactive Telemetry Stats Grid */}
            <div className="stats-container" style={{ margin: 0 }}>
                <div
                    className="stat-item"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setFilterStatus('ALL')}
                    style={{
                        cursor: 'pointer',
                        borderLeft: filterStatus === 'ALL' ? '4px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                        background: filterStatus === 'ALL' ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-secondary)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <span className="stat-lbl">🚌 Active Fleet (Total)</span>
                    <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>
                        {stats ? stats.total : buses.length} Buses
                    </span>
                </div>

                <div
                    className="stat-item"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setFilterStatus('GREEN')}
                    style={{
                        cursor: 'pointer',
                        borderLeft: filterStatus === 'GREEN' ? '4px solid var(--accent-green)' : '1px solid var(--glass-border)',
                        background: filterStatus === 'GREEN' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <span className="stat-lbl">🟢 Available (&lt;40%)</span>
                    <span className="stat-val" style={{ color: 'var(--accent-green)' }}>
                        {stats ? stats.available : buses.filter(b => b.occupancy < 40).length}
                    </span>
                </div>

                <div
                    className="stat-item"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setFilterStatus('ORANGE')}
                    style={{
                        cursor: 'pointer',
                        borderLeft: filterStatus === 'ORANGE' ? '4px solid var(--accent-orange)' : '1px solid var(--glass-border)',
                        background: filterStatus === 'ORANGE' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <span className="stat-lbl">🟡 Moderate (40-80%)</span>
                    <span className="stat-val" style={{ color: 'var(--accent-orange)' }}>
                        {stats ? stats.half_full : buses.filter(b => b.occupancy >= 40 && b.occupancy < 80).length}
                    </span>
                </div>

                <div
                    className="stat-item"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={() => setFilterStatus('RED')}
                    style={{
                        cursor: 'pointer',
                        borderLeft: filterStatus === 'RED' ? '4px solid var(--accent-red)' : '1px solid var(--glass-border)',
                        background: filterStatus === 'RED' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                >
                    <span className="stat-lbl">🔴 High Occupancy (&gt;80%)</span>
                    <span className="stat-val" style={{ color: 'var(--accent-red)' }}>
                        {stats ? stats.full : buses.filter(b => b.occupancy >= 80).length}
                    </span>
                </div>
            </div>

            {/* ⚡ Automated Rerouting Console */}
            {recommendations.length > 0 && (
                <div
                    className="glass-card"
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{
                        padding: '20px',
                        border: '1px solid rgba(14, 165, 233, 0.4)',
                        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '15px', fontWeight: '800', textTransform: 'uppercase' }}>
                            ⚡ Automated Fleet Rebalancing Console
                        </h4>
                        <span className="badge badge-cyan" style={{ fontSize: '10px' }}>AI DISPATCHER ACTIVE</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recommendations.map((rec, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    background: 'rgba(5, 7, 15, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ fontSize: '13px', color: '#fff' }}>
                                    <strong style={{ color: 'var(--accent-cyan)' }}>{rec.bus_id}</strong>: Reroute from <em>{rec.from_zone}</em> ➔ <strong>{rec.to_zone}</strong> ({rec.reason})
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className={`badge ${rec.priority === 'HIGH' ? 'badge-red' : 'badge-orange'}`}>
                                        ETA {rec.eta_minutes}m | {rec.priority} PRIORITY
                                    </span>

                                    {dispatchedRecs[idx] ? (
                                        <span className="badge badge-green" style={{ fontSize: '11px', padding: '6px 12px' }}>
                                            ✓ REROUTE EXECUTED
                                        </span>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700' }}
                                            onClick={() => handleDispatch(idx)}
                                        >
                                            ⚡ Execute Reroute
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🗺️ Leaflet Map Container */}
            <div className="glass-card" style={{ padding: '12px', overflow: 'hidden', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Filter View:</span>
                        <span className="badge badge-cyan" style={{ fontSize: '11px' }}>{filterStatus} ({filteredBuses.length} Vehicles Shown)</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Click bus marker for route diagnostics
                    </span>
                </div>

                <MapContainer
                    center={[41.85, -87.63]}
                    zoom={11}
                    style={{ height: '540px', width: '100%', borderRadius: '12px' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                    />

                    {/* Zone Demand Heatmap Circles */}
                    {zones.map(zone => (
                        <Circle
                            key={zone.id}
                            center={[zone.lat, zone.lon]}
                            radius={850}
                            pathOptions={{
                                color: getZoneColor(zone.demand),
                                fillColor: getZoneColor(zone.demand),
                                fillOpacity: 0.28,
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                    <strong style={{ color: 'var(--accent-cyan)' }}>{zone.id}</strong>
                                    <hr style={{ margin: '6px 0', borderColor: 'var(--glass-border)' }} />
                                    <div>Boarding Density: <strong>{zone.demand} pax/hr</strong></div>
                                    <div>Surge Risk: <span className={`badge ${zone.demand > 60 ? 'badge-red' : 'badge-green'}`}>
                                        {zone.demand > 60 ? 'HIGH SURGE' : 'STABLE'}
                                    </span></div>
                                </div>
                            </Popup>
                        </Circle>
                    ))}

                    {/* Custom Glowing Bus Markers */}
                    {filteredBuses.map(bus => (
                        <Marker
                            key={bus.id}
                            position={[bus.lat, bus.lon]}
                            icon={createCustomBusIcon(bus.occupancy)}
                            eventHandlers={{
                                click: () => setSelectedBus(bus)
                            }}
                        >
                            <Popup>
                                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                                    <strong style={{ color: '#fff', fontSize: '14px' }}>{bus.id}</strong>
                                    <hr style={{ margin: '6px 0', borderColor: 'var(--glass-border)' }} />
                                    <div>Route: <strong style={{ color: 'var(--accent-cyan)' }}>{bus.route}</strong></div>
                                    <div>Telemetry Speed: <strong>{bus.speed} km/h</strong></div>
                                    <div>Occupancy: <strong>{bus.occupancy}%</strong></div>
                                    <div style={{ marginTop: '8px' }}>
                                        Status: <span className={`badge ${
                                            bus.occupancy >= 80 ? 'badge-red' :
                                            bus.occupancy >= 40 ? 'badge-orange' : 'badge-green'
                                        }`}>
                                            {bus.occupancy >= 80 ? 'FULL (REROUTE NEEDED)' : bus.occupancy >= 40 ? 'HALF FULL' : 'AVAILABLE'}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Map Legend */}
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#fff' }}>Status Indicators:</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-green">Available</span> &lt;40% capacity
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-orange">Half Full</span> 40% - 80% capacity
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-red">Full</span> &gt;80% capacity
                    </span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    Auto-refreshing every 10s via FastAPI REST Stream
                </span>
            </div>

        </div>
    );
}

export default LiveMap;
