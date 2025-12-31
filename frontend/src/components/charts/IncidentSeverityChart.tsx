import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface IncidentSeverityChartProps {
  high: number;
  medium: number;
  low: number;
}

const COLORS = ['#dc2626', '#d97706', '#16a34a']; // High (Red), Medium (Amber), Low (Green)

const IncidentSeverityChart: React.FC<IncidentSeverityChartProps> = ({ high, medium, low }) => {
  const data: DataPoint[] = [
    { name: 'High', value: high },
    { name: 'Medium', value: medium },
    { name: 'Low', value: low },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No incidents detected</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncidentSeverityChart;
