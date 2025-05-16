// HistoriquePage.jsx
import React from 'react';
import HistoricalChart from '../components/HistoricalChart';

export default function HistoriquePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Historique de Production</h1>
      <HistoricalChart />
    </div>
  );
}
