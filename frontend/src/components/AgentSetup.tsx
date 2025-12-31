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

  return (
    <div className="agent-setup">
      <h3>Agent Configuration for {app.name}</h3>
      
      <div className="setup-step">
        <h4>Step 1: Install Agent</h4>
        <p>Run this command on your server to install the log collector agent:</p>
        <div className="code-block">
          <code>{agentCommand}</code>
          <button className="copy-btn" onClick={() => navigator.clipboard.writeText(agentCommand)}>Copy</button>
        </div>
      </div>

      <div className="setup-step">
        <h4>Step 2: Configure Log Paths</h4>
        <p>Tell the agent which log files to monitor.</p>
        
        {userRole !== 'READ' && (
          <form onSubmit={handleAddSource} className="log-path-form">
            <input 
              type="text" 
              placeholder="/var/log/app.log" 
              value={newLogPath}
              onChange={(e) => setNewLogPath(e.target.value)}
            />
            <button type="submit">Add Path</button>
          </form>
        )}

        <ul className="log-sources-list">
          {logSources.length === 0 && <li className="empty">No log paths configured yet.</li>}
          {logSources.map(source => (
            <li key={source.id}>
              <span className="path">{source.path}</span>
              <span className={`status ${source.status}`}>{source.status}</span>
              {userRole !== 'READ' && (
                <button
                  className="delete-app-btn"
                  onClick={async () => {
                    try {
                      await AppService.deleteLogSource(app.id, source.id);
                      setLogSources(logSources.filter(s => s.id !== source.id));
                    } catch (e) {
                      console.error('Failed to delete log source', e);
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="setup-actions">
        <button className="primary-btn" onClick={onComplete}>Go to Dashboard</button>
      </div>
    </div>
  );
};

export default AgentSetup;
