import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LogDistributionChartProps {
  data: Record<string, number>;
}

const LogDistributionChart: React.FC<LogDistributionChartProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No log data available</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text-secondary)" />
          <YAxis stroke="var(--text-secondary)" />
          <Tooltip 
            cursor={{ fill: 'var(--bg-app)' }}
            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
          <Legend />
          <Bar dataKey="value" fill="var(--primary)" name="Log Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LogDistributionChart;
