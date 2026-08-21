import React, { useState } from 'react';
import { predictEventImpact } from '../services/api';

const EVENT_TYPES = [
    { value: 0, label: 'Concert 🎵' },
    { value: 1, label: 'Cricket Match 🏏' },
    { value: 2, label: 'Festival 🎪' },
    { value: 3, label: 'Protest 🪧' },
    { value: 4, label: 'Holiday 🏖️' }
];

const EVENT_SIZES = [
    { value: 0, label: 'Small' },
    { value: 1, label: 'Medium' },
    { value: 2, label: 'Large' }
];

function EventImpact() {
    const [form, setForm]       = useState({
        zone_id: 'ZONE_41.7200_-87.6250',
        event_type: 2, event_size: 2,
        distance_km: 0.3, hours_to_event: 1.0, day_of_week: 6
    });
    const [result, setResult]   = useState(null);
    const [loading, setLoading] = useState(false);

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

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="page-title-section">
                <div>
                    <h2 className="page-title">🎯 Event Impact Predictor</h2>
                    <p className="page-subtitle">XGBoost event model predicting transit demand multipliers near crowds</p>
                </div>
            </div>

            {/* Input Form Card */}
            <div className="glass-card">
                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Event Parameters</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group">
                        <label>Event Type</label>
                        <select
                            className="form-control"
                            value={form.event_type}
                            onChange={e => setForm({ ...form, event_type: e.target.value })}
                        >
                            {EVENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Scale / Size</label>
                        <select
                            className="form-control"
                            value={form.event_size}
                            onChange={e => setForm({ ...form, event_size: e.target.value })}
                        >
                            {EVENT_SIZES.map(s => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Distance to Zone (km)</label>
                        <input
                            type="number" step="0.1" min="0.1" max="10"
                            className="form-control"
                            value={form.distance_km}
                            onChange={e => setForm({ ...form, distance_km: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Hours Until Event</label>
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
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-success"
                    style={{ width: '100%', maxWidth: '240px' }}
                >
                    {loading ? '⚡ Simulating impact...' : '⚡ Calculate Impact'}
                </button>
            </div>

            {/* Result Display */}
            {result && (
                <div 
                    className="glass-card" 
                    style={{ 
                        border: `1.5px solid ${getImpactColor(result.impact_level)}`,
                        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(11, 15, 25, 0.9) 100%)`,
                        boxShadow: `0 0 20px rgba(0, 0, 0, 0.5), 0 0 15px ${getImpactColor(result.impact_level)}1b`
                    }}
                >
                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase' }}>
                        Simulation Result
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', minWidth: '130px' }}>
                            <div className="multiplier-circle" style={{ 
                                color: getImpactColor(result.impact_level),
                                borderColor: `${getImpactColor(result.impact_level)}33`,
                                boxShadow: `0 0 15px ${getImpactColor(result.impact_level)}1f`
                            }}>
                                {result.multiplier}x
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textTransform: 'uppercase' }}>Multiplier</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Threat Matrix Level:</span>
                                <span className={`badge ${getImpactBadgeClass(result.impact_level)}`}>
                                    {result.impact_level} IMPACT
                                </span>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                                {result.message}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Target Zone: <strong>{result.zone_id}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventImpact;
