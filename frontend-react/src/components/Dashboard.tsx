import { Activity, BarChart2, CheckCircle, Info } from 'lucide-react';
import './Dashboard.css';

interface DashboardProps {
  dataStats: any;
  pipelineStatus: any;
  analyticsData: any;
  logs: { timestamp: string; message: string }[];
}

export function Dashboard({ dataStats, pipelineStatus, analyticsData, logs }: DashboardProps) {
  return (
    <div className="dashboard-container">
      <div className="pane-header">
        <h2>System Dashboard</h2>
        <p>A compilation of recent data analysis and system status.</p>
      </div>

      <div className="dashboard-grid">
        <div className="card summary-card">
          <div className="card-header">
            <Activity size={18} className="text-accent" />
            <h3>Pipeline Health</h3>
          </div>
          <div className="pipeline-steps-status">
            <div className={`step-item ${pipelineStatus.isLoaded ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>CSV/Excel Parsed</span>
            </div>
            <div className={`step-item ${pipelineStatus.isProcessed ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>Null Handling & Encoding</span>
            </div>
            <div className={`step-item ${pipelineStatus.isAnalyzed ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>Analytics Generated</span>
            </div>
            <div className={`step-item ${pipelineStatus.isModelTrained ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>Model Trained</span>
            </div>
            <div className={`step-item ${pipelineStatus.isInsightsGenerated ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>AI Insights Generated</span>
            </div>
          </div>
        </div>

        <div className="card summary-card">
          <div className="card-header">
            <BarChart2 size={18} className="text-accent" />
            <h3>Dataset Overview</h3>
          </div>
          {dataStats ? (
            <div className="mini-stats">
              <div className="mini-stat">
                <span className="label">Total Records</span>
                <span className="value">{dataStats.rows}</span>
              </div>
              <div className="mini-stat">
                <span className="label">Features</span>
                <span className="value">{dataStats.columns}</span>
              </div>
              <div className="mini-stat">
                <span className="label">Analyzed Fields</span>
                <span className="value">{analyticsData?.descriptive_statistics ? Object.keys(analyticsData.descriptive_statistics).length : 0}</span>
              </div>
            </div>
          ) : (
            <p className="placeholder-text">No dataset loaded yet.</p>
          )}
        </div>

        <div className="card summary-card">
          <div className="card-header">
            <Activity size={18} className="text-accent" />
            <h3>Processing Timeline</h3>
          </div>
          <div className="timeline-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {logs && logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="timeline-entry" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginRight: '0.5rem' }}>{log.timestamp}</span>
                <span>{log.message}</span>
              </div>
            )) : (
               <p className="placeholder-text">Waiting for processing...</p>
            )}
          </div>
        </div>

          <div className="card wide-card">
            <div className="card-header">
              <Info size={18} className="text-accent" />
              <h3>Pipeline Execution Summary</h3>
            </div>
            <div className="highlights-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="highlight-item" style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.05)', borderLeft: '3px solid var(--accent-color)' }}>
                • Missing values handled using mean imputation strategy
              </div>
              <div className="highlight-item" style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.05)', borderLeft: '3px solid var(--accent-color)' }}>
                • {dataStats?.cat_cols || 0} categorical columns successfully encoded
              </div>
              <div className="highlight-item" style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.05)', borderLeft: '3px solid var(--accent-color)' }}>
                • {dataStats?.num_cols || 0} numerical columns scaled and normalized
              </div>
              {pipelineStatus.isModelTrained && (
                <div className="highlight-item" style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success)' }}>
                  • Baseline Machine Learning model trained and evaluated
                </div>
              )}
              {pipelineStatus.isInsightsGenerated && (
                <div className="highlight-item" style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.05)', borderLeft: '3px solid #8b5cf6' }}>
                  • AI insights generated successfully via LLM
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
