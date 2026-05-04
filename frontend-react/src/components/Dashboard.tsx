import { Activity, BarChart2, CheckCircle, Info } from 'lucide-react';
import './Dashboard.css';

interface DashboardProps {
  dataStats: any;
  pipelineStatus: any;
  analyticsData: any;
}

export function Dashboard({ dataStats, pipelineStatus, analyticsData }: DashboardProps) {
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
              <span>Data Ingestion</span>
            </div>
            <div className={`step-item ${pipelineStatus.isProcessed ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>Data Cleaning</span>
            </div>
            <div className={`step-item ${pipelineStatus.isAnalyzed ? 'done' : ''}`}>
              <CheckCircle size={16} />
              <span>Statistical Analysis</span>
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
            </div>
          ) : (
            <p className="placeholder-text">No dataset loaded yet.</p>
          )}
        </div>

        {analyticsData && (
          <div className="card wide-card">
            <div className="card-header">
              <Info size={18} className="text-accent" />
              <h3>Analysis Highlights</h3>
            </div>
            <div className="highlights-content">
              <div className="highlight-item">
                <strong>Feature Density:</strong> {Object.keys(analyticsData.descriptive_statistics).length} numerical columns analyzed.
              </div>
              <div className="highlight-item">
                <strong>Unique Categories:</strong> Found across {Object.keys(analyticsData.categorical_summaries).length} categorical fields.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
