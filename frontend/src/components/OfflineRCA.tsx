import React, { useState, useRef } from 'react';
import { AppService, type RCAResult } from '../services/api';
import Timeline, { type TimelineItem } from './common/Timeline';
import Card from './common/Card';
import ConfidenceGauge from './charts/ConfidenceGauge';
import { Download, CheckCircle, Copy } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const OfflineRCA: React.FC = () => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RCAResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0f172a' : '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('rca-report.pdf');
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getEvidenceTimeline = (evidence: string[]): TimelineItem[] => {
    return evidence.map((line, index) => {
      // Simple heuristic to extract timestamp if present at start
      // e.g. "2023-10-27 10:00:00 - Error..."
      const match = line.match(/^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})?(.*)/);
      const timestamp = match ? match[1] : undefined;
      const content = match ? match[2] : line;

      let status: 'info' | 'warning' | 'error' = 'info';
      if (content.toLowerCase().includes('error') || content.toLowerCase().includes('fail') || content.toLowerCase().includes('exception')) {
        status = 'error';
      } else if (content.toLowerCase().includes('warn')) {
        status = 'warning';
      }

      return {
        id: index,
        title: `Event ${index + 1}`,
        description: content.trim(),
        timestamp: timestamp,
        status: status
      };
    });
  };

  return (
    <div className="offline-rca" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Card title="Offline Log Analysis">
        <textarea 
          rows={10} 
          placeholder="Paste your logs here..."
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-app)',
            color: 'var(--text-primary)',
            fontFamily: 'monospace',
            marginBottom: '1rem',
            resize: 'vertical'
          }}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontWeight: 600
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Logs'}
        </button>
      </Card>

      {result && (
        <div ref={resultRef} className="result-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button 
                onClick={handleExportPDF}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
             >
               <Download size={16} /> Export to PDF
             </button>
           </div>

          <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <Card title="Analysis Result">
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Root Cause</div>
                     <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{result.root_cause}</div>
                  </div>
                  <div style={{ width: '120px' }}>
                    <ConfidenceGauge score={result.confidence} />
                  </div>
                </div>
              </Card>

              <Card title="Recommended Solutions">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.solutions.map((sol, i) => (
                    <div key={i} className="solution-card" style={{ 
                       padding: '1rem', 
                       borderRadius: '8px', 
                       backgroundColor: 'var(--bg-muted)', 
                       borderLeft: '4px solid var(--primary)',
                       display: 'flex',
                       gap: '12px'
                    }}>
                      <CheckCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{sol}</div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(sol)}
                        title="Copy solution"
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          color: 'var(--text-secondary)',
                          padding: '4px'
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card title="Incident Timeline">
              <Timeline items={getEvidenceTimeline(result.evidence)} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineRCA;
