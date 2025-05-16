// src/components/EfficiencyBadge.jsx
import React from 'react';

const EfficiencyBadge = ({ efficiency }) => {
  const eff = parseFloat(efficiency) || 0;
  
  let color = '#dc3545'; // Rouge
  if (eff > 15) color = '#28a745'; // Vert
  else if (eff > 10) color = '#ffc107'; // Jaune

  return (
    <span style={{
      marginLeft: '8px',
      backgroundColor: color,
      color: 'white',
      padding: '2px 6px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 'bold'
    }}>
      {eff < 10 ? 'Faible' : eff < 15 ? 'Moyenne' : 'Haute'}
    </span>
  );
};

export default EfficiencyBadge;