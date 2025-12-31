import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { Activity, Server, AlertTriangle } from 'lucide-react';
import { AppService, type Application } from '../services/api';
import { useNavigate } from 'react-router-dom';
import IncidentSeverityChart from '../components/charts/IncidentSeverityChart';
import LogDistributionChart from '../components/charts/LogDistributionChart';

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    projects: 0,
    incidents: 0,
    alerts: 0
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apps = await AppService.getApplications();
        setApplications(apps);
        setStats({
          projects: apps.length,
          incidents: 12, // Mock data for now
          alerts: 3     // Mock data for now
        });
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    };
    fetchData();
  }, []);

  // Mock data for charts
  const severityData = { high: 5, medium: 12, low: 8 };
  const logVolumeData = {
    'Service A': 120,
    'Service B': 85,
    'Service C': 45,
    'Service D': 150,
    'Database': 60
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              <Server size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Services Monitored</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.projects}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Issues Detected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.incidents}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Alerts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.alerts}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <Card title="Incident Severity Distribution">
          <IncidentSeverityChart {...severityData} />
        </Card>
        <Card title="Log Volume by Service (24h)">
          <LogDistributionChart data={logVolumeData} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card title="Recent RCA Logs">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Timestamp</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Service</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Event</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock Data */}
              {[1, 2, 3].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>2 mins ago</td>
                  <td style={{ padding: '12px 8px' }}>Payment Service</td>
                  <td style={{ padding: '12px 8px' }}>High Latency</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>Critical</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Your Projects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.length > 0 ? (
              applications.map(app => (
                <div 
                  key={app.id}
                  onClick={() => navigate(`/projects/${app.id}`)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ fontWeight: 500 }}>{app.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.type}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                No projects found.
              </div>
            )}
             <button 
                onClick={() => navigate('/projects/new')}
                style={{
                  marginTop: '0.5rem',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px dashed var(--border-color)',
                  background: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                + Add Project
              </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
