import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { AppService, type LogEntry, type LogSummary } from '../services/api';

interface LiveLogStreamProps {
  appId: string;
}

const LiveLogStream: React.FC<LiveLogStreamProps> = ({ appId }) => {
  const [logsBySource, setLogsBySource] = useState<Record<string, LogEntry[]>>({});
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const intervalRef = useRef<number | null>(null);

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
    intervalRef.current = window.setInterval(fetchData, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [appId, fetchData]);

  const isLive = useMemo(() => {
    if (!summary?.last_seen) return false;
    const last = new Date(summary.last_seen).getTime();
    return Date.now() - last < 12000;
  }, [summary]);

  const totalCount = useMemo(() => {
    if (!summary?.counts) return 0;
    return Object.values(summary.counts).reduce((a, b) => a + b, 0);
  }, [summary]);

  const pieSlices = useMemo(() => {
    if (!summary?.counts || totalCount === 0) return [];
    const entries = Object.entries(summary.counts);
    let acc = 0;
    return entries.map(([src, count], idx) => {
      const start = acc / totalCount * 2 * Math.PI;
      const end = (acc + count) / totalCount * 2 * Math.PI;
      acc += count;
      const r = 40;
      const cx = 50, cy = 50;
      const x1 = cx + r * Math.sin(start);
      const y1 = cy - r * Math.cos(start);
      const x2 = cx + r * Math.sin(end);
      const y2 = cy - r * Math.cos(end);
      const largeArc = end - start > Math.PI ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const colors = ["#4caf50","#007bff","#ff9800","#9c27b0","#e91e63","#00bcd4","#8bc34a","#795548"];
      return { d, color: colors[idx % colors.length], label: src, value: count };
    });
  }, [summary, totalCount]);

  return (
    <div className="log-stream-container">
      <div className="log-stream-header">
        <h3>Live Log Stream</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="log-refresh-btn" onClick={fetchData}>Refresh</button>
          <span className="log-live-indicator" style={{ color: isLive ? '#4caf50' : '#ff5252' }}>
            ● {isLive ? 'Live' : 'Idle'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          {pieSlices.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} />
          ))}
        </svg>
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Log Volume by Source (last 50/each)</div>
          {pieSlices.length === 0 ? (
            <div style={{ color: '#888' }}>No log data</div>
          ) : (
            pieSlices.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: s.color, display: 'inline-block' }} />
                <span style={{ color: '#fff' }}>{s.label}</span>
                <span style={{ color: '#888' }}>({s.value})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {Object.keys(logsBySource).length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <p style={{ color: isLive ? '#4caf50' : '#888', fontStyle: 'italic' }}>
            {isLive ? 'Agent Active. Waiting for new logs...' : 'Waiting for connection from agent...'}
          </p>
        </div>
      ) : (
        <div>
          {Object.entries(logsBySource).map(([src, entries]) => (
            <div key={src} style={{ marginBottom: 12 }}>
              <div style={{ color: '#569cd6', fontWeight: 700, marginBottom: 4 }}>{src}</div>
              {entries.slice(0, 10).map((log, index) => (
                <div key={index} className="log-entry">
                  <span className="log-timestamp">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="log-content">{log.content}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveLogStream;
