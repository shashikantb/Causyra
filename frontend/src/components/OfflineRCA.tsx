import React, { useState } from 'react';
import { AppService, type RCAResult } from '../services/api';

const OfflineRCA: React.FC = () => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RCAResult | null>(null);

  const handleAnalyze = async () => {
    if (!logs) return;
    setLoading(true);
    try {
      const data = await AppService.analyzeLogs(logs);
      setResult(data);
    } catch (error) {
      console.error("Error analyzing logs", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="offline-rca">
      <h3>Offline Log Analysis</h3>
      <textarea 
        rows={10} 
        placeholder="Paste your logs here..."
        value={logs}
        onChange={(e) => setLogs(e.target.value)}
      />
      <br />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Logs'}
      </button>

      {result && (
        <div className="result">
          <h3>Analysis Result</h3>
          <p><strong>Root Cause:</strong> {result.root_cause}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</p>
          
          <h4>Evidence:</h4>
          <ul>
            {result.evidence.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <h4>Recommended Solutions:</h4>
          <ul className="solutions-list">
            {result.solutions.map((sol, i) => (
              <li key={i}>{sol}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OfflineRCA;
