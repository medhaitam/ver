// src/components/Gauge.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Gauge = ({ value, min, max, unit, colors = ['#4361ee', '#e9ecef'] }) => {
  const percent = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const data = [
    { name: 'filled', value: percent * 100 },
    { name: 'empty', value: (1 - percent) * 100 }
  ];
  
  return (
    <div>
      <div style={{ height: '150px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p style={{ 
        textAlign: 'center', 
        fontSize: '2rem',
        fontWeight: '700',
        margin: '0.5rem 0'
      }}>
        {value} <span style={{ fontSize: '1rem' }}>{unit}</span>
      </p>
    </div>
  );
};

export default Gauge;