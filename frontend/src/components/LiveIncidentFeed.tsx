import React, { useEffect, useState } from 'react';
import { AppService, type Incident } from '../services/api';

interface Props {
  appId: string;
}

const LiveIncidentFeed: React.FC<Props> = ({ appId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('ALL');

  useEffect(() => {
    fetchIncidents();
    // Poll every 5 seconds
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [appId]);

  const fetchIncidents = async () => {
    try {
      const data = await AppService.getIncidents(appId);
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents', error);
    }
  };

  const filtered = incidents.filter(i => {
    if (filterTag === 'ALL') return true;
    if (filterTag === 'UNTAGGED') return !i.tag;
    return i.tag === filterTag;
  });

  const counts: Record<string, number> = {
    ALL: incidents.length,
    UNTAGGED: incidents.filter(i => !i.tag).length,
    HighPriority: incidents.filter(i => i.tag === 'HighPriority').length,
    LowPriority: incidents.filter(i => i.tag === 'LowPriority').length,
    Ignore: incidents.filter(i => i.tag === 'Ignore').length,
    Problem: incidents.filter(i => i.tag === 'Problem').length,
  };

  return (
    <div className="live-feed">
      <h3>Live Incident Feed</h3>
      <div className="feed-layout">
        <div className="incident-list">
        {filtered.length === 0 ? (
          <p>No active incidents detected.</p>
        ) : (
          filtered.map(incident => {
            const oneLineSolution = incident.solutions && incident.solutions.length > 0 ? incident.solutions[0] : '';
            const occurrences = incident.occurrences ?? 1;
            const isExpanded = expandedId === incident.id;
            return (
              <div 
                key={incident.id} 
                className={`incident-card ${incident.severity.toLowerCase()}`} 
                onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span className={`severity-badge ${incident.severity.toLowerCase()}`} style={{ marginRight: 10 }}>{incident.severity}</span>
                  <span className="incident-time" style={{ marginRight: 10, minWidth: '70px' }}>{new Date(incident.timestamp).toLocaleTimeString()}</span>
                  <span className="rca-text" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(incident.root_cause || incident.title) + (oneLineSolution ? ` — ${oneLineSolution}` : '')}
                  </span>
                  <span style={{ marginLeft: 10, color: '#888', fontWeight: 'bold' }}>×{occurrences}</span>
                  <span className="tag-pill" style={{ marginLeft: 10 }}>{incident.tag || 'Untagged'}</span>
                </div>

                {isExpanded && (
                  <div className="incident-details" style={{ marginTop: 10, borderTop: '1px solid #444', paddingTop: 10 }}>
                    {incident.log_path && (
                      <div className="detail-row">
                        <strong>Log File:</strong> <span className="monospace">{incident.log_path}</span>
                      </div>
                    )}
                    {incident.log_line && (
                      <div className="detail-row">
                        <strong>Log Line:</strong>
                        <pre className="log-snippet">{incident.log_line}</pre>
                      </div>
                    )}
                    {incident.solutions && incident.solutions.length > 0 && (
                      <div className="detail-row">
                        <strong>Solutions:</strong>
                        <ul className="solution-list">
                          {incident.solutions.map((sol, idx) => (
                            <li key={idx}>{sol}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="detail-row" style={{ color: '#aaa' }}>
                      <span>First seen: {incident.first_seen ? new Date(incident.first_seen).toLocaleTimeString() : new Date(incident.timestamp).toLocaleTimeString()}</span>
                      {incident.last_seen && <span style={{ marginLeft: 12 }}>Last seen: {new Date(incident.last_seen).toLocaleTimeString()}</span>}
                    </div>
                    <div className="detail-row">
                      <strong>Tag:</strong>
                      <div className="tag-actions">
                        <button onClick={async (e) => { e.stopPropagation(); await AppService.setIncidentTag(appId, incident.id, 'HighPriority'); fetchIncidents(); }} className={incident.tag === 'HighPriority' ? 'tag-btn active' : 'tag-btn'}>High priority</button>
                        <button onClick={async (e) => { e.stopPropagation(); await AppService.setIncidentTag(appId, incident.id, 'LowPriority'); fetchIncidents(); }} className={incident.tag === 'LowPriority' ? 'tag-btn active' : 'tag-btn'}>Low priority</button>
                        <button onClick={async (e) => { e.stopPropagation(); await AppService.setIncidentTag(appId, incident.id, 'Ignore'); fetchIncidents(); }} className={incident.tag === 'Ignore' ? 'tag-btn active' : 'tag-btn'}>Ignore</button>
                        <button onClick={async (e) => { e.stopPropagation(); await AppService.setIncidentTag(appId, incident.id, 'Problem'); fetchIncidents(); }} className={incident.tag === 'Problem' ? 'tag-btn active' : 'tag-btn'}>Problem</button>
                        <button onClick={async (e) => { e.stopPropagation(); await AppService.setIncidentTag(appId, incident.id, null); fetchIncidents(); }} className="tag-btn">Clear</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        </div>
        <div className="tag-panel">
          <h4>Tags</h4>
          <ul>
            <li className={filterTag === 'ALL' ? 'active' : ''} onClick={() => setFilterTag('ALL')}>All <span className="count">{counts.ALL}</span></li>
            <li className={filterTag === 'UNTAGGED' ? 'active' : ''} onClick={() => setFilterTag('UNTAGGED')}>Untagged <span className="count">{counts.UNTAGGED}</span></li>
            <li className={filterTag === 'HighPriority' ? 'active' : ''} onClick={() => setFilterTag('HighPriority')}>High priority <span className="count">{counts.HighPriority}</span></li>
            <li className={filterTag === 'LowPriority' ? 'active' : ''} onClick={() => setFilterTag('LowPriority')}>Low priority <span className="count">{counts.LowPriority}</span></li>
            <li className={filterTag === 'Ignore' ? 'active' : ''} onClick={() => setFilterTag('Ignore')}>Ignore <span className="count">{counts.Ignore}</span></li>
            <li className={filterTag === 'Problem' ? 'active' : ''} onClick={() => setFilterTag('Problem')}>Problem <span className="count">{counts.Problem}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LiveIncidentFeed;
