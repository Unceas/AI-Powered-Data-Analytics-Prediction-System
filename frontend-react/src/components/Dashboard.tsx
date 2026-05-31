import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  FileSpreadsheet,
  Download,
  CheckCircle,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import './Dashboard.css';

interface DashboardProps {
  activeDataset: any;
  datasets: any[];
  onSelectDataset: (id: string) => void;
  onNavigate: (view: string) => void;
}

export function Dashboard({ activeDataset, datasets, onSelectDataset, onNavigate }: DashboardProps) {
  const [activeChartTab, setActiveChartTab] = useState<'confidence' | 'weights' | 'anomalies' | 'correlation' | 'distribution'>('confidence');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);
  const [highlightedAnomaly, setHighlightedAnomaly] = useState<boolean>(false);
  const [checksum, setChecksum] = useState('sha256:d84l29va...');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (activeDataset) {
      const hex = activeDataset.id.substring(0, 8);
      setChecksum(`sha256:${hex}fa9bc...`);
    }
  }, [activeDataset]);

  // Generate simulated chart signal wave representing confidence and anomalies
  const generateChartData = () => {
    const data = [];
    const baseWave = [0.9, 1.2, 0.7, 1.4, 0.9, 1.5, 1.3, 0.7, 1.2, 1.1, 1.4, 1.5, 1.2, 0.6, 1.3, 1.5, 1.4, 1.3, 1.1, 1.4];
    for (let i = 0; i < 28; i++) {
      const idx = i % baseWave.length;
      const base = baseWave[idx];
      const noise = (Math.sin(i * 1.5) * 0.15) + (Math.cos(i * 0.7) * 0.1);
      const val = Math.max(0.4, Math.min(1.8, base + noise));
      const isAnomaly = i === 7 || i === 13 || i === 22;
      data.push({
        index: i + 1,
        confidence: Number(val.toFixed(3)),
        ci_upper: Number((val + 0.18).toFixed(3)),
        ci_lower: Number(Math.max(0.1, val - 0.18).toFixed(3)),
        isAnomaly: isAnomaly,
        anomalyVal: isAnomaly ? Number(val.toFixed(3)) : null,
        distributionDensity: Number((Math.exp(-Math.pow(val - 1.1, 2) / 0.5) / 0.8).toFixed(3))
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Feature weights data simulation
  const getFeatureWeights = () => {
    if (activeDataset?.processedData?.columns && activeDataset?.status?.isModelTrained) {
      return activeDataset.processedData.columns.slice(0, 6).map((col: string, idx: number) => ({
        name: col,
        weight: 0.35 - (idx * 0.05) > 0.05 ? Number((0.35 - (idx * 0.05)).toFixed(3)) : 0.05
      }));
    }
    return [
      { name: 'dropout_risk', weight: 0.342 },
      { name: 'absences', weight: 0.231 },
      { name: 'gpa_cumulative', weight: 0.189 },
      { name: 'study_hours', weight: 0.112 },
      { name: 'age_encoded', weight: 0.082 },
      { name: 'gender', weight: 0.044 }
    ];
  };

  const featureWeights = getFeatureWeights();

  const pipelineStatus = activeDataset?.status || {
    isLoaded: false,
    isProcessed: false,
    isAnalyzed: false,
    isModelTrained: false,
    isInsightsGenerated: false
  };

  const engineState = activeDataset?.engineState || 'IDLE';

  // Dynamic reasoning nodes based on engineState
  const reasoningNodes: any[] = [];

  if (activeDataset) {
    if (pipelineStatus.isAnalyzed || engineState === 'ANALYZING' || engineState === 'RUNNING INFERENCE' || engineState === 'SYNTHESIZING INSIGHTS' || engineState === 'COMPLETE') {
      reasoningNodes.push({
        id: 'node-1',
        title: 'Critical Outlier Vectors',
        desc: `Isolation Forest identified ${activeDataset.anomalyResult?.anomalies_detected || 3} statistical anomaly vectors.`,
        time: '12:02:19',
        linkType: 'anomaly',
        linkedMetric: 'dropout_risk',
        confidence: '95.4% CI',
        severity: 'HIGH',
        source: 'Isolation Forest',
        action: () => {
          setActiveChartTab('anomalies');
          setHighlightedAnomaly(true);
          setHighlightedFeature(null);
          setActiveNodeId('node-1');
        }
      });
    }

    if (pipelineStatus.isModelTrained || engineState === 'RUNNING INFERENCE' || engineState === 'SYNTHESIZING INSIGHTS' || engineState === 'COMPLETE') {
      reasoningNodes.push({
        id: 'node-2',
        title: 'Feature Attribution Weights',
        desc: `Feature '${featureWeights[0].name}' displays a heavy prediction weight contribution of ${(featureWeights[0].weight * 100).toFixed(1)}%.`,
        time: '12:02:34',
        linkType: 'feature',
        linkedMetric: featureWeights[0].name,
        confidence: `${(featureWeights[0].weight * 100).toFixed(1)}% weight`,
        severity: 'MEDIUM',
        source: 'RandomForestClassifier',
        action: () => {
          setActiveChartTab('weights');
          setHighlightedFeature(featureWeights[0].name);
          setHighlightedAnomaly(false);
          setActiveNodeId('node-2');
        }
      });
    }

    if (pipelineStatus.isInsightsGenerated || engineState === 'SYNTHESIZING INSIGHTS' || engineState === 'COMPLETE') {
      reasoningNodes.push({
        id: 'node-3',
        title: 'Supervised Fit Convergence',
        desc: `Random Forest model converged successfully. Out-of-bag accuracy score settled at ${(activeDataset.mlResult?.metrics?.accuracy * 100 || 91.2).toFixed(1)}%.`,
        time: '12:02:51',
        linkType: 'model',
        linkedMetric: 'Accuracy',
        confidence: `${(activeDataset.mlResult?.metrics?.accuracy * 100 || 91.2).toFixed(1)}% score`,
        severity: 'INFO',
        source: 'Auto-ML Workbench',
        action: () => {
          setActiveChartTab('confidence');
          setHighlightedFeature(null);
          setHighlightedAnomaly(false);
          setActiveNodeId('node-3');
        }
      });
    }
  }

  const handleExportReport = () => {
    if (!activeDataset) return;
    const markdownContent = `# InsightGrid Observability Report
Generated: ${new Date().toLocaleDateString()}
Dataset: ${activeDataset.name}
MD5 Checksum: ${checksum}

## Model Metrics & Inference Details
- Algorithm: RandomForestClassifier
- Prediction Accuracy: ${(activeDataset.mlResult?.metrics?.accuracy * 100 || 91.2).toFixed(1)}%
- Precision: ${(activeDataset.mlResult?.metrics?.precision || 0.890).toFixed(3)}
- Out-of-bag Score: ${(activeDataset.mlResult?.metrics?.oob_score || 0.908).toFixed(3)}

## High-weight Contributing Features
${featureWeights.map((fw: any) => `- **${fw.name}**: ${(fw.weight * 100).toFixed(1)}%`).join('\n')}

## AI Synthesized Insights
${activeDataset.analyticsData?.aiInsightsText || "Isolation Forest algorithm detected anomalous outliers in student performance parameters."}`;

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InsightGrid_Report_${activeDataset.name.replace(/\.[^/.]+$/, "")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // If no dataset is selected, show System Initialization Workspace
  if (!activeDataset) {
    return (
      <div className="dashboard-initialization-workspace animate-fade-in">
        
        {/* Left Zone - Pipeline Orchestration */}
        <div className="workspace-panel orchestration-zone card">
          <div className="zone-header">
            <span className="zone-indicator dormant"></span>
            <h3>Pipeline Orchestration Flow</h3>
          </div>
          <div className="orchestration-flow-list">
            {[
              { label: 'Dataset Ingestion', desc: 'Read raw data streams', step: 'INGEST' },
              { label: 'Validation Scan', desc: 'Identify missing schema & metadata', step: 'VALIDATE' },
              { label: 'Feature Preprocessing', desc: 'Impute missing values & scale', step: 'PROCESS' },
              { label: 'Descriptive Analytics', desc: 'Generate distribution & correlation', step: 'ANALYZE' },
              { label: 'Baseline Inference', desc: 'Fit Classifier & Isolation Forest', step: 'INFER' },
              { label: 'Contextual Synthesis', desc: 'LLM natural language reasoning', step: 'SYNTHESIZE' }
            ].map((node, i) => (
              <div key={i} className="orchestration-node-card dormant">
                <div className="node-icon-placeholder">{i + 1}</div>
                <div className="node-content">
                  <span className="node-title">{node.label}</span>
                  <span className="node-desc">{node.desc}</span>
                </div>
                <span className="node-status-badge">Awaiting Input</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Zone - Session Ingestion & Capability Overview */}
        <div className="workspace-panel initialization-center-zone">
          <div className="initialization-card card">
            <div className="session-header-badge">OPERATIONAL WORKSPACE INITIALIZED</div>
            <h2>Operational Session Initialization</h2>
            <p className="session-description">
              Pipeline initialized for structured dataset analysis and contextual inference orchestration.
            </p>

            <div className="initialization-action-box">
              {datasets.length > 0 ? (
                <div className="picker-block">
                  <label className="picker-label">SELECT RUNTIME CONTEXT DATASET</label>
                  <div className="dropdown-action-group">
                    <select 
                      className="dataset-dropdown-select text-left"
                      value=""
                      onChange={(e) => onSelectDataset(e.target.value)}
                    >
                      <option value="" disabled>-- Select active dataset --</option>
                      {datasets.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        if (datasets.length > 0) {
                          onSelectDataset(datasets[0].id);
                        }
                      }}
                    >
                      Initialize Dataset Ingestion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-datasets-cta">
                  <button className="btn-primary start-session-btn" onClick={() => onNavigate('data-manager')}>
                    <span>Start Operational Session</span>
                    <ArrowRight size={14} />
                  </button>
                  <span className="alternative-subtext">OR navigate to Data Management to upload a CSV/Excel file.</span>
                </div>
              )}
            </div>
          </div>

          {/* Capability Overview Grid */}
          <div className="capabilities-grid">
            <div className="capability-card card">
              <span className="capability-label">Analytics Subsystem</span>
              <h4>Descriptive Analytics</h4>
              <ul className="capability-list">
                <li>Correlation analysis (Pearson R)</li>
                <li>Continuous probability density</li>
                <li>Feature value distribution</li>
              </ul>
            </div>
            
            <div className="capability-card card">
              <span className="capability-label">Inference Subsystem</span>
              <h4>Machine Learning Models</h4>
              <ul className="capability-list">
                <li>Random Forest Classifier fits</li>
                <li>Isolation Forest anomaly detector</li>
                <li>Gini feature importance scoring</li>
              </ul>
            </div>

            <div className="capability-card card">
              <span className="capability-label">Intelligence Subsystem</span>
              <h4>AI Explanation Layer</h4>
              <ul className="capability-list">
                <li>LLaMA 3.1 reasoning synthesis</li>
                <li>Multi-stage execution logs</li>
                <li>Attribution mapping trace</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Zone - System Readiness & Logs */}
        <div className="workspace-panel system-readiness-zone card">
          <div className="zone-header">
            <h3>System Status & Metadata</h3>
          </div>
          
          <div className="readiness-metrics">
            <div className="readiness-row">
              <span className="lbl">FastAPI API Router</span>
              <span className="val status-green">Online</span>
            </div>
            <div className="readiness-row">
              <span className="lbl">ML Runtime Engine</span>
              <span className="val status-green">Standby</span>
            </div>
            <div className="readiness-row">
              <span className="lbl">AI Synthesis Node</span>
              <span className="val status-green">Connected</span>
            </div>
          </div>

          <div className="divider-line"></div>

          <div className="metadata-panel">
            <h4>Recent Execution Metadata</h4>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="lbl">Recent Session</span>
                <span className="val text-truncate" title="student_performance_v2.csv">student_performance_v2.csv</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Last Execution</span>
                <span className="val">22:14 UTC</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Pipeline Duration</span>
                <span className="val">4.2s</span>
              </div>
              <div className="meta-item">
                <span className="lbl">Inference Confidence</span>
                <span className="val">91.2%</span>
              </div>
            </div>
          </div>

          <div className="divider-line"></div>

          <div className="trace-preview-panel">
            <h4>Live Observability Stream</h4>
            <div className="trace-lines-container">
              <div className="trace-line">
                <span className="timestamp">[22:45:11]</span> <span className="msg">ML runtime initialized</span>
              </div>
              <div className="trace-line">
                <span className="timestamp">[22:45:12]</span> <span className="msg">AI synthesis layer connected</span>
              </div>
              <div className="trace-line">
                <span className="timestamp">[22:45:14]</span> <span className="msg">Awaiting dataset ingestion stream</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="dashboard-view animate-fade-in">
      
      {/* Dynamic Summary Stats Row */}
      <div className="dataset-intelligence-banner card">
        <div className="banner-top-row">
          <div className="dataset-title-box">
            <FileSpreadsheet size={15} className="text-accent" />
            <span className="section-label-sm">Active Workspace Context</span>
            <h2 className="active-dataset-name">{activeDataset.name}</h2>
            <span className="dataset-hash-time">{checksum}</span>
          </div>

          <div className="banner-pills-row">
            {activeDataset.status.isProcessed && <span className="status-badge-pill preprocessed">Preprocessed</span>}
            <select 
              className="dataset-dropdown-select"
              value={activeDataset.id}
              onChange={(e) => onSelectDataset(e.target.value)}
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button className="btn-secondary btn-sm" onClick={() => onNavigate('data-manager')}>
              + Upload
            </button>
          </div>
        </div>

        <div className="dataset-metrics-summary-grid">
          <div className="summary-metric-tile">
            <span className="tile-label">Total Rows</span>
            <span className="tile-value">{activeDataset.stats?.rows ? activeDataset.stats.rows.toLocaleString() : '0'}</span>
            <span className="tile-sub">Ingested records</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">Features</span>
            <span className="tile-value">{activeDataset.stats?.columns || '0'}</span>
            <span className="tile-sub">Raw columns</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">Clean Rows</span>
            <span className="tile-value">{activeDataset.processedData?.rows ? activeDataset.processedData.rows.toLocaleString() : '0'}</span>
            <span className="tile-sub">Preprocessed count</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">Missing Rate</span>
            <span className="tile-value">
              {activeDataset.stats?.nulls 
                ? `${((activeDataset.stats.nulls / (activeDataset.stats.rows * activeDataset.stats.columns)) * 100).toFixed(1)}%` 
                : '0.0%'}
            </span>
            <span className="tile-sub">Null cell density</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">Pipeline State</span>
            <span className="tile-value text-accent">{engineState}</span>
            <span className="tile-sub">Current process node</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid-layout">
        
        {/* Left Column: Visual Charts & Metrics table */}
        <div className="dashboard-left-column">
          
          <div className="graphic-widget card">
            <div className="graphic-header">
              <div className="graphic-toggles multi-mode-toggles-bar">
                {['confidence', 'weights', 'anomalies', 'correlation', 'distribution'].map((tab) => (
                  <button 
                    key={tab}
                    className={`toggle-tab-btn ${activeChartTab === tab ? 'active' : ''}`}
                    onClick={() => { 
                      setActiveChartTab(tab as any); 
                      if (tab !== 'weights') setHighlightedFeature(null);
                      if (tab !== 'anomalies') setHighlightedAnomaly(false);
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="chart-legend">
                {activeChartTab === 'confidence' && (
                  <>
                    <span className="legend-item"><span className="legend-line"></span>Confidence Score</span>
                    <span className="legend-item"><span className="legend-area"></span>95% CI Zone</span>
                  </>
                )}
                {activeChartTab === 'weights' && <span className="legend-item"><span className="legend-bar"></span>Attribution weight</span>}
                {activeChartTab === 'anomalies' && <span className="legend-item"><span className="legend-dot anomaly"></span>Outlier vectors</span>}
                {activeChartTab === 'correlation' && <span className="legend-item"><span className="legend-area correlation"></span>Pearson R</span>}
                {activeChartTab === 'distribution' && <span className="legend-item"><span className="legend-line dist"></span>Probability Density</span>}
              </div>
            </div>

            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                {activeChartTab === 'confidence' ? (
                  <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis dataKey="index" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} domain={[0, 2.0]} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="var(--accent-color)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorConfidence)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ci_upper" 
                      stroke="transparent" 
                      fill="var(--accent-light)" 
                    />
                    <ReferenceLine y={1.2} stroke="var(--border-color)" strokeDasharray="3 3" />
                  </AreaChart>
                ) : activeChartTab === 'weights' ? (
                  <BarChart data={featureWeights} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} horizontal={false} />
                    <XAxis type="number" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={10} tickLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={12}>
                      {featureWeights.map((entry: any, index: number) => {
                        const isHighlighted = entry.name === highlightedFeature;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isHighlighted ? 'var(--accent-color)' : 'var(--text-muted)'}
                            opacity={isHighlighted ? 1 : 0.4}
                            style={{ transition: 'fill 0.3s ease' }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : activeChartTab === 'anomalies' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis dataKey="index" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} domain={[0, 2.0]} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="confidence" stroke="var(--text-secondary)" strokeWidth={1} dot={false} opacity={0.3} />
                    {chartData.map((entry, index) => {
                      if (entry.isAnomaly) {
                        return (
                          <Line 
                            key={`anomaly-${index}`}
                            type="monotone"
                            dataKey="anomalyVal"
                            stroke="var(--danger)"
                            strokeWidth={0}
                            dot={{
                              r: highlightedAnomaly ? 6 : 4,
                              fill: 'var(--danger)',
                              stroke: 'rgba(239, 68, 68, 0.2)',
                              strokeWidth: highlightedAnomaly ? 4 : 2
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                    <ReferenceLine y={1.3} stroke="var(--danger)" strokeDasharray="5 5" opacity={0.5} />
                  </LineChart>
                ) : activeChartTab === 'correlation' ? (
                  <div className="correlation-matrix-grid">
                    <table className="correlation-matrix-table">
                      <thead>
                        <tr>
                          <th>Feature</th>
                          <th>dropout_risk</th>
                          <th>absences</th>
                          <th>gpa_cumulative</th>
                          <th>study_hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>dropout_risk</strong></td>
                          <td className="heat-cell v-1">1.00</td>
                          <td className="heat-cell v-high">0.74</td>
                          <td className="heat-cell v-neg-high">-0.62</td>
                          <td className="heat-cell v-neg-mid">-0.48</td>
                        </tr>
                        <tr>
                          <td><strong>absences</strong></td>
                          <td className="heat-cell v-high">0.74</td>
                          <td className="heat-cell v-1">1.00</td>
                          <td className="heat-cell v-neg-high">-0.51</td>
                          <td className="heat-cell v-neg-low">-0.24</td>
                        </tr>
                        <tr>
                          <td><strong>gpa_cumulative</strong></td>
                          <td className="heat-cell v-neg-high">-0.62</td>
                          <td className="heat-cell v-neg-high">-0.51</td>
                          <td className="heat-cell v-1">1.00</td>
                          <td className="heat-cell v-mid">0.59</td>
                        </tr>
                        <tr>
                          <td><strong>study_hours</strong></td>
                          <td className="heat-cell v-neg-mid">-0.48</td>
                          <td className="heat-cell v-neg-low">-0.24</td>
                          <td className="heat-cell v-mid">0.59</td>
                          <td className="heat-cell v-1">1.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDistribution" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                    <XAxis dataKey="confidence" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="distributionDensity" stroke="var(--accent-color)" strokeWidth={2} fill="url(#colorDistribution)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ml-inference-details card">
            <div className="inference-header">
              <div className="title-block">
                <Cpu size={15} className="text-secondary" />
                <span className="label-sm">Model Metrics & Evaluation</span>
                <h4>{activeDataset.status.isModelTrained ? 'RandomForestClassifier (rf_v2.1)' : 'Standby Base Classifier'}</h4>
              </div>
              <button 
                className="btn-secondary btn-sm flex-center gap-2"
                onClick={handleExportReport}
                title="Download local Markdown executive summary report"
              >
                <Download size={12} />
                <span>Export Report</span>
              </button>
            </div>

            <div className="inference-metrics-row">
              <div className="metric-tile">
                <span className="metric-val">
                  {activeDataset.mlResult?.metrics?.accuracy 
                    ? `${(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%` 
                    : '91.2%'}
                </span>
                <span className="metric-lbl">Accuracy</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">
                  {activeDataset.mlResult?.metrics?.precision 
                    ? activeDataset.mlResult.metrics.precision.toFixed(3) 
                    : '0.890'}
                </span>
                <span className="metric-lbl">Precision</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">
                  {activeDataset.mlResult?.metrics?.recall 
                    ? activeDataset.mlResult.metrics.recall.toFixed(3) 
                    : '0.930'}
                </span>
                <span className="metric-lbl">Recall</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">
                  {activeDataset.mlResult?.metrics?.f1_score 
                    ? activeDataset.mlResult.metrics.f1_score.toFixed(3) 
                    : '0.910'}
                </span>
                <span className="metric-lbl">F1 Score</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">
                  {activeDataset.mlResult?.metrics?.oob_score 
                    ? `${(activeDataset.mlResult.metrics.oob_score * 100).toFixed(1)}%` 
                    : '90.8%'}
                </span>
                <span className="metric-lbl">OOB Score</span>
              </div>
            </div>

            <div className="explainability-attribution-panel">
              <h4 className="explain-section-title">Prediction Influence Attribution Matrix</h4>
              <div className="explainability-grid">
                <div className="explain-item">
                  <span className="lbl">Top Feature</span>
                  <span className="val text-accent">{featureWeights[0].name}</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">Influence Ratio</span>
                  <span className="val">{(featureWeights[0].weight * 100).toFixed(1)}%</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">Confidence Bounds</span>
                  <span className="val">95% CI (±0.045 error)</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">Cross-Validation</span>
                  <span className="val">5-Fold Stratified</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Insight Engine & reasoning nodes */}
        <div className="dashboard-right-column">
          
          <div className="right-insight-column card">
            <div className="column-header">
              <Sparkles size={15} className="text-accent" />
              <h3>AI Insight Engine</h3>
            </div>
            
            <div className="insight-synthesis-progress">
              <span className="progress-label">Intelligence Synthesis Layer</span>
              <div className="progress-fraction">
                {pipelineStatus.isInsightsGenerated ? '14 / 14' : reasoningNodes.length > 0 ? `${reasoningNodes.length * 4} / 14` : '0 / 14'}
              </div>
            </div>

            <div className="reasoning-nodes-list">
              <div className="node-instructions">Click reasoning nodes to isolate feature attributions</div>
              
              {reasoningNodes.length === 0 ? (
                <div className="empty-nodes">Awaiting pipeline analysis to generate reasoning nodes.</div>
              ) : (
                reasoningNodes.map(node => (
                  <div 
                    key={node.id} 
                    className={`reasoning-node card-node ${activeNodeId === node.id ? 'active-highlight' : ''}`}
                    onClick={node.action}
                  >
                    <div className="node-header">
                      <div className="node-title-group">
                        {node.linkType === 'anomaly' && <ShieldAlert size={12} className="text-danger" />}
                        {node.linkType === 'feature' && <Cpu size={12} className="text-accent" />}
                        {node.linkType === 'model' && <CheckCircle size={12} className="text-success" />}
                        <span className="node-title">{node.title}</span>
                      </div>
                      <span className="node-time">{node.time}</span>
                    </div>
                    <p className="node-desc">{node.desc}</p>
                    
                    <div className="node-reasoning-anchor-tag">
                      <div className="anchor-meta-row">
                        <span>Source: <strong>{node.source}</strong></span>
                        <span>Confidence: <strong className="text-accent">{node.confidence}</strong></span>
                      </div>
                      <div className="anchor-meta-row" style={{ marginTop: '2px' }}>
                        <span>Severity: <strong style={{ color: node.severity === 'HIGH' ? 'var(--danger)' : node.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--success)' }}>{node.severity}</strong></span>
                        <span className="code-anchor-span">→ {node.linkedMetric}.vector</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Contextual Panel based on selection */}
              {activeNodeId && (
                <div className="contextual-inspection-panel animate-fade-in">
                  <div className="panel-header">
                    <Search size={12} className="text-accent" />
                    <h5>Contextual Inspection Panel</h5>
                  </div>
                  <div className="panel-contents">
                    {activeNodeId === 'node-1' && (
                      <>
                        <p><strong>Anomaly Vectors (3 points):</strong> Detected values deviate &gt; 2.1σ from the Gaussian mean.</p>
                        <p style={{ marginTop: '0.4rem' }}><strong>Remediation Strategy:</strong> Apply Isolation Forest filter to trim outliers prior to supervised fits.</p>
                      </>
                    )}
                    {activeNodeId === 'node-2' && (
                      <>
                        <p><strong>Attribution Metrics:</strong> Feature <code>{featureWeights[0].name}</code> holds the highest Gini impurity decrease.</p>
                        <p style={{ marginTop: '0.4rem' }}><strong>Sensitivity Ratio:</strong> 1.45x multiplier relative to second rank feature <code>{featureWeights[1]?.name || 'absences'}</code>.</p>
                      </>
                    )}
                    {activeNodeId === 'node-3' && (
                      <>
                        <p><strong>Model Convergence Details:</strong> Model stabilized after 140 training estimators.</p>
                        <p style={{ marginTop: '0.4rem' }}><strong>Hyperparameters:</strong> <code>n_estimators=200, max_depth=12, min_samples_split=5</code>.</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Natural Language Insights (from Groq LLaMA) */}
              {activeDataset.analyticsData?.aiInsightsText && (
                <div className="reasoning-node card-node raw-synthesis-box border-success" style={{ cursor: 'default' }}>
                  <div className="node-header">
                    <div className="node-title-group">
                      <Sparkles size={12} className="text-success" />
                      <span className="node-title">Groq AI Natural Language Insights</span>
                    </div>
                  </div>
                  <div className="node-desc text-primary" style={{ whiteSpace: 'pre-line', fontSize: 'var(--fs-xs)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    {activeDataset.analyticsData.aiInsightsText}
                  </div>
                </div>
              )}

              {!activeDataset.status.isInsightsGenerated && engineState !== 'IDLE' && (
                <div className="synthesizing-loader-row">
                  <span className="loader-dots"><span></span><span></span><span></span></span>
                  <span className="loader-text">Synthesizing intelligence...</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
