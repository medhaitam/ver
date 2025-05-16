// MonitoringPage.jsx
import React from 'react';
import RealtimeCharts from '../components/RealtimeCharts';
import Gauges from '../components/Gauges';

export default function MonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Surveillance en temps réel</h1>
      <Gauges />
      <RealtimeCharts />
    </div>
  );
}
