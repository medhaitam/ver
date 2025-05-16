import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  LineChart, Line, 
  XAxis, YAxis, 
  CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Gauge from './Gauge';
import EfficiencyBadge from './EfficiencyBadge';
import '../styles/SolarDashboard.css';
import {
  FiZap,
  FiWifi,
  FiWifiOff ,
  FiTrendingUp,
  FiCpu,
  FiBattery,
  FiClock,
  FiAlertTriangle,
  FiActivity,
  FiSun,
  FiBarChart2,
  FiSunrise,
  FiThermometer,
  FiDroplet,
  FiCalendar
} from 'react-icons/fi';
import { Sun, Droplets } from 'lucide-react';

// Configuration de la connexion Socket.IO
const socket = io('http://localhost:5000', {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

const MqttDashboard = () => {
  const [systemData, setSystemData] = useState({ 
    dc_efficiency: 0,
    panelRefVoltage: 0,
    panelRefCurrent: 0,
    panelRefPower: 0,
    panelRefEfficiency: 0,
    panleRefTemp:0,
    irradiation: 0,
    frequency_ref: 0,
    output_freq: 0,
    output_power: 0,
    dc_bus_voltage: 0,
    module_temp: 0,
    dc_current: 0,
    dc_power:0,
    flow_speed: 0,
    voc_voltage: 0,
    daily_flow: 0,
    cumulative_flow_low: 0,
    cumulative_flow_high: 0,
    daily_gen_power: 0,
    total_power_low: 0,
    total_power_high: 0,
    lastUpdate: new Date(),
    alerts: []
  });
  
  const [historicalData, setHistoricalData] = useState([]);
  const [timeRange, setTimeRange] = useState('15m');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Calculs d'efficacité
  const calculateEfficiency = (voltage, current, irradiation, area = 0.1) => {
    const power = voltage * current;
    const incidentPower = irradiation * area;
    return incidentPower > 0 ? Math.min(100, (power / incidentPower) * 100).toFixed(1) : 0;
  };
  
  // Gestion des connexions Socket.IO
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Connected to backend');
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      console.log('❌ Disconnected from backend');
      setConnectionStatus('disconnected');
    };

    const handleMqttData = (payload) => {
      console.log("📡 Données reçues :", payload);
      const power = (payload.voltage * payload.current).toFixed(2);
      const efficiency = ((power / 5000) * 100).toFixed(1);
      const panelRefEfficiency = calculateEfficiency(
        payload.panelRefVoltage || 0,
        payload.panelRefCurrent || 0,
        payload.irradiation || 0
      );

      const newDataPoint = {
        ...payload,
        power,
        efficiency,
        panelRefVoltage: (payload.panelRefVoltage || 0).toFixed(2),
        panelRefCurrent: (payload.panelRefCurrent || 0).toFixed(2),
        panelRefEfficiency,
        irradiation: (payload.irradiation || 0).toFixed(1),
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
        alerts: checkForAlerts(payload)
      };

      setSystemData(prev => ({
        ...newDataPoint,
        lastUpdate: new Date(),
        alerts: newDataPoint.alerts
      }));

      setHistoricalData(prev => [...prev.slice(-50), newDataPoint]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('solar_update', handleMqttData);
    socket.on('alert', (alert) => {
      setSystemData(prev => ({
        ...prev,
        alerts: [...prev.alerts.slice(-3), alert]
      }));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('mqtt-data', handleMqttData);
      socket.off('alert');
    };
  }, []);

  // Vérification des alertes
  const checkForAlerts = (data) => {
    const alerts = [];
    if (data.voltage > 280) alerts.push('High voltage warning');
    if (data.current > 15) alerts.push('High current warning');
    if (data.irradiation > 1200) alerts.push('High irradiation');
    return alerts;
  };

  // Filtrage des données historiques
  const getFilteredData = () => {
    const now = Date.now();
    const cutoff = {
      '5m': now - 300000,
      '15m': now - 900000,
      '1h': now - 3600000,
      '6h': now - 21600000,
      '24h': now - 86400000
    }[timeRange] || now;

    return historicalData.filter(point => point.timestamp > cutoff);
  };

  // Couleur dynamique pour l'efficacité
  const getEfficiencyColor = (value) => {
    const eff = parseFloat(value) || 0;
    return eff > 18 ? '#28a745' : eff > 12 ? '#ffc107' : '#dc3545';
  };

  const StatCard = ({ label, value, unit }) => {
    return (
      <div className="rounded-2xl shadow p-4 bg-white">
        <div className="p-0">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-xl font-bold">{value ?? "-"} {unit}</div>
        </div>
      </div>
    );
  };

  const formatNumber = (value, decimals = 1) => {
    return value.toFixed(decimals);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case "online": return "bg-green-500";
      case "offline": return "bg-red-500";
      case "degraded": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };
  

  return (
    <div className="flex h-screen">
      {/* Sidebar simplifiée (sans boutons) */}
      <div className="w-64 bg-gray-100 p-4 border-r">
        {/* Vous pouvez mettre ici d'autres éléments de sidebar si nécessaire */}
        {/* Par exemple : logo, informations système, etc. */}
        <div className="flex flex-col items-center mt-4">
          <h2 className="mt-2 text-lg font-semibold"></h2>
        </div>
      </div>


      <div className="tab-navigation">
  <div className="tab-buttons-container">
  <div 
      className="active-tab-bg"
      style={{
        width: `${100 / 3}%`,
        transform: `translateX(${['dashboard', 'solar', 'pump'].indexOf(activeTab) * 100}%)`
      }}
    ></div>
    
    {['dashboard', 'solar', 'pump'].map((tab) => (
      <button
        key={tab}
        className={`tab-button ${activeTab === tab ? 'active' : ''}`}
        onClick={() => setActiveTab(tab)}
      >
        <span className="tab-icon">
          {tab === 'dashboard' && <FiActivity />}
          {tab === 'solar' && <FiSun />}
          {tab === 'pump' && <FiDroplet />}
        </span>
        <span className="tab-label">
          {tab === 'dashboard' && 'Dashboard'}
          {tab === 'solar' && 'Solaire'}
          {tab === 'pump' && 'Pompe'}
        </span>
        <span className="tab-indicator"></span>
      </button>
    ))}
  </div>
</div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
      {activeTab === 'solar' && (
  <div className="solar-dashboard">
    {/* Barre de statut supérieure */}
    <div className={`status-bar ${connectionStatus}`}>
      <div className="status-item">
        <FiSun className="status-icon" />
        <span className="status-label">Tension Cellule:</span>
        <span className="status-value">
          {systemData.panelRefVoltage}V
        </span>
      </div>
      
      <div className="status-item">
        <FiZap className="status-icon" />
        <span className="status-label">Puissance Cellule:</span>
        <span className="status-value">
          {systemData.panelRefPower} W
        </span>
      </div>
      
      <div className="status-item">
        <FiThermometer className="status-icon" />
        <span className="status-label">Température Cellule:</span>
        <span className="status-value">
          {systemData.panleRefTemp} °C
        </span>
      </div>
      
      <div className="status-item">
        <FiClock className="status-icon" />
        <span className="status-label">Mise à jour:</span>
        <span className="status-value">
          {systemData.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>

    {/* En-tête du tableau de bord */}
    
    <header className="dashboard-header bg-white shadow-sm p-6 rounded-lg">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <FiSun className="text-yellow-500" />
        <span>Statistiques Solaire</span>
      </h1>
      <p className="dashboard-subtitle text-gray-500 mt-1">
        Données complètes du système photovoltaïque
      </p>
    </div>
    
    <div className={`connection-status flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connectionStatus === 'connected' 
        ? 'bg-green-50 text-green-700' 
        : 'bg-red-50 text-red-700'
    }`}>
      <span className={`inline-block w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
      }`}></span>
      {connectionStatus === 'connected' ? 'En ligne' : 'Hors ligne'}
    </div>
  </div>
</header>

    {/* Alertes système */}
    {systemData.alerts.length > 0 && (
      <div className="alerts-container">
        {systemData.alerts.map((alert, index) => (
          <div key={index} className="alert-item">
            <FiAlertTriangle className="alert-icon" />
            {alert}
          </div>
        ))}
      </div>
    )}

    {/* Jauges principales */}
    <div className="gauges-container">
      <DashboardGauge 
        title="Tension DC"
        value={systemData.dc_bus_voltage}
        unit="V"
        min={0}
        max={500}
        icon={<FiZap />}
        colors={['#4361ee', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Courant DC"
        value={systemData.dc_current}
        unit="A"
        min={0}
        max={100}
        icon={<FiActivity />}
        colors={['#4895ef', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Puissance"
        value={systemData.dc_power}
        unit="kW"
        min={0}
        max={200}
        icon={<FiTrendingUp />}
        colors={['#4cc9f0', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Voc Voltage"
        value={systemData.voc_voltage}
        unit="V"
        min={0}
        max={600}
        icon={<FiZap />}
        colors={['#7209b7', '#e9ecef']}
      />
    </div>

    {/* Graphique historique */}
    <div className="chart-container">
      <div className="chart-header">
        <h2>
          <FiBarChart2 className="chart-icon" />
          Performance du système solaire
        </h2>
        <div className="time-selector">
          {['15m', '1h', '6h', '24h'].map(range => (
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
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getFilteredData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#6c757d' }}
              tickMargin={10}
            />
            <YAxis 
              domain={[0, 'dataMax + 100']}
              tick={{ fill: '#6c757d' }}
              label={{ 
                value: 'Puissance (kW)', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#6c757d'
              }}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.96)',
                borderRadius: '8px',
                boxShadow: '0 3px 14px rgba(0,0,0,0.1)',
                border: 'none'
              }}
              formatter={(value) => [`${value} kW`, 'Puissance']}
              labelFormatter={(time) => `Heure: ${time}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="dc_power"
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

    {/* Données brutes */}
    <div className="data-summary">
      <h3>Détails des mesures solaires</h3>
      <div className="data-grid">
        <DataCard 
          title="Energie Journalière" 
          value={systemData.daily_gen_power} 
          unit="kWh" 
          trend={systemData.daily_gen_power > 50 ? 'up' : 'down'}
        />
        <DataCard 
          title="Energie Totale" 
          value={systemData.total_power_low} 
          unit="kWh" 
        />
        <DataCard 
          title="Irradiation" 
          value={systemData.irradiation} 
          unit="W/m²" 
        />
        <DataCard 
          title="Température Module" 
          value={systemData.module_temp} 
          unit="°C" 
        />
      </div>
    </div>
  </div>
)}

{activeTab === 'pump' && (
  <div className="solar-dashboard">
    {/* Barre de statut supérieure */}
    <div className={`status-bar ${connectionStatus}`}>
      <div className="status-item">
        <FiDroplet className="status-icon" />
        <span className="status-label">Débit Instantané:</span>
        <span className="status-value">
          {systemData.flow_speed} m³/h
        </span>
      </div>
      
      <div className="status-item">
        <FiZap className="status-icon" />
        <span className="status-label">Puissance:</span>
        <span className="status-value">
          {systemData.output_power} kW
        </span>
      </div>
      
      <div className="status-item">
        <FiCalendar className="status-icon" />
        <span className="status-label">Débit Journalier:</span>
        <span className="status-value">
          {systemData.daily_flow} m³
        </span>
      </div>
      
      <div className="status-item">
        <FiClock className="status-icon" />
        <span className="status-label">Mise à jour:</span>
        <span className="status-value">
          {systemData.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>

    {/* En-tête du tableau de bord */}
    
    <header className="dashboard-header bg-white shadow-sm p-6 rounded-lg">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <FiDroplet className="text-yellow-500" />
        <span>Statistiques Pompe</span>
      </h1>
      <p className="dashboard-subtitle text-gray-500 mt-1">
       Surveillance des performances de la pompe solaire
      </p>
    </div>
    
    <div className={`connection-status flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connectionStatus === 'connected' 
        ? 'bg-green-50 text-green-700' 
        : 'bg-red-50 text-red-700'
    }`}>
      <span className={`inline-block w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
      }`}></span>
      {connectionStatus === 'connected' ? 'En ligne' : 'Hors ligne'}
    </div>
  </div>
</header>

    {/* Alertes système */}
    {systemData.alerts.length > 0 && (
      <div className="alerts-container">
        {systemData.alerts.map((alert, index) => (
          <div key={index} className="alert-item">
            <FiAlertTriangle className="alert-icon" />
            {alert}
          </div>
        ))}
      </div>
    )}

    {/* Jauges principales */}
    <div className="gauges-container">
      <DashboardGauge 
        title="Fréquence Référence"
        value={systemData.frequency_ref}
        unit="Hz"
        min={0}
        max={60}
        icon={<FiTrendingUp />}
        colors={['#4361ee', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Fréquence Sortie"
        value={systemData.output_freq}
        unit="Hz"
        min={0}
        max={60}
        icon={<FiCpu />}
        colors={['#3a86ff', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Puissance Sortie"
        value={systemData.output_power}
        unit="kW"
        min={0}
        max={150}
        icon={<FiZap />}
        colors={['#ffbe0b', '#e9ecef']}
      />
      
      <DashboardGauge 
        title="Débit Instantané"
        value={systemData.flow_speed}
        unit="m³/h"
        min={0}
        max={100}
        icon={<FiDroplet />}
        colors={['#00b4d8', '#e9ecef']}
      />
    </div>

    {/* Graphique historique */}
    <div className="chart-container">
      <div className="chart-header">
        <h2>
          <FiBarChart2 className="chart-icon" />
          Performance de la pompe
        </h2>
        <div className="time-selector">
          {['15m', '1h', '6h', '24h'].map(range => (
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
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getFilteredData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#6c757d' }}
              tickMargin={10}
            />
            <YAxis 
              domain={[0, 'dataMax + 10']}
              tick={{ fill: '#6c757d' }}
              label={{ 
                value: 'Débit (m³/h)', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#6c757d'
              }}
            />
            <Tooltip 
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.96)',
                borderRadius: '8px',
                boxShadow: '0 3px 14px rgba(0,0,0,0.1)',
                border: 'none'
              }}
              formatter={(value) => [`${value} m³/h`, 'Débit']}
              labelFormatter={(time) => `Heure: ${time}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="flow_speed" 
              stroke="#00b4d8" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, stroke: '#00b4d8', strokeWidth: 2 }}
              name="Débit"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Données brutes */}
    <div className="data-summary">
      <h3>Détails des mesures de la pompe</h3>
      <div className="data-grid">
        <DataCard 
          title="Température Module" 
          value={systemData.module_temp} 
          unit="°C" 
          trend={systemData.module_temp > 50 ? 'up' : 'down'}
        />
        <DataCard 
          title="Débit Journalier" 
          value={systemData.daily_flow} 
          unit="m³" 
        />
        <DataCard 
          title="Débit Cumulé" 
          value={systemData.cumulative_flow_low} 
          unit="m³" 
        />
        <DataCard 
          title="Efficacité" 
          value={systemData.efficiency} 
          unit="%" 
          color={getEfficiencyColor(systemData.efficiency)}
        />
      </div>
    </div>
  </div>
)}

{activeTab === 'dashboard' && (
  <div className="solar-dashboard">

<div className={`status-bar ${connectionStatus}`}>
      <div className="status-item">
        <FiZap className="status-icon" />
        <span className="status-label">Efficacité champs:</span>
        <span className="status-value">
          {systemData.dc_efficiency} %
        </span>
      </div>
      
      <div className="status-item">
        <FiSun className="status-icon" />
        <span className="status-label">Efficacité Cellule:</span>
        <span className="status-value">
          {systemData.panelRefEfficiency} %
        </span>
      </div>
      
      <div className="status-item">
        <FiSunrise className="status-icon" />
        <span className="status-label"> Irradiation :</span>
        <span className="status-value">
          {systemData.irradiation} W/m²
        </span>
      </div>
      
      <div className="status-item">
        <FiClock className="status-icon" />
        <span className="status-label">Mise à jour:</span>
        <span className="status-value">
          {systemData.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
    {/* ... (conservez votre barre de statut et en-tête existants) ... */}
  
    <header className="dashboard-header bg-white shadow-sm p-6 rounded-lg">
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-3">
        <FiSun className="text-yellow-500" />
        <span>Statistiques Solaire</span>
      </h1>
      <p className="dashboard-subtitle text-gray-500 mt-1">
       Efficacité du système photovoltaïque
      </p>
    </div>
    
    <div className={`connection-status flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connectionStatus === 'connected' 
        ? 'bg-green-50 text-green-700' 
        : 'bg-red-50 text-red-700'
    }`}>
      <span className={`inline-block w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
      }`}></span>
      {connectionStatus === 'connected' ? 'En ligne' : 'Hors ligne'}
    </div>
  </div>
</header>
    
    {/* Jauges principales (conservez vos jauges existantes) */}
    <div className="gauges-container">
      {/* ... vos jauges existantes ... */}
    </div>

    {/* Double graphique historique */}
    <div className="dual-chart-container">
      {/* Graphique 1 : Performance du champ solaire */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>
            <FiBarChart2 className="chart-icon" />
            Performance du champ solaire
          </h2>
          <div className="time-selector">
            {['15m', '1h', '6h', '24h'].map(range => (
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
        
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getFilteredData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#6c757d' }}
              />
              <YAxis 
                label={{ 
                  value: 'Puissance (KW)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#6c757d'
                }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="dc_power" 
                stroke="#4cc9f0" 
                strokeWidth={2}
                name="Puissance champ"
              />
              <Line 
                type="monotone" 
                dataKey="dc_efficiency" 
                stroke="#7209b7" 
                strokeWidth={2}
                name="Efficacité (%)"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique 2 : Cellule de référence */}
      <div className="chart-container">
        <div className="chart-header">
          <h2>
            <FiBarChart2 className="chart-icon" />
            Cellule de référence
          </h2>
          <div className="time-selector">
            {['15m', '1h', '6h', '24h'].map(range => (
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
        
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getFilteredData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#6c757d' }}
              />
              <YAxis 
                label={{ 
                  value: 'Puissance (W)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#6c757d'
                }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="panelRefPower" 
                stroke="#4361ee" 
                strokeWidth={2}
                name="Puissance cellule"
              />
              <Line 
                type="monotone" 
                dataKey="panelRefEfficiency" 
                stroke="#f72585" 
                strokeWidth={2}
                name="Efficacité (%)"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* ... (conservez vos données brutes existantes) ... */}
  </div>
)}


      </div>
    </div>
  );
};

// Composants supplémentaires
const DashboardGauge = ({ title, value, unit, min, max, icon, colors }) => (
  <div className="gauge-card">
    <div className="gauge-header">
      {icon}
      <h3>{title}</h3>
    </div>
    <div className="gauge-value">
      {value} <span>{unit}</span>
    </div>
    <Gauge 
      value={value} 
      min={min} 
      max={max} 
      unit={unit}
      colors={colors}
    />
  </div>
);

const DataCard = ({ title, value, unit, color, trend }) => (
  <div className="data-card">
    <h4>{title}</h4>
    <p style={{ color }} className="data-value">
      {value} <span>{unit}</span>
      {trend && (
        <span className={`trend-arrow ${trend}`}>
          {trend === 'up' ? '↑' : '↓'}
        </span>
      )}
    </p>
  </div>
);

export default MqttDashboard;