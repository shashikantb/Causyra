import React, { useEffect, useState } from 'react';
import { AppService, API_BASE_URL, type Application } from '../services/api';
import Card from './common/Card';
import { Copy, Plus, Trash2, Terminal, ArrowRight, CheckCircle, Server, FileText } from 'lucide-react';

interface AgentSetupProps {
  app: Application;
  onComplete: () => void;
  userRole: string;
}

const AgentSetup: React.FC<AgentSetupProps> = ({ app, onComplete, userRole }) => {
  const [newLogPath, setNewLogPath] = useState('');
  const [logSources, setLogSources] = useState(app.log_sources || []);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(agentCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Agent Configuration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Set up log collection for <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{app.name}</span>
        </p>
      </div>
      
      <Card title="Step 1: Install Agent">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--primary-light, rgba(59, 130, 246, 0.1))', 
              padding: '10px', 
              borderRadius: '8px',
              color: 'var(--primary)'
            }}>
              <Server size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Run this command on your server to install the log collector agent:
              </p>
              <div style={{ 
                position: 'relative',
                background: '#1e293b', 
                borderRadius: '8px', 
                padding: '1.5rem',
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '0.75rem', 
                  borderBottom: '1px solid #334155', 
                  paddingBottom: '0.5rem',
                  color: '#94a3b8',
                  fontSize: '0.8rem'
                }}>
                  <Terminal size={14} />
                  <span>Terminal</span>
                </div>
                <code style={{ 
                  fontFamily: 'monospace', 
                  color: '#e2e8f0', 
                  fontSize: '0.9rem', 
                  display: 'block',
                  wordBreak: 'break-all',
                  lineHeight: '1.5'
                }}>
                  {agentCommand}
                </code>
                <button 
                  onClick={handleCopy}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: copied ? '#22c55e' : 'rgba(255,255,255,0.1)',
                    color: copied ? '#fff' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Step 2: Configure Log Paths">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--primary-light, rgba(59, 130, 246, 0.1))', 
              padding: '10px', 
              borderRadius: '8px',
              color: 'var(--primary)'
            }}>
              <FileText size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 500 }}>
                Tell the agent which log files to monitor.
              </p>
              
              {userRole !== 'READ' && (
                <form onSubmit={handleAddSource} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="/var/log/app.log" 
                    value={newLogPath}
                    onChange={(e) => setNewLogPath(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit"
                    disabled={!newLogPath}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: !newLogPath ? 'var(--bg-muted)' : 'var(--primary)',
                      color: !newLogPath ? 'var(--text-secondary)' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: !newLogPath ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Plus size={18} /> Add Path
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logSources.length === 0 ? (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-color)'
                  }}>
                    No log paths configured yet.
                  </div>
                ) : (
                  logSources.map(source => (
                    <div key={source.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-muted)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem'
                        }}>
                          {source.path}
                        </span>
                        <span style={{ 
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: source.status === 'ACTIVE' ? '#dcfce7' : '#f3f4f6',
                          color: source.status === 'ACTIVE' ? '#166534' : '#4b5563',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {source.status}
                        </span>
                      </div>
                      
                      {userRole !== 'READ' && (
                        <button
                          onClick={async () => {
                            try {
                              await AppService.deleteLogSource(app.id, source.id);
                              setLogSources(logSources.filter(s => s.id !== source.id));
                            } catch (e) {
                              console.error('Failed to delete log source', e);
                            }
                          }}
                          title="Remove Path"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button 
          onClick={onComplete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Go to Dashboard <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default AgentSetup;
