import React from 'react';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp?: string;
  status?: 'info' | 'warning' | 'error' | 'success';
}

interface TimelineProps {
  items: TimelineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <div className="timeline" style={{ padding: '1rem 0' }}>
      {items.map((item, index) => (
        <div key={item.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
          {/* Line connector */}
          {index !== items.length - 1 && (
            <div style={{
              position: 'absolute',
              left: '15px',
              top: '30px',
              bottom: '-30px',
              width: '2px',
              backgroundColor: 'var(--border-color)',
              zIndex: 0
            }} />
          )}

          {/* Dot */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(item.status),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            zIndex: 1,
            flexShrink: 0
          }}>
            {index + 1}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.title}</h4>
              {item.timestamp && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.timestamp}</span>
              )}
            </div>
            {item.description && (
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'success': return '#10b981';
    default: return '#3b82f6'; // info/default
  }
};

export default Timeline;
