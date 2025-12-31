import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, Settings, LogOut, Briefcase } from 'lucide-react';
import { AuthService } from '../services/api';

interface SidebarProps {
  userRole?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login'; // Force refresh to clear state
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/logs', label: 'Global Logs', icon: FileText },
    { path: '/rca', label: 'Offline RCA', icon: Activity },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({ path: '/settings', label: 'User Management', icon: Settings });
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: 'var(--bg-sidebar)',
      color: 'var(--text-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      <div style={{ 
        height: 'var(--header-height)', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Briefcase style={{ color: 'var(--primary)', marginRight: '0.75rem' }} />
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          color: '#fff', 
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          Causyra
        </h1>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                <NavLink 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--border-radius)',
                    textDecoration: 'none',
                    color: isActive ? 'var(--text-sidebar-active)' : 'var(--text-sidebar)',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <item.icon size={20} style={{ marginRight: '0.75rem' }} />
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ 
        padding: '1.5rem', 
        borderTop: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            color: 'var(--text-sidebar)',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <LogOut size={20} style={{ marginRight: '0.75rem' }} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
