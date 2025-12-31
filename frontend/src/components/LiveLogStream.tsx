import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { AppService, type LogEntry, type LogSummary, API_BASE_URL } from '../services/api';
import LogDistributionChart from './charts/LogDistributionChart';
import Card from './common/Card';

interface LiveLogStreamProps {
  appId: string;
}

const LiveLogStream: React.FC<LiveLogStreamProps> = ({ appId }) => {
  const [logsBySource, setLogsBySource] = useState<Record<string, LogEntry[]>>({});
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sources, bySource, s] = await Promise.all([
        AppService.getLogSources(appId),
        AppService.getRecentLogsBySource(appId),
        AppService.getLogSummary(appId),
      ]);
      const merged: Record<string, LogEntry[]> = {};
      sources.forEach(src => { merged[src.path] = []; });
      Object.entries(bySource).forEach(([k, v]) => { merged[k] = v; });
      setLogsBySource(merged);
      setSummary(s);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  }, [appId]);

  useEffect(() => {
    fetchData();

    // WebSocket Connection
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `/ws/logs/${appId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        const log = data.log;
        setLogsBySource(prev => {
          const next = { ...prev };
          if (!next[log.source]) next[log.source] = [];
          // Prepend new log
          next[log.source] = [log, ...next[log.source]].slice(0, 50); // Keep last 50
          return next;
        });
        // Update summary count locally for immediate feedback
        setSummary(prev => {
           if (!prev) return null;
           const newCounts = { ...prev.counts };
           newCounts[log.source] = (newCounts[log.source] || 0) + 1;
           return { ...prev, counts: newCounts, last_seen: new Date().toISOString() };
        });
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setWsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [appId, fetchData]);

  const isLive = useMemo(() => {
     return wsConnected;
  }, [wsConnected]);

  const getLogColor = (content: string) => {
    const lower = content.toLowerCase();
    if (lower.includes('error') || lower.includes('fail') || lower.includes('exception')) return '#ef4444'; // Red
    if (lower.includes('warn')) return '#f59e0b'; // Amber
    if (lower.includes('info')) return '#3b82f6'; // Blue
    return 'var(--text-secondary)'; // Default
  };

  return (
    <div className="log-stream-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <Card title="Live Log Stream">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <span className="log-live-indicator" style={{ color: isLive ? '#22c55e' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLive ? '#22c55e' : '#ef4444' }}></span>
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>
            <button 
              className="log-refresh-btn" 
              onClick={fetchData}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>

          <div style={{ 
            backgroundColor: '#0f172a', 
            color: '#e2e8f0', 
            padding: '1rem', 
            borderRadius: 'var(--border-radius)', 
            height: '400px', 
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            border: '1px solid var(--border-color)'
          }}>
            {Object.keys(logsBySource).length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                  {isLive ? 'Agent Active. Waiting for new logs...' : 'Waiting for connection from agent...'}
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(logsBySource).map(([src, entries]) => (
                  <div key={src} style={{ marginBottom: 12 }}>
                    <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 4, borderBottom: '1px solid #1e293b', paddingBottom: '2px' }}>{src}</div>
                    {entries.slice(0, 10).map((log, index) => (
                      <div key={index} className="log-entry" style={{ display: 'flex', gap: '8px', padding: '2px 0' }}>
                        <span className="log-timestamp" style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="log-content" style={{ color: getLogColor(log.content) }}>
                          {log.content}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="Log Volume">
          <LogDistributionChart data={summary?.counts || {}} />
        </Card>
      </div>
    </div>
  );
};

export default LiveLogStream;
