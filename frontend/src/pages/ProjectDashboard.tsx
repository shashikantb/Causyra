import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LiveIncidentFeed from '../components/LiveIncidentFeed';
import LiveLogStream from '../components/LiveLogStream';
import OfflineRCA from '../components/OfflineRCA';
import AgentSetup from '../components/AgentSetup';
import { AppService, type Application, type User } from '../services/api';

interface ProjectDashboardProps {
  currentUser: User | null;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ currentUser }) => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'offline' | 'setup'>('live');
  const [showAgentSetup, setShowAgentSetup] = useState(false);
  const [isAgentLive, setIsAgentLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const userRole = currentUser?.role || 'READ';

  useEffect(() => {
    const fetchApp = async () => {
      if (!appId) return;
      try {
        setLoading(true);
        // We need an endpoint to get single app or find it from list
        // Assuming we fetch list and find it for now as there isn't getAppById exposed in AppService based on my reads
        // Ideally backend should support GET /applications/{id}
        const apps = await AppService.getApplications();
        const app = apps.find(a => a.id === appId);
        if (app) {
          setSelectedApp(app);
          if (app.log_sources.length === 0) {
            // Check if we should show setup - usually we do if no sources
             // But let's default to live view and let user click config
          }
        } else {
          // Handle 404
          navigate('/dashboard');
        }
      } catch (e) {
        console.error("Failed to fetch app", e);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId, navigate]);

  useEffect(() => {
    let timer: number | undefined;
    const fetchSummary = async () => {
      if (!selectedApp) return;
      try {
        const s = await AppService.getLogSummary(selectedApp.id);
        const live = s.last_seen ? (Date.now() - new Date(s.last_seen).getTime() < 12000) : false;
        setIsAgentLive(live);
      } catch (e) {
        // ignore
      }
    };
    if (selectedApp) {
      fetchSummary();
      timer = window.setInterval(fetchSummary, 3000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [selectedApp]);

  if (loading) return <div>Loading Project...</div>;
  if (!selectedApp) return <div>Project not found</div>;

  if (showAgentSetup) {
    return (
      <div className="dashboard-container">
         <AgentSetup 
           app={selectedApp} 
           onComplete={() => setShowAgentSetup(false)} 
           userRole={userRole}
         />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>
          {selectedApp.name} <span className="badge" style={{ fontSize: '0.8rem', verticalAlign: 'middle' }}>{selectedApp.type}</span>
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <span className="agent-id-badge" style={{ fontSize: '0.9rem' }}>
             Agent: {selectedApp.id.slice(0, 8)}
             <span className="agent-status-dot" style={{ 
               display: 'inline-block', 
               width: '8px', 
               height: '8px', 
               borderRadius: '50%', 
               background: isAgentLive ? '#28a745' : '#dc3545',
               marginLeft: '6px'
             }} />
           </span>
           <button className="setup-btn" onClick={() => setShowAgentSetup(true)}>Agent Config</button>
           {userRole !== 'READ' && (
             <button 
               className="switch-app-btn" 
               style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
               onClick={async () => {
                 if (window.confirm('Are you sure you want to delete this project?')) {
                   try {
                    await AppService.deleteApplication(selectedApp.id);
                    navigate('/dashboard');
                  } catch (e) {
                    // ignore
                  }
                 }
              }}
            >
              Delete Project
            </button>
           )}
       </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <div className="segmented-control" style={{ display: 'inline-flex', background: 'var(--bg-muted)', padding: '4px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('live')}
            className={activeTab === 'live' ? 'active' : ''}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              background: activeTab === 'live' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'live' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'live' ? 'var(--shadow-sm)' : 'none',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Live Incidents
          </button>
          <button 
            onClick={() => setActiveTab('offline')}
            className={activeTab === 'offline' ? 'active' : ''}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              background: activeTab === 'offline' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'offline' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'offline' ? 'var(--shadow-sm)' : 'none',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Offline RCA
          </button>
        </div>
      </div>

      <div className="content">
        {activeTab === 'live' ? (
          <>
            <LiveLogStream appId={selectedApp.id} />
            <LiveIncidentFeed appId={selectedApp.id} />
          </>
        ) : (
          <OfflineRCA />
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
