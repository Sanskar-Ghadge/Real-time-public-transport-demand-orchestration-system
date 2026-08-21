import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getLiveBuses, getFleetStats, getRecommendations } from '../services/api';

// Import leaflet marker assets to support Vite ES module compilation
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Generate zone markers around Chicago
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

            if (statData) {
                setStats(statData);
            }

            if (recData && recData.recommendations) {
                setRecommendations(recData.recommendations);
            }

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

    const getBusColorName = (occupancy) => {
        if (occupancy < 40) return 'Available';
        if (occupancy < 80) return 'Half Full';
        return 'Full';
    };

    const getBusBadgeClass = (occupancy) => {
        if (occupancy < 40) return 'badge-green';
        if (occupancy < 80) return 'badge-orange';
        return 'badge-red';
    };

    const getZoneColor = (demand) => {
        if (demand < 30) return '#10b981';
        if (demand < 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="page-title-section">
                <div>
                    <h2 className="page-title">🗺️ Live City Map</h2>
                    <p className="page-subtitle">Real-time Chicago CTA bus tracking and passenger demand orchestration</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', display: 'block' }}>
                        Telemetry updated: {time.toLocaleTimeString()}
                    </span>
                    {error && <span style={{ color: 'var(--accent-orange)', fontSize: '11px' }}>{error}</span>}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-container">
                <div className="stat-item">
                    <span className="stat-lbl">🚌 Active Fleet</span>
                    <span className="stat-val" style={{ color: 'var(--accent-cyan)' }}>
                        {stats ? stats.total : buses.length}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-lbl">🟢 Available Buses</span>
                    <span className="stat-val" style={{ color: 'var(--accent-green)' }}>
                        {stats ? stats.available : buses.filter(b => b.occupancy < 40).length}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-lbl">🟡 Moderate Capacity</span>
                    <span className="stat-val" style={{ color: 'var(--accent-orange)' }}>
                        {stats ? stats.half_full : buses.filter(b => b.occupancy >= 40 && b.occupancy < 80).length}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-lbl">🔴 High Occupancy</span>
                    <span className="stat-val" style={{ color: 'var(--accent-red)' }}>
                        {stats ? stats.full : buses.filter(b => b.occupancy >= 80).length}
                    </span>
                </div>
            </div>

            {/* Recommendations Bar */}
            {recommendations.length > 0 && (
                <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(14, 165, 233, 0.08)' }}>
                    <h4 style={{ color: 'var(--accent-cyan)', margin: 0, marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase' }}>
                        ⚡ Automated Fleet Recommendations
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {recommendations.map((rec, idx) => (
                            <div key={idx} style={{ fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <span>
                                    <strong>{rec.bus_id}</strong>: {rec.action} from <em>{rec.from_zone}</em> to <em>{rec.to_zone}</em> ({rec.reason})
                                </span>
                                <span className={`badge ${rec.priority === 'HIGH' ? 'badge-red' : 'badge-orange'}`}>
                                    ETA {rec.eta_minutes}m | {rec.priority} PRIORITY
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div className="glass-card" style={{ padding: '8px', overflow: 'hidden' }}>
                <MapContainer
                    center={[41.85, -87.63]}
                    zoom={11}
                    style={{ height: '520px', width: '100%', borderRadius: '12px' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
                    />

                    {/* Zone demand circles */}
                    {zones.map(zone => (
                        <Circle
                            key={zone.id}
                            center={[zone.lat, zone.lon]}
                            radius={800}
                            pathOptions={{
                                color: getZoneColor(zone.demand),
                                fillOpacity: 0.25,
                                weight: 1.5
                            }}
                        >
                            <Popup>
                                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong style={{ color: 'var(--accent-cyan)' }}>{zone.id}</strong>
                                    <hr style={{ margin: '6px 0', borderColor: 'var(--glass-border)' }} />
                                    <span>Ridership: <strong>{zone.demand} pax/hr</strong></span>
                                </div>
                            </Popup>
                        </Circle>
                    ))}

                    {/* Bus markers */}
                    {buses.map(bus => (
                        <Marker
                            key={bus.id}
                            position={[bus.lat, bus.lon]}
                        >
                            <Popup>
                                <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong style={{ color: '#fff' }}>{bus.id}</strong>
                                    <hr style={{ margin: '6px 0', borderColor: 'var(--glass-border)' }} />
                                    <div>Route: <strong>{bus.route}</strong></div>
                                    <div>Speed: <strong>{bus.speed} km/h</strong></div>
                                    <div>Occupancy: <strong>{bus.occupancy}%</strong></div>
                                    <div style={{ marginTop: '6px' }}>
                                        Status: <span className={`badge ${getBusBadgeClass(bus.occupancy)}`}>
                                            {getBusColorName(bus.occupancy)}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', alignItems: 'center' }}>
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.4)', border: '1px solid #ef4444' }}></span> High-demand Zones
                </span>
            </div>
        </div>
    );
}

export default LiveMap;
