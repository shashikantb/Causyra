import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ConfidenceGaugeProps {
  score: number; // 0 to 1
}

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ score }) => {
  const percentage = Math.round(score * 100);
  
  // Color based on score
  let color = '#3b82f6'; // Blue (Low)
  if (score > 0.7) color = '#ef4444'; // Red (High)
  else if (score > 0.4) color = '#f59e0b'; // Amber (Medium)
  else if (score > 0.8) color = '#10b981'; // Green (High Confidence - wait, usually high confidence in RCA means high certainty of root cause)

  // Actually, for RCA confidence:
  // High confidence -> Green (We are sure)
  // Low confidence -> Yellow/Red (Unsure)
  if (score >= 0.8) color = '#10b981'; // Green
  else if (score >= 0.5) color = '#f59e0b'; // Amber
  else color = '#ef4444'; // Red

  const data = [
    { name: 'Score', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {percentage}%
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Confidence
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
