import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Gauge = ({ value, min, max, unit, colors = ['#0088FE', '#eee'] }) => {
  const percent = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const data = [
    { name: 'filled', value: percent * 100 },
    { name: 'empty', value: (1 - percent) * 100 }
  ];
  
  return (
    <div className="gauge-container">
      <div style={{ width: '100%', height: 100 }}>
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
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="gauge-value">
        {value} {unit}
      </div>
    </div>
  );
};

export default Gauge;