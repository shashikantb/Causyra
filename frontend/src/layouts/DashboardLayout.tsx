import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { type User } from '../services/api';

interface DashboardLayoutProps {
  currentUser: User | null;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentUser, title }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <Sidebar userRole={currentUser?.role} />

      {/* Main Content Area */}
      <div style={{ 
        marginLeft: 'var(--sidebar-width)', 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0 // Prevents flex child from overflowing
      }}>
        <Header currentUser={currentUser} title={title} />
        
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
