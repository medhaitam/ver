import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  FiActivity, 
  FiZap, 
  FiTrendingUp,
  FiSun,
  FiBarChart2
} from 'react-icons/fi';
import Gauge from './Gauge';
import '../styles/Dashboard.css';

const socket = io('http://localhost:3001');

const Dashboard = () => {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    irradiation: 0,
    efficiency: 0,
    timestamp: Date.now()
  });

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to backend'));
    
    socket.on('mqtt-data', (payload) => {
      const power = (payload.voltage * payload.current).toFixed(2);
      const efficiency = ((power / 5000) * 100).toFixed(1);
      
      setData({
        voltage: payload.voltage.toFixed(2),
        current: payload.current.toFixed(2),
        power,
        irradiation: payload.irradiation.toFixed(1),
        efficiency,
        timestamp: Date.now()
      });
    });

    return () => socket.off('mqtt-data');
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1><FiSun /> Monitoring Solaire</h1>
        <p>Données en temps réel - {new Date(data.timestamp).toLocaleTimeString()}</p>
      </header>

      <div className="metrics-grid">
        {/* Carte Tension */}
        <div className="metric-card">
          <div className="metric-header">
            <FiZap className="metric-icon" />
            <h3>Tension</h3>
          </div>
          <div className="metric-value">{data.voltage} V</div>
          <Gauge value={data.voltage} min={0} max={500} unit="V" colors={['#4361ee', '#e9ecef']} />
        </div>

        {/* Carte Courant */}
        <div className="metric-card">
          <div className="metric-header">
            <FiActivity className="metric-icon" />
            <h3>Courant</h3>
          </div>
          <div className="metric-value">{data.current} A</div>
          <Gauge value={data.current} min={0} max={20} unit="A" colors={['#4895ef', '#e9ecef']} />
        </div>

        {/* Carte Puissance */}
        <div className="metric-card">
          <div className="metric-header">
            <FiTrendingUp className="metric-icon" />
            <h3>Puissance</h3>
          </div>
          <div className="metric-value">{data.power} W</div>
          <Gauge value={data.power} min={0} max={10000} unit="W" colors={['#4cc9f0', '#e9ecef']} />
        </div>

        {/* Carte Irradiation */}
        <div className="metric-card">
          <div className="metric-header">
            <FiSun className="metric-icon" />
            <h3>Irradiation</h3>
          </div>
          <div className="metric-value">{data.irradiation} W/m²</div>
          <div className="irradiation-bar">
            <div 
              className="irradiation-fill"
              style={{ width: `${Math.min(100, data.irradiation/15 * 100)}%` }}
            ></div>
          </div>
          <div className="irradiation-labels">
            <span>0</span>
            <span>15 W/m²</span>
          </div>
        </div>
      </div>

      {/* Graphique principal */}
      <div className="main-chart">
        <h2><FiBarChart2 /> Historique de Performance</h2>
        <div className="chart-placeholder">
          {/* Ici vous intégrerez votre composant de graphique */}
          <p>Graphique des données historiques</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;