import { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Sliders, 
  Sparkles, 
  ShieldAlert, 
  FileSpreadsheet,
  Download,
  Radio,
  CheckCircle,
  Search
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
  Line
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
  const [uploadTime, setUploadTime] = useState('2026-05-28 22:18:08 UTC');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Background heartbeat states
  const [heartbeatActive, setHeartbeatActive] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeartbeatActive(prev => !prev);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeDataset) {
      const hex = activeDataset.id.substring(0, 8);
      setChecksum(`sha256:${hex}fa9bc...`);
      setUploadTime(`Uploaded: 2026-05-28 22:18:08 UTC`);
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

  // Pipeline orchestration checklist details
  const pipelineStatus = activeDataset?.status || {
    isLoaded: false,
    isProcessed: false,
    isAnalyzed: false,
    isModelTrained: false,
    isInsightsGenerated: false
  };

  const engineState = activeDataset?.engineState || 'IDLE';

  // Simulated AI insights with node linkages
  const reasoningNodes = [
    {
      id: 'node-1',
      title: 'CRITICAL ANOMALY OUTLIERS',
      desc: 'Isolation Forest identified statistical anomaly vectors at intervals 8, 14, and 22.',
      time: '12:02:19',
      linkType: 'anomaly',
      linkedMetric: 'dropout_risk',
      confidence: '95.4% CI',
      source: 'Isolation Forest',
      action: () => {
        setActiveChartTab('anomalies');
        setHighlightedAnomaly(true);
        setHighlightedFeature(null);
        setActiveNodeId('node-1');
      }
    },
    {
      id: 'node-2',
      title: 'DOMINANT FEATURE WEIGHT',
      desc: `Feature '${featureWeights[0].name}' displays a heavy weight contribution of ${(featureWeights[0].weight * 100).toFixed(1)}%.`,
      time: '12:02:34',
      linkType: 'feature',
      linkedMetric: featureWeights[0].name,
      confidence: `${(featureWeights[0].weight * 100).toFixed(1)}% weight`,
      source: 'RandomForestClassifier',
      action: () => {
        setActiveChartTab('weights');
        setHighlightedFeature(featureWeights[0].name);
        setHighlightedAnomaly(false);
        setActiveNodeId('node-2');
      }
    },
    {
      id: 'node-3',
      title: 'MODEL CONVERGENCE',
      desc: 'Random Forest model converged after 200 estimators with out-of-bag score 0.908.',
      time: '12:02:51',
      linkType: 'model',
      linkedMetric: 'Accuracy',
      confidence: '91.2% score',
      source: 'Auto-ML Workbench',
      action: () => {
        setActiveChartTab('confidence');
        setHighlightedFeature(null);
        setHighlightedAnomaly(false);
        setActiveNodeId('node-3');
      }
    }
  ];

  const getLogs = () => {
    if (activeDataset?.logs) {
      return activeDataset.logs;
    }
    return [
      { timestamp: '[12:01:05]', message: 'Ingestion pipeline standing by. Ingest spreadsheet to trigger orchestration.' }
    ];
  };

  const logs = getLogs();

  // Export AI Markdown report download helper
  const handleExportReport = () => {
    if (!activeDataset) return;
    const markdownContent = `# InsightGrid Observability Report
Generated: ${new Date().toLocaleDateString()}
Dataset: ${activeDataset.name}
MD5 Checksum: ${checksum}

## Model Metrics & Inference Details
- Algorithm: RandomForestClassifier
- Prediction Accuracy: 91.2%
- Precision: 0.890
- Out-of-bag Score: 0.908

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

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Top Ingestion State Monitor Banner */}
      <div className="dataset-intelligence-banner card">
        <div className="banner-top-row">
          <div className="dataset-title-box">
            <FileSpreadsheet size={16} className="text-cyan-muted" />
            <span className="section-label-sm">DATASET OBSERVER</span>
            <h2 className="active-dataset-name">{activeDataset ? activeDataset.name : 'NO ACTIVE DATASET'}</h2>
            <span className="dataset-hash-time">{checksum} · {uploadTime}</span>
          </div>

          <div className="banner-pills-row">
            {/* Live stream ready architecture tag */}
            <div className="live-stream-status-tag">
              <Radio size={12} className={`stream-blink ${heartbeatActive ? 'bright' : ''}`} />
              <span>AWAITING STREAM CONNECTION (LIVE ENDPOINT IDLE)</span>
            </div>

            {activeDataset?.status?.isProcessed && <span className="status-badge-pill preprocessed">PREPROCESSED</span>}
            <select 
              className="dataset-dropdown-select"
              value={activeDataset?.id || ''}
              onChange={(e) => onSelectDataset(e.target.value)}
            >
              <option value="" disabled>Select active dataset...</option>
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
            <span className="tile-label">TOTAL ROWS</span>
            <span className="tile-value">{activeDataset?.stats?.rows ? activeDataset.stats.rows.toLocaleString() : '0'}</span>
            <span className="tile-sub">Ingested records</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">FEATURES</span>
            <span className="tile-value">{activeDataset?.stats?.columns || '0'}</span>
            <span className="tile-sub">Raw variables</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">CLEAN ROWS</span>
            <span className="tile-value">{activeDataset?.processedData?.rows ? activeDataset.processedData.rows.toLocaleString() : '0'}</span>
            <span className="tile-sub">Validated samples</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">MISSING RATE</span>
            <span className="tile-value">
              {activeDataset?.stats?.nulls 
                ? `${((activeDataset.stats.nulls / (activeDataset.stats.rows * activeDataset.stats.columns)) * 100).toFixed(1)}%` 
                : '0.0%'}
            </span>
            <span className="tile-sub">Null cells parsed</span>
          </div>
          <div className="summary-metric-tile">
            <span className="tile-label">ENGINE STATUS</span>
            <span className={`tile-value text-glow-state ${engineState !== 'IDLE' && engineState !== 'COMPLETE' ? 'processing-state' : ''}`}>
              {engineState}
            </span>
            <span className="tile-sub">State monitor</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid-layout">
        
        {/* Left column: Pipeline Orchestration */}
        <div className="left-orch-column card">
          <div className="column-header">
            <Sliders size={15} className="text-cyan-muted" />
            <h3>PIPELINE ORCHESTRATION</h3>
          </div>

          <div className="pipeline-progress-steps">
            {/* Step 1: Ingestion */}
            <div className={`progress-step-row ${pipelineStatus.isLoaded ? 'completed' : engineState === 'INITIALIZING' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">01</span>
                  <span className="step-name">INGESTION</span>
                  <span className="step-percentage">{pipelineStatus.isLoaded ? '100%' : engineState === 'INITIALIZING' ? '40%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isLoaded ? 'fill-100' : engineState === 'INITIALIZING' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Dataset Loaded · 12ms</span>
              </div>
            </div>

            {/* Step 2: Validation */}
            <div className={`progress-step-row ${pipelineStatus.isProcessed ? 'completed' : engineState === 'VALIDATING' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">02</span>
                  <span className="step-name">VALIDATION</span>
                  <span className="step-percentage">{pipelineStatus.isProcessed ? '100%' : engineState === 'VALIDATING' ? '60%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isProcessed ? 'fill-100' : engineState === 'VALIDATING' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Schema Verified · 8us</span>
              </div>
            </div>

            {/* Step 3: Processing */}
            <div className={`progress-step-row ${pipelineStatus.isProcessed ? 'completed' : engineState === 'PROCESSING' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">03</span>
                  <span className="step-name">PROCESSING</span>
                  <span className="step-percentage">{pipelineStatus.isProcessed ? '100%' : engineState === 'PROCESSING' ? '80%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isProcessed ? 'fill-100' : engineState === 'PROCESSING' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Feature Engineering · 1.2s</span>
              </div>
            </div>

            {/* Step 4: Analytics */}
            <div className={`progress-step-row ${pipelineStatus.isAnalyzed ? 'completed' : engineState === 'ANALYZING' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">04</span>
                  <span className="step-name">ANALYTICS</span>
                  <span className="step-percentage">{pipelineStatus.isAnalyzed ? '100%' : engineState === 'ANALYZING' ? '70%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isAnalyzed ? 'fill-100' : engineState === 'ANALYZING' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Computing Metrics · 283ms</span>
              </div>
            </div>

            {/* Step 5: Prediction */}
            <div className={`progress-step-row ${pipelineStatus.isModelTrained ? 'completed' : engineState === 'RUNNING INFERENCE' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">05</span>
                  <span className="step-name">PREDICTION</span>
                  <span className="step-percentage">{pipelineStatus.isModelTrained ? '100%' : engineState === 'RUNNING INFERENCE' ? '75%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isModelTrained ? 'fill-100' : engineState === 'RUNNING INFERENCE' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Running Inference · 89ms</span>
              </div>
            </div>

            {/* Step 6: Insight Gen */}
            <div className={`progress-step-row ${pipelineStatus.isInsightsGenerated ? 'completed' : engineState === 'SYNTHESIZING INSIGHTS' ? 'active-stage' : 'pending'}`}>
              <div className="step-bar-wrapper">
                <div className="step-info">
                  <span className="step-num">06</span>
                  <span className="step-name">INSIGHT GEN</span>
                  <span className="step-percentage">{pipelineStatus.isInsightsGenerated ? '100%' : engineState === 'SYNTHESIZING INSIGHTS' ? '85%' : '0%'}</span>
                </div>
                <div className="step-bar">
                  <div className={`step-fill ${pipelineStatus.isInsightsGenerated ? 'fill-100' : engineState === 'SYNTHESIZING INSIGHTS' ? 'fill-loading' : ''}`}></div>
                </div>
                <span className="step-meta">Synthesizing Notes · 1.4s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center column: Multi-Mode Analytics Canvas */}
        <div className="center-graphic-column">
          <div className="graphic-widget card">
            <div className="graphic-header">
              <div className="graphic-toggles multi-mode-toggles-bar">
                <button 
                  className={`toggle-tab-btn ${activeChartTab === 'confidence' ? 'active' : ''}`}
                  onClick={() => { setActiveChartTab('confidence'); setHighlightedFeature(null); setHighlightedAnomaly(false); }}
                >
                  CONFIDENCE
                </button>
                <button 
                  className={`toggle-tab-btn ${activeChartTab === 'weights' ? 'active' : ''}`}
                  onClick={() => { setActiveChartTab('weights'); setHighlightedAnomaly(false); }}
                >
                  ATTRIBUTION
                </button>
                <button 
                  className={`toggle-tab-btn ${activeChartTab === 'anomalies' ? 'active' : ''}`}
                  onClick={() => { setActiveChartTab('anomalies'); setHighlightedFeature(null); }}
                >
                  ANOMALIES
                </button>
                <button 
                  className={`toggle-tab-btn ${activeChartTab === 'correlation' ? 'active' : ''}`}
                  onClick={() => { setActiveChartTab('correlation'); setHighlightedFeature(null); setHighlightedAnomaly(false); }}
                >
                  CORRELATION
                </button>
                <button 
                  className={`toggle-tab-btn ${activeChartTab === 'distribution' ? 'active' : ''}`}
                  onClick={() => { setActiveChartTab('distribution'); setHighlightedFeature(null); setHighlightedAnomaly(false); }}
                >
                  DISTRIBUTION
                </button>
              </div>

              <div className="chart-legend">
                {activeChartTab === 'confidence' && (
                  <>
                    <span className="legend-item"><span className="legend-line"></span>CONFIDENCE</span>
                    <span className="legend-item"><span className="legend-area"></span>95% CI</span>
                  </>
                )}
                {activeChartTab === 'weights' && <span className="legend-item"><span className="legend-bar"></span>WEIGHT</span>}
                {activeChartTab === 'anomalies' && <span className="legend-item"><span className="legend-dot anomaly"></span>OUTLIER VECTORS</span>}
                {activeChartTab === 'correlation' && <span className="legend-item"><span className="legend-area correlation"></span>PEARSON R</span>}
                {activeChartTab === 'distribution' && <span className="legend-item"><span className="legend-line dist"></span>PROBABILITY DENSITY</span>}
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
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.015)" />
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
                      fill="rgba(6, 182, 212, 0.03)" 
                    />
                  </AreaChart>
                ) : activeChartTab === 'weights' ? (
                  <BarChart data={featureWeights} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.015)" horizontal={false} />
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
                            fill={isHighlighted ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)'}
                            style={{ 
                              filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' : 'none',
                              transition: 'fill 0.3s ease'
                            }}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : activeChartTab === 'anomalies' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.015)" />
                    <XAxis dataKey="index" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} domain={[0, 2.0]} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', borderRadius: '6px' }}
                      itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="confidence" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} dot={false} />
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
                              r: highlightedAnomaly ? 7 : 5,
                              fill: 'var(--danger)',
                              stroke: 'rgba(244,63,94,0.4)',
                              strokeWidth: 4,
                              className: 'anomaly-dot-pulse'
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                  </LineChart>
                ) : activeChartTab === 'correlation' ? (
                  // Custom heatmap visualization inside the canvas!
                  <div className="correlation-matrix-grid">
                    <table className="correlation-matrix-table">
                      <thead>
                        <tr>
                          <th>Feature Name</th>
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
                        <stop offset="5%" stopColor="var(--accent-color-dim)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent-color-dim)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.015)" />
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

          {/* Bottom Panel (ML details + Explainability Layer) */}
          <div className="ml-inference-details card">
            <div className="inference-header">
              <div className="title-block">
                <Cpu size={15} className="text-cyan-muted" />
                <span className="label-sm">MODEL EXPLAINABILITY & METRICS</span>
                <h4>{activeDataset?.processedData ? 'RandomForestClassifier (rf_v2.1.0)' : 'STANDBY BASELINE MODEL'}</h4>
              </div>
              <button 
                className="btn-secondary btn-sm flex-center gap-2"
                onClick={handleExportReport}
                disabled={!activeDataset}
                title="Download local Markdown executive summary report"
              >
                <Download size={12} />
                <span>Export Report</span>
              </button>
            </div>

            <div className="inference-metrics-row">
              <div className="metric-tile">
                <span className="metric-val">91.2%</span>
                <span className="metric-lbl">ACCURACY</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">0.890</span>
                <span className="metric-lbl">PRECISION</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">0.930</span>
                <span className="metric-lbl">RECALL</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">0.910</span>
                <span className="metric-lbl">F1 SCORE</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">90.8%</span>
                <span className="metric-lbl">OOB SCORE</span>
              </div>
              <div className="metric-tile">
                <span className="metric-val">0.05</span>
                <span className="metric-lbl">CONTAM. LEVEL</span>
              </div>
            </div>

            {/* Explainability Matrix (Phase 6) */}
            <div className="explainability-attribution-panel">
              <h4 className="explain-section-title">Prediction Influence Attribution Matrix</h4>
              <div className="explainability-grid">
                <div className="explain-item">
                  <span className="lbl">TOP CONTRIBUTING FEATURE</span>
                  <span className="val text-cyan">{featureWeights[0].name}</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">FEATURE CONTRIB. RATIO</span>
                  <span className="val">{(featureWeights[0].weight * 100).toFixed(1)}% influence</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">CONFIDENCE BOUNDS</span>
                  <span className="val">95% CI (±0.045 error)</span>
                </div>
                <div className="explain-item">
                  <span className="lbl">CROSS-VALIDATION</span>
                  <span className="val">5-Fold Stratified K-Fold</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: AI Insight Engine & Reasoning Nodes */}
        <div className="right-insight-column card">
          <div className="column-header">
            <Sparkles size={15} className="text-cyan" />
            <h3>AI INSIGHT ENGINE</h3>
            <span className="live-status-dot active-pulse"></span>
          </div>
          
          <div className="insight-synthesis-progress">
            <span className="progress-label">Intelligence Synthesis Layer</span>
            <div className="progress-fraction">{activeDataset?.status?.isInsightsGenerated ? '14 / 14' : '3 / 14'}</div>
          </div>

          <div className="reasoning-nodes-list">
            <div className="node-instructions">Click reasoning nodes to anchor chart visualizations</div>
            
            {reasoningNodes.map(node => (
              <div 
                key={node.id} 
                className={`reasoning-node card-node ${activeNodeId === node.id ? 'active-highlight' : ''} ${
                  node.linkType === 'anomaly' && highlightedAnomaly ? 'border-danger' : ''
                } ${
                  node.linkType === 'feature' && highlightedFeature ? 'border-cyan' : ''
                }`}
                onClick={node.action}
              >
                <div className="node-header">
                  <div className="node-title-group">
                    {node.linkType === 'anomaly' && <ShieldAlert size={12} className="text-danger" />}
                    {node.linkType === 'feature' && <Cpu size={12} className="text-cyan" />}
                    {node.linkType === 'model' && <CheckCircle size={12} className="text-success" />}
                    <span className="node-title">{node.title}</span>
                  </div>
                  <span className="node-time">{node.time}</span>
                </div>
                <p className="node-desc">{node.desc}</p>
                
                {/* Explainable AI Metadata footer (Phase 2 & 5) */}
                <div className="node-reasoning-anchor-tag">
                  <div className="anchor-meta-row">
                    <span>Source: <strong>{node.source}</strong></span>
                    <span>Confidence: <strong className="text-cyan">{node.confidence}</strong></span>
                  </div>
                  <span className="code-anchor-span">→ {node.linkedMetric}.vector</span>
                </div>
              </div>
            ))}

            {/* Contextual Panel based on selection (Phase 5) */}
            {activeNodeId && (
              <div className="contextual-inspection-panel animate-fade-in">
                <div className="panel-header">
                  <Search size={12} className="text-cyan" />
                  <h5>CONTEXTUAL INSPECTION PANEL</h5>
                </div>
                <div className="panel-contents">
                  {activeNodeId === 'node-1' && (
                    <>
                      <p><strong>Anomaly Markers (3 points):</strong> Detected values deviate &gt; 2.1σ from the rolling Gaussian mean.</p>
                      <p><strong>Remediation Strategy:</strong> Apply Isolation Forest filter to trim outliers prior to supervised fits.</p>
                    </>
                  )}
                  {activeNodeId === 'node-2' && (
                    <>
                      <p><strong>Attribution Metrics:</strong> Feature <code>{featureWeights[0].name}</code> holds the highest Gini impurity decrease.</p>
                      <p><strong>Sensitivity Ratio:</strong> 1.45x multiplier relative to second rank feature <code>{featureWeights[1]?.name || 'absences'}</code>.</p>
                    </>
                  )}
                  {activeNodeId === 'node-3' && (
                    <>
                      <p><strong>Model Convergence Details:</strong> Model stabilized after 140 training iterations.</p>
                      <p><strong>Hyperparameters:</strong> <code>n_estimators=200, max_depth=12, min_samples_split=5</code>.</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {!activeDataset?.status?.isInsightsGenerated && engineState !== 'IDLE' && (
              <div className="synthesizing-loader-row">
                <span className="loader-dots"><span></span><span></span><span></span></span>
                <span className="loader-text">Synthesizing intelligence...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel - Execution Trace */}
      <div className="execution-trace-panel card">
        <div className="trace-header">
          <Terminal size={14} className="text-cyan-muted" />
          <span>EXECUTION TRACE</span>
          <span className="trace-events-count">{logs.length} EVENTS</span>
          <div className="pulse-signal-wrapper">
            <span className={`signal-light ${heartbeatActive ? 'active' : ''}`}></span>
            <span className="trace-status-live">SYSTEM HEARTBEAT ACTIVE</span>
          </div>
        </div>

        <div className="trace-logs-slider">
          {logs.map((log: any, index: number) => (
            <div key={index} className="trace-log-item">
              <span className="log-time">{log.timestamp}</span>
              <span className="log-msg">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
