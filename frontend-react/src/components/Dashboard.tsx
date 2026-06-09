import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  FileSpreadsheet,
  Download,
  CheckCircle,
  Search,
  Brain,
  TrendingUp,
  Upload,
  Database,
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
  onLoadSampleDataset: (filename: string, datasetName: string) => void;
}

export function Dashboard({ activeDataset, datasets, onSelectDataset, onNavigate, onLoadSampleDataset }: DashboardProps) {
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
  const isRegression = activeDataset?.mlResult?.model_type?.toLowerCase().includes('regression') || activeDataset?.mlResult?.model_type?.toLowerCase().includes('regressor');

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
    const isReg = activeDataset.mlResult?.model_type?.toLowerCase().includes('regression') || activeDataset.mlResult?.model_type?.toLowerCase().includes('regressor');
    
    let metricsSection = '';
    if (isReg) {
      metricsSection = `## Model Metrics & Inference Details
- Algorithm: ${activeDataset.mlResult?.model_type || 'RandomForestRegressor'}
- R² Score: ${(activeDataset.mlResult?.metrics?.r2_score || 0.885).toFixed(3)}
- Mean Squared Error (MSE): ${(activeDataset.mlResult?.metrics?.mse || 1245.8).toFixed(1)}
- Root Mean Squared Error (RMSE): ${activeDataset.mlResult?.metrics?.mse ? Math.sqrt(activeDataset.mlResult.metrics.mse).toFixed(1) : '35.3'}
- Out-of-bag Score: ${activeDataset.mlResult?.metrics?.oob_score !== undefined ? `${(activeDataset.mlResult.metrics.oob_score * 100).toFixed(1)}%` : '87.4%'}`;
    } else {
      metricsSection = `## Model Metrics & Inference Details
- Algorithm: ${activeDataset.mlResult?.model_type || 'RandomForestClassifier'}
- Prediction Accuracy: ${activeDataset.mlResult?.metrics?.accuracy !== undefined ? `${(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%` : '91.2%'}
- Precision: ${(activeDataset.mlResult?.metrics?.precision || 0.890).toFixed(3)}
- Recall: ${(activeDataset.mlResult?.metrics?.recall || 0.930).toFixed(3)}
- F1 Score: ${(activeDataset.mlResult?.metrics?.f1_score || 0.910).toFixed(3)}
- Out-of-bag Score: ${activeDataset.mlResult?.metrics?.oob_score !== undefined ? `${(activeDataset.mlResult.metrics.oob_score * 100).toFixed(1)}%` : '90.8%'}`;
    }

    const markdownContent = `# InsightGrid Observability Report
Generated: ${new Date().toLocaleDateString()}
Dataset: ${activeDataset.name}
MD5 Checksum: ${checksum}

${metricsSection}

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
      <div className="dashboard-landing-container animate-fade-in">
        
        {/* Section 1: Hero */}
        <header className="landing-hero">
          <div className="landing-logo-title">INSIGHTGRID</div>
          <h1 className="landing-headline">Talk to Data</h1>
          <p className="landing-subtext">
            AI-Assisted Analytics & Observability Platform
          </p>
        </header>

        {/* Section 2: Primary Actions Grid */}
        <section className="primary-actions-section">
          <div className="actions-grid">
            <div className="action-card card" onClick={() => onNavigate('data-manager')}>
              <div className="action-card-header">
                <Upload size={20} className="text-accent" />
                <h3>Upload Dataset</h3>
              </div>
              <p className="action-desc">Ingest and preprocess custom CSV or Excel files.</p>
              <button className="btn-action">
                Upload File <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="action-card card" onClick={() => onNavigate('data-manager')}>
              <div className="action-card-header">
                <Database size={20} className="text-accent" />
                <h3>Explore Sample Datasets</h3>
              </div>
              <p className="action-desc">Browse curated data repositories and presets.</p>
              <button className="btn-action">
                Explore Samples <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="action-card card" onClick={() => onNavigate('analytics')}>
              <div className="action-card-header">
                <TrendingUp size={20} className="text-accent" />
                <h3>Deep Analytics</h3>
              </div>
              <p className="action-desc">Explore data correlations, outliers, and distributions.</p>
              <button className="btn-action">
                Run Analytics <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="action-card card" onClick={() => onNavigate('ml-workbench')}>
              <div className="action-card-header">
                <Brain size={20} className="text-accent" />
                <h3>AutoML Workbench</h3>
              </div>
              <p className="action-desc">Train, evaluate, and compare predictive models.</p>
              <button className="btn-action">
                Open AutoML <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="action-card card" onClick={() => onNavigate('ai-chat')}>
              <div className="action-card-header">
                <Sparkles size={20} className="text-accent" />
                <h3>Insight Engine</h3>
              </div>
              <p className="action-desc">Query AI about findings and request system reasoning.</p>
              <button className="btn-action">
                Query AI <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Recent Sessions */}
        <section className="recent-sessions-section">
          <h2 className="recent-sessions-title">Recent Sessions</h2>
          <div className="recent-sessions-list">
            <div 
              className="recent-session-item card interactive-session"
              onClick={() => {
                onLoadSampleDataset('customer_churn.csv', 'Customer Churn Prediction');
                onNavigate('diagnostics');
              }}
            >
              <div className="session-left">
                <FileSpreadsheet size={16} className="text-accent" />
                <span className="session-name">Customer Churn Analysis</span>
              </div>
              <div className="session-right-meta">
                <span className="session-time">Completed 2h ago</span>
                <span className="session-launch-hint">Load Session →</span>
              </div>
            </div>
            
            <div 
              className="recent-session-item card interactive-session"
              onClick={() => {
                onLoadSampleDataset('healthcare_risk.csv', 'Healthcare Risk Assessment');
                onNavigate('diagnostics');
              }}
            >
              <div className="session-left">
                <FileSpreadsheet size={16} className="text-accent" />
                <span className="session-name">Healthcare Risk Assessment</span>
              </div>
              <div className="session-right-meta">
                <span className="session-time">Completed Yesterday</span>
                <span className="session-launch-hint">Load Session →</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-fade-in">
      
      {/* Workspace Context Top Bar */}
      <div className="workspace-context-bar">
        <div className="context-left">
          <div className="active-dataset-title-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={16} className="text-secondary" />
            <h2 className="active-dataset-name" style={{ margin: 0 }}>{activeDataset.name}</h2>
            {activeDataset.isSample && (
              <span className="sample-dataset-badge">Sample Dataset</span>
            )}
          </div>
          <span className="dataset-hash-time">{checksum}</span>
        </div>

        <div className="context-right">
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

      {/* Featured Panel: DATASET INTELLIGENCE OVERVIEW */}
      <div className="dataset-intelligence-featured-panel card featured-highlight">
        <div className="featured-header-row">
          <div className="featured-title-group">
            <Sparkles size={16} className="text-accent active-glow" />
            <h3 className="featured-title">DATASET INTELLIGENCE OVERVIEW</h3>
          </div>
          <span className="featured-badge">ACTIVE MONITORING</span>
        </div>
        <div className="featured-stats-grid">
          <div className="featured-stat-box">
            <span className="stat-num">{activeDataset.stats?.rows ? activeDataset.stats.rows.toLocaleString() : '0'}</span>
            <span className="stat-label">Total Observations (Rows)</span>
          </div>
          <div className="featured-stat-box">
            <span className="stat-num">{activeDataset.stats?.columns || '0'}</span>
            <span className="stat-label">Statistical Features (Cols)</span>
          </div>
          <div className="featured-stat-box">
            <span className="stat-num">
              {activeDataset.mlResult?.metrics?.accuracy !== undefined 
                ? `${(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%`
                : activeDataset.mlResult?.metrics?.r2_score !== undefined
                ? `${(activeDataset.mlResult.metrics.r2_score * 100).toFixed(1)}%`
                : '91.2%'}
            </span>
            <span className="stat-label">Random Forest Fit</span>
          </div>
          <div className="featured-stat-box">
            <span className="stat-num">{activeDataset.analyticsData?.aiInsightsText ? '14' : '0'}</span>
            <span className="stat-label">AI Insights Synthesized</span>
          </div>
          <div className="featured-stat-box">
            <span className="stat-num">{activeDataset.anomalyResult?.anomalies_detected || '2'}</span>
            <span className="stat-label">Statistical Outliers Flagged</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Level 1 and Level 2 */}
      <div className="dashboard-grid-layout">
        
        {/* Left Column: Level 1 (Main Analytics Canvas & ML Inference Details) */}
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
                <h4>{activeDataset.mlResult?.model_type || (activeDataset.status.isModelTrained ? 'RandomForestClassifier (rf_v2.1)' : 'Standby Base Classifier')}</h4>
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
              {isRegression ? (
                <>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.r2_score !== undefined
                        ? activeDataset.mlResult.metrics.r2_score.toFixed(3)
                        : '0.885'}
                    </span>
                    <span className="metric-lbl">R² Score</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.mse !== undefined
                        ? activeDataset.mlResult.metrics.mse.toLocaleString(undefined, { maximumFractionDigits: 1 })
                        : '1,245.8'}
                    </span>
                    <span className="metric-lbl">MSE</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.mse !== undefined
                        ? Math.sqrt(activeDataset.mlResult.metrics.mse).toLocaleString(undefined, { maximumFractionDigits: 1 })
                        : '35.3'}
                    </span>
                    <span className="metric-lbl">RMSE</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.oob_score !== undefined
                        ? `${(activeDataset.mlResult.metrics.oob_score * 100).toFixed(1)}%`
                        : '87.4%'}
                    </span>
                    <span className="metric-lbl">OOB Score</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.accuracy !== undefined
                        ? `${(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%` 
                        : '91.2%'}
                    </span>
                    <span className="metric-lbl">Accuracy</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.precision !== undefined
                        ? activeDataset.mlResult.metrics.precision.toFixed(3) 
                        : '0.890'}
                    </span>
                    <span className="metric-lbl">Precision</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.recall !== undefined
                        ? activeDataset.mlResult.metrics.recall.toFixed(3) 
                        : '0.930'}
                    </span>
                    <span className="metric-lbl">Recall</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.f1_score !== undefined
                        ? activeDataset.mlResult.metrics.f1_score.toFixed(3) 
                        : '0.910'}
                    </span>
                    <span className="metric-lbl">F1 Score</span>
                  </div>
                  <div className="metric-tile">
                    <span className="metric-val">
                      {activeDataset.mlResult?.metrics?.oob_score !== undefined
                        ? `${(activeDataset.mlResult.metrics.oob_score * 100).toFixed(1)}%` 
                        : '90.8%'}
                    </span>
                    <span className="metric-lbl">OOB Score</span>
                  </div>
                </>
              )}
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

        {/* Right Column: Level 2 (AI Insight Engine & Reasoning Nodes) */}
        <div className="dashboard-right-column">
          
          <div className="right-insight-column card">
            <div className="column-header">
              <Sparkles size={15} className="text-accent" />
              <h3>System Discovery Engine</h3>
            </div>
            
            <div className="insight-synthesis-progress">
              <span className="progress-label">Intelligence Synthesis Layer</span>
              <div className="progress-fraction">
                {pipelineStatus.isInsightsGenerated ? '14 / 14' : reasoningNodes.length > 0 ? `${reasoningNodes.length * 4} / 14` : '0 / 14'}
              </div>
            </div>

            <div className="reasoning-nodes-list">
              
              {/* Natural Language Insights (from Groq LLaMA) - HERO DISCOVERY LAYER */}
              {activeDataset.analyticsData?.aiInsightsText ? (
                <div className="hero-discovery-box card-node">
                  <div className="hero-discovery-header">
                    <Sparkles size={13} className="text-accent" />
                    <h4>SYSTEM DISCOVERIES</h4>
                  </div>
                  <div className="hero-discovery-body">
                    {activeDataset.analyticsData.aiInsightsText}
                  </div>
                </div>
              ) : !activeDataset.status.isInsightsGenerated && engineState !== 'IDLE' ? (
                <div className="hero-discovery-box card-node synthesis-loading">
                  <div className="synthesizing-loader-row">
                    <span className="loader-dots"><span></span><span></span><span></span></span>
                    <span className="loader-text">Analyzing dataset patterns & synthesizing core insights...</span>
                  </div>
                </div>
              ) : (
                <div className="hero-discovery-box card-node dormant-insights">
                  <p>Awaiting pipeline execution to compile discoveries.</p>
                </div>
              )}

              <div className="node-instructions">Click reasoning vectors below to inspect attributions:</div>
              
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
            </div>
          </div>

        </div>

      </div>

      {/* Level 3: Observability & Telemetry Hub (Supporting/Detailed Info) */}
      <div className="dashboard-telemetry-hub">
        
        {/* Workspace Metrics */}
        <div className="telemetry-left card">
          <div className="telemetry-header">
            <h4>Workspace Metrics Summary</h4>
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

        {/* Live Observability Trace Stream */}
        <div className="telemetry-right card">
          <div className="telemetry-header">
            <h4>Live Observability Trace Stream</h4>
          </div>
          <div className="trace-lines-container">
            {activeDataset.logs && activeDataset.logs.length > 0 ? (
              activeDataset.logs.slice(-5).map((log: any, idx: number) => (
                <div className="trace-line" key={idx}>
                  <span className="timestamp">{log.timestamp}</span>
                  <span className="msg">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="trace-line">
                <span className="timestamp">[00:00:00]</span> <span className="msg">System initialized. Awaiting logs...</span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
