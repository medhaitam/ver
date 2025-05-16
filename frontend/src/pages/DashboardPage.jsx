// DashboardPage.jsx
import React from 'react';
import LatestData from '../components/LatestData';
import EfficiencyGauge from '../components/EfficiencyGauge';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard - Vue d'ensemble</h1>
      <LatestData />
      <EfficiencyGauge />
    </div>
  );
}
