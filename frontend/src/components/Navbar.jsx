import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { to: '/',        label: 'Overview',  icon: '⬡', end: true  },
    { to: '/map',     label: 'Live Map',  icon: '◎'             },
    { to: '/demand',  label: 'Demand',    icon: '◈'             },
    { to: '/anomaly', label: 'Anomalies', icon: '◬'             },
    { to: '/events',  label: 'Events',    icon: '◆'             },
];

function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled]   = useState(false);
    const [time,     setTime]       = useState(new Date());
    const [mobileOpen, setMobileOpen] = useState(false);

    /* Live clock */
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    /* Scroll shadow */
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* Close mobile menu on route change */
    useEffect(() => { setMobileOpen(false); }, [location]);

    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return (
        <nav
            className="custom-nav"
            style={{
                boxShadow: scrolled
                    ? '0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                    : '0 1px 0 rgba(255,255,255,0.04)'
            }}
        >
            {/* Brand */}
            <NavLink to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
                <span className="nav-brand-icon">🚍</span>
                <span style={{ lineHeight: 1 }}>
                    <span style={{ display: 'block', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                        ChicagoTransit
                    </span>
                    <span style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        WebkitTextFillColor: 'var(--text-muted)',
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase'
                    }}>
                        AI Demand Orchestration
                    </span>
                </span>
            </NavLink>

            {/* Desktop Links */}
            <div className="nav-links" style={{ display: 'flex' }}>
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span style={{ fontSize: '14px' }}>{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Right cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {/* Live clock */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.5px'
                }}>
                    <span style={{ color: 'var(--cyan)', fontSize: '9px' }}>⏱</span>
                    {timeStr}
                </div>

                {/* Status badge */}
                <div className="nav-status">
                    <span className="status-dot" />
                    System Online
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(o => !o)}
                    style={{
                        display: 'none',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-secondary)',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        lineHeight: 1,
                    }}
                    className="nav-hamburger"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? '✕' : '≡'}
                </button>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div style={{
                    position: 'absolute',
                    top: '64px',
                    left: 0, right: 0,
                    background: 'rgba(3,7,18,0.97)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--glass-border)',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 9998,
                    animation: 'fade-up 0.2s ease both'
                }}>
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            <span style={{ fontSize: '15px' }}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
