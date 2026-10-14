import React from 'react';

const AdminChart = ({ data = [], height = 220, title = 'Revenue Trend' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4', textAlign: 'center', color: '#5c6e63', fontSize: '0.9rem' }}>
        No analytics data available for selected period.
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue || 0), 100);
  const chartWidth = 600;
  const padding = 30;
  const chartHeight = height - padding * 2;

  const points = data
    .map((d, idx) => {
      const x = padding + (idx / Math.max(1, data.length - 1)) * (chartWidth - padding * 2);
      const y = height - padding - ((d.revenue || 0) / maxRevenue) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8e4' }}>
      {title && <h4 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1rem' }}>{title}</h4>}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: height }}>
          <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#e2e8e4" strokeDasharray="4" />
          <line x1={padding} y1={height / 2} x2={chartWidth - padding} y2={height / 2} stroke="#e2e8e4" strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={chartWidth - padding} y2={height - padding} stroke="#e2e8e4" />
          <polygon points={`${padding},${height - padding} ${points} ${chartWidth - padding},${height - padding}`} fill="rgba(82, 183, 136, 0.15)" />
          <polyline fill="none" stroke="#1b4332" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, idx) => {
            const x = padding + (idx / Math.max(1, data.length - 1)) * (chartWidth - padding * 2);
            const y = height - padding - ((d.revenue || 0) / maxRevenue) * chartHeight;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="4" fill="#52b788" stroke="#1b4332" strokeWidth="2" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default AdminChart;
