import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LiveMap from './pages/LiveMap';
import DemandForecast from './pages/DemandForecast';
import AnomalyAlerts from './pages/AnomalyAlerts';
import EventImpact from './pages/EventImpact';
import './App.css';

function App() {
    return (
        <Router>
            <div className="dashboard-container">
                <Navbar />
                <Routes>
                    <Route path="/"        element={<Home />} />
                    <Route path="/map"     element={<LiveMap />} />
                    <Route path="/demand"  element={<DemandForecast />} />
                    <Route path="/anomaly" element={<AnomalyAlerts />} />
                    <Route path="/events"  element={<EventImpact />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
