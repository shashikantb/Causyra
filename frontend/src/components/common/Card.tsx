import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  padding?: string;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title,
  padding = '1.5rem' 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        padding: padding,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {title && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.1rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)' 
          }}>
            {title}
          </h3>
        </div>
      )}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default Card;
