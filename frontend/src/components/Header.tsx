import React from 'react';
import { User as UserIcon, Bell, Moon, Sun } from 'lucide-react';
import { type User } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentUser: User | null;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser, title }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 900
    }}>
      <div>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.25rem', 
          color: 'var(--text-primary)',
          fontWeight: 600
        }}>
          {title || 'Dashboard'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'var(--text-secondary)',
            padding: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: 'var(--text-secondary)',
          padding: '8px'
        }}>
          <Bell size={20} />
        </button>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          paddingLeft: '1.5rem',
          borderLeft: '1px solid var(--border-color)'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)' 
            }}>
              {currentUser?.username || 'Guest'}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-secondary)' 
            }}>
              {currentUser?.role || 'Viewer'}
            </div>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            border: '1px solid var(--border-color)'
          }}>
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
