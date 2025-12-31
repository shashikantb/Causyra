import React, { useState, useEffect } from 'react';
import LiveIncidentFeed from './LiveIncidentFeed';
import LiveLogStream from './LiveLogStream';
import OfflineRCA from './OfflineRCA';
import Onboarding from './Onboarding';
import AgentSetup from './AgentSetup';
import { AppService, type Application, type User } from '../services/api';

interface DashboardProps {
  selectedApp: Application | null;
  onAppSelect: (app: Application | null) => void;
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedApp, onAppSelect, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'offline' | 'setup'>('live');
  const userRole = currentUser.role;
  const [showAgentSetup, setShowAgentSetup] = useState(false);
  const [isAgentLive, setIsAgentLive] = useState(false);

  const handleAppSelect = (app: Application) => {
    onAppSelect(app);
    // If no log sources and user has write access, show setup
    if (app.log_sources.length === 0) {
      setShowAgentSetup(true);
    } else {
      setShowAgentSetup(false);
      setActiveTab('live');
    }
  };

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
    fetchSummary();
    timer = window.setInterval(fetchSummary, 3000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [selectedApp]);

  if (!selectedApp) {
    return (
      <div className="dashboard-container">
        <Onboarding onAppSelect={handleAppSelect} userRole={userRole} />
      </div>
    );
  }

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
      <div className="top-nav">
         {/* Role Switcher removed as we are logged in as Admin */}
      </div>

      <div className="header-bar">
        <h2>
          {selectedApp.name} <span className="badge">{selectedApp.type}</span>
        </h2>
        <div>
           <span className="agent-id-badge">
             Agent: {selectedApp.id.slice(0, 8)}
             <span className="agent-status-dot" style={{ background: isAgentLive ? '#28a745' : '#dc3545' }} />
           </span>
           <button className="setup-btn" onClick={() => setShowAgentSetup(true)}>Agent Config</button>
           {currentUser.role !== 'READ' && (
             <button 
               className="switch-app-btn" 
               onClick={async () => {
                 try {
                  await AppService.deleteApplication(selectedApp.id);
                  onAppSelect(null);
                } catch (e) {
                  // ignore
                }
              }}
            >
              Delete Project
            </button>
           )}
          <button className="switch-app-btn" onClick={() => onAppSelect(null)}>Switch App</button>
       </div>
      </div>

      <div className="tabs">
        <button 
          onClick={() => setActiveTab('live')}
          className={activeTab === 'live' ? 'active' : ''}
        >
          Live Incidents
        </button>
        <button 
          onClick={() => setActiveTab('offline')}
          className={activeTab === 'offline' ? 'active' : ''}
        >
          Offline RCA
        </button>
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

export default Dashboard;
