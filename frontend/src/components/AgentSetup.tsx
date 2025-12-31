import React, { useEffect, useState } from 'react';
import { AppService, API_BASE_URL, type Application } from '../services/api';

interface AgentSetupProps {
  app: Application;
  onComplete: () => void;
  userRole: string;
}

const AgentSetup: React.FC<AgentSetupProps> = ({ app, onComplete, userRole }) => {
  const [newLogPath, setNewLogPath] = useState('');
  const [logSources, setLogSources] = useState(app.log_sources || []);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const sources = await AppService.getLogSources(app.id);
        setLogSources(sources);
      } catch (e) {
        console.error('Failed to fetch log sources', e);
      }
    };
    fetchSources();
  }, [app.id]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogPath) return;

    try {
      const newSource = await AppService.addLogSource(app.id, newLogPath);
      const exists = logSources.some(s => s.path === newSource.path);
      setLogSources(exists ? logSources : [...logSources, newSource]);
      setNewLogPath('');
    } catch (error) {
      console.error('Failed to add log source', error);
    }
  };

  const agentCommand = `curl -sL ${API_BASE_URL}/static/install.sh | bash -s -- --app-id="${app.id}" --backend-url="${API_BASE_URL}"`;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(agentCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="agent-setup-container">
      <div className="setup-header">
        <h2>Agent Configuration</h2>
        <p className="subtitle">Set up log collection for <span className="highlight">{app.name}</span></p>
      </div>
      
      <div className="setup-card">
        <div className="step-header">
          <span className="step-number">1</span>
          <h4>Install Agent</h4>
        </div>
        <p className="step-desc">Run this command on your server to install the log collector agent:</p>
        <div className="terminal-block">
          <div className="terminal-content">
            <code>{agentCommand}</code>
          </div>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="setup-card">
        <div className="step-header">
          <span className="step-number">2</span>
          <h4>Configure Log Paths</h4>
        </div>
        <p className="step-desc">Tell the agent which log files to monitor.</p>
        
        {userRole !== 'READ' && (
          <form onSubmit={handleAddSource} className="input-group">
            <input 
              type="text" 
              placeholder="/var/log/app.log" 
              value={newLogPath}
              onChange={(e) => setNewLogPath(e.target.value)}
            />
            <button type="submit">Add Path</button>
          </form>
        )}

        <div className="paths-list-container">
          <ul className="log-sources-list">
            {logSources.length === 0 && <li className="empty">No log paths configured yet.</li>}
            {logSources.map(source => (
              <li key={source.id}>
                <span className="path-text">{source.path}</span>
                <div className="path-actions">
                  <span className={`status-badge ${source.status.toLowerCase()}`}>{source.status}</span>
                  {userRole !== 'READ' && (
                    <button
                      className="delete-icon-btn"
                      onClick={async () => {
                        try {
                          await AppService.deleteLogSource(app.id, source.id);
                          setLogSources(logSources.filter(s => s.id !== source.id));
                        } catch (e) {
                          console.error('Failed to delete log source', e);
                        }
                      }}
                      title="Remove Path"
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="setup-actions">
        <button className="primary-btn large" onClick={onComplete}>Go to Dashboard &rarr;</button>
      </div>
    </div>
  );
};

export default AgentSetup;
