import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const GaugeChart = ({ value }) => {
  const angle = 180; // Demi-cercle
  const percent = Math.min(Math.max(value / 100, 0), 1); // 0 à 1
  const data = [
    { value: percent * 100 },
    { value: (1 - percent) * 100 }
  ];

  const COLORS = ['#00C49F', '#eee']; // Couleur de la jauge et fond

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>🔋 Voltage Gauge</h3>
      <PieChart width={300} height={150}>
        <Pie
          data={data}
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value} V</div>
    </div>
  );
};

export default GaugeChart;
