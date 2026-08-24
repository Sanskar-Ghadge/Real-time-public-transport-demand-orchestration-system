import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="custom-nav">
            <NavLink to="/" className="nav-brand">
                🚍 Smart Bus Transit
            </NavLink>
            <div className="nav-links">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🏠 Overview
                </NavLink>
                <NavLink to="/map" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🗺️ Live Map
                </NavLink>
                <NavLink to="/demand" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    📊 Demand
                </NavLink>
                <NavLink to="/anomaly" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🚨 Anomalies
                </NavLink>
                <NavLink to="/events" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    🎯 Events
                </NavLink>
            </div>
            <div className="nav-status">
                <span className="status-dot"></span> System Online (Demo Mode)
            </div>
        </nav>
    );
}

export default Navbar;
