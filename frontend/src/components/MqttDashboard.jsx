// src/components/MqttDashboard.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import Gauge from './Gauge';
import '../styles/SolarDashboard.css';
import { 
  FiActivity, 
  FiZap, 
  FiTrendingUp,
  FiClock,
  FiSun,
  FiBarChart2
} from 'react-icons/fi';

const socket = io('http://localhost:3001');

const MqttDashboard = () => {
  const [latest, setLatest] = useState({ 
    voltage: 0, 
    current: 0,
    power: 0,
    efficiency: 0
  });
  
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState('5m');

  useEffect(() => {
    socket.on('connect', () => console.log('✅ Connecté au backend'));
    
    socket.on('mqtt-data', (payload) => {
      // Calculs
      const power = (payload.voltage * payload.current).toFixed(2);
      const efficiency = ((power / 5000) * 100).toFixed(1); // Simulation
      
      const newData = {
        ...payload,
        power,
        efficiency,
        timestamp: new Date().getTime(),
        time: new Date().toLocaleTimeString()
      };
      
      setLatest(newData);
      setHistory(prev => [...prev.slice(-30), newData]);
    });

    return () => socket.off('mqtt-data');
  }, []);

  // Filtre les données selon l'intervalle de temps
  const filteredData = history.filter(point => {
    const now = Date.now();
    switch(timeRange) {
      case '5m': return point.timestamp > now - 300000;
      case '15m': return point.timestamp > now - 900000;
      case '1h': return point.timestamp > now - 3600000;
      default: return true;
    }
  });

  return (
    <div className="solar-dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          <FiSun style={{ marginRight: '10px' }} />
          Solar Monitoring Dashboard
        </h1>
        <p className="dashboard-subtitle">
          Surveillance en temps réel de votre installation photovoltaïque
        </p>
      </header>

      <div className="gauges-container">
        <div className="gauge-card">
          <h3 className="gauge-title">
            <FiZap /> Tension
          </h3>
          <Gauge 
            value={latest.voltage} 
            min={0} 
            max={500} 
            unit="V"
            colors={['#4361ee', '#e9ecef']}
          />
        </div>

        <div className="gauge-card">
          <h3 className="gauge-title">
            <FiActivity /> Courant
          </h3>
          <Gauge 
            value={latest.current} 
            min={0} 
            max={20} 
            unit="A"
            colors={['#4895ef', '#e9ecef']}
          />
        </div>

        <div className="gauge-card">
          <h3 className="gauge-title">
            <FiTrendingUp /> Puissance
          </h3>
          <Gauge 
            value={latest.power} 
            min={0} 
            max={10000} 
            unit="W"
            colors={['#4cc9f0', '#e9ecef']}
          />
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3 className="chart-title">
            <FiBarChart2 style={{ marginRight: '10px' }} />
            Historique de Puissance
          </h3>
          <div className="time-selector">
            {['5m', '15m', '1h'].map(range => (
              <button
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#6c757d' }}
              />
              <YAxis 
                domain={[0, 4000]} // Plage fixe de 0 à 10,000W
                ticks={[0, 2000, 4000]} // Ticks spécifiques
                tick={{ fill: '#6c757d' }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="power" 
                stroke="#4cc9f0" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, stroke: '#4cc9f0', strokeWidth: 2 }}
                name="Puissance"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="raw-data-container">
        <h3>Dernières mesures</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <div>
            <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Tension</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {latest.voltage} <span style={{ fontSize: '1rem' }}>V</span>
            </p>
          </div>
          <div>
            <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Courant</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {latest.current} <span style={{ fontSize: '1rem' }}>A</span>
            </p>
          </div>
          <div>
            <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Puissance</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {latest.power} <span style={{ fontSize: '1rem' }}>W</span>
            </p>
          </div>
          <div>
            <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>Efficacité</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {latest.efficiency} <span style={{ fontSize: '1rem' }}>%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MqttDashboard;