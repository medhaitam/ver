import React from 'react';
import MqttDashboard from './components/MqttDashboard';

function App() {
  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Solar Monitoring App</h1>
      <MqttDashboard />
    </div>
  );
}

export default App;