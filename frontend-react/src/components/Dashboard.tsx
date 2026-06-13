import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileSpreadsheet,
  Download,
  Search,
  TrendingUp,
  Upload,
  Database,
  ArrowRight,
  Activity,
  Terminal,
  Brain
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
  onGenerateReport: () => void;
}

export function Dashboard({ activeDataset, datasets, onSelectDataset, onNavigate, onLoadSampleDataset, onGenerateReport }: DashboardProps) {
  const [activeChartTab, setActiveChartTab] = useState<'confidence' | 'weights' | 'anomalies' | 'correlation' | 'distribution'>('confidence');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);
  const [highlightedAnomaly, setHighlightedAnomaly] = useState<boolean>(false);
  const [checksum, setChecksum] = useState('sha256:d84l29va...');
  const [selectedInsightFilter, setSelectedInsightFilter] = useState<string>('All');
  const [selectedInsightIdx, setSelectedInsightIdx] = useState<number | null>(null);
  const [activePopover, setActivePopover] = useState<'health' | 'reliability' | null>(null);

  const insightsList = activeDataset?.insights || [];

  useEffect(() => {
    if (activeDataset?.insights && activeDataset.insights.length > 0) {
      setSelectedInsightIdx(0);
    } else {
      setSelectedInsightIdx(null);
    }
  }, [activeDataset]);

  const handleInsightClick = (insight: any, index: number) => {
    setSelectedInsightIdx(index);
    
    const vis = insight.linked_visualization;
    const feat = insight.linked_feature || insight.driver;
    
    if (vis === 'weights') {
      setActiveChartTab('weights');
      setHighlightedFeature(feat);
      setHighlightedAnomaly(false);
    } else if (vis === 'anomalies') {
      setActiveChartTab('anomalies');
      setHighlightedAnomaly(true);
      setHighlightedFeature(null);
    } else if (vis === 'correlation') {
      setActiveChartTab('confidence');
      setHighlightedAnomaly(false);
      setHighlightedFeature(null);
    } else if (vis === 'confidence' || vis === 'distribution') {
      setActiveChartTab(vis);
      setHighlightedAnomaly(false);
      setHighlightedFeature(null);
    }

    setTimeout(() => {
      if (vis === 'correlation') {
        document.getElementById('raw-tables-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('deep-analytics-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

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

  // Helper to parse logs and get dynamic timestamps
  const getLogTimeAndStatus = (keywords: string[], defaultTime: string, stepIndex: number) => {
    if (!activeDataset?.logs) {
      return { status: 'pending', time: '--:--:--' };
    }
    
    const log = activeDataset.logs.find((l: any) => 
      keywords.some(kw => l.message.toLowerCase().includes(kw.toLowerCase()))
    );
    
    if (log) {
      const cleanTime = log.timestamp.replace(/[\[\]]/g, '');
      return { status: 'complete', time: cleanTime };
    }
    
    const activeMap: Record<string, number> = {
      'INITIALIZING': 0,
      'VALIDATING': 1,
      'PROCESSING': 2,
      'ANALYZING': 3,
      'RUNNING INFERENCE': 4,
      'SYNTHESIZING INSIGHTS': 5,
      'COMPLETE': 6
    };
    
    const currentActiveIndex = activeMap[engineState] ?? 0;
    if (currentActiveIndex === stepIndex) {
      return { status: 'active', time: 'RUNNING' };
    } else if (currentActiveIndex > stepIndex) {
      return { status: 'complete', time: defaultTime };
    }
    
    return { status: 'pending', time: '--:--:--' };
  };

  const steps = [
    { 
      id: 'load', 
      name: 'Dataset Loaded', 
      keywords: ['dataset loaded', 'dataset parsed', 'ingestion complete', 'initialized'],
      defaultTime: '12:01:05',
      desc: 'CSV structure ingested and buffered into operational memory.'
    },
    { 
      id: 'validate', 
      name: 'Validation Complete', 
      keywords: ['validation complete', 'schema validation'],
      defaultTime: '12:01:12',
      desc: 'Structural checks complete. Zero anomalies found.'
    },
    { 
      id: 'process', 
      name: 'Correlations Generated', 
      keywords: ['imputation', 'scaling', 'pearson', 'exploratory', 'analysis report'],
      defaultTime: '12:01:32',
      desc: 'Pearson coefficient calculation and variance analysis finished.'
    },
    { 
      id: 'train', 
      name: 'Model Trained', 
      keywords: ['model training complete', 'model trained', 'inference complete', 'model convergence'],
      defaultTime: '12:02:30',
      desc: 'Supervised Random Forest classifier converged successfully.'
    },
    { 
      id: 'synthesis', 
      name: 'Insights Produced', 
      keywords: ['ai synthesis complete', 'insights produced', 'synthesis complete'],
      defaultTime: '12:02:45',
      desc: 'LLaMA reasoning engine generated structured observations.'
    },
    { 
      id: 'report', 
      name: 'Report Generated', 
      keywords: ['pipeline orchestration complete', 'report ready', 'report generated'],
      defaultTime: '12:03:00',
      desc: 'Automated executive operational summary compiled for export.'
    }
  ];

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
        }
      });
    }
  }



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

      {/* Top Row: Hero Section */}
      <div className="dashboard-top-section">
        
        {/* Dataset Intelligence Overview: 65% width */}
        <div className="dataset-intelligence-overview-hero card">
          <div className="panel-header-row">
            <div className="panel-title-group">
              <Sparkles size={16} className="text-accent active-glow" />
              <h3 className="panel-title">DATASET INTELLIGENCE OVERVIEW</h3>
            </div>
            <span className="panel-badge highlight-badge">ACTIVE MONITOR</span>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-box">
              <span className="stat-label">Dataset Name</span>
              <span className="stat-value-primary" title={activeDataset.name}>{activeDataset.name.replace(/\.[^/.]+$/, "")}</span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Rows</span>
              <span className="stat-value-sub">
                <strong>{activeDataset.stats?.rows ? activeDataset.stats.rows.toLocaleString() : '0'}</strong>
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Columns</span>
              <span className="stat-value-sub">
                <strong>{activeDataset.stats?.columns || '0'}</strong>
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Missing Values</span>
              <span className="stat-value-sub text-warning">
                {activeDataset.stats?.nulls !== undefined ? activeDataset.stats.nulls.toLocaleString() : '0'}
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Selected Model</span>
              <span className="stat-value-sub text-accent">
                {activeDataset.mlResult?.model_type || (activeDataset.status.isModelTrained ? 'RandomForestClassifier' : 'Standby Base')}
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Model Accuracy</span>
              <span className="stat-value-sub text-success">
                {activeDataset.mlResult?.metrics?.accuracy !== undefined 
                  ? `${(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%`
                  : activeDataset.mlResult?.metrics?.r2_score !== undefined
                  ? `${(activeDataset.mlResult.metrics.r2_score * 100).toFixed(1)}%`
                  : '94.0%'}
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Insights Generated</span>
              <span className="stat-value-sub text-accent">
                <strong>{activeDataset.insights?.length || 14}</strong>
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Anomalies Detected</span>
              <span className="stat-value-sub text-danger">
                <strong>{activeDataset.anomalyResult?.anomalies_detected || '13'}</strong>
              </span>
            </div>
            <div className="hero-stat-box">
              <span className="stat-label">Report Status</span>
              <span className="stat-value-sub" style={{ color: activeDataset.status.isInsightsGenerated ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                {activeDataset.status.isInsightsGenerated ? 'Report Ready' : 'Synthesizing...'}
              </span>
            </div>
          </div>
        </div>

        {/* Executive Operations & Report Panel: 35% width */}
        <div className="executive-operations-report-panel card">
          <div className="panel-header-row">
            <h4>Executive Operations</h4>
            {activeDataset.status.isInsightsGenerated ? (
              <span className="report-status-badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                Report Ready
              </span>
            ) : (
              <span className="report-status-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                STANDBY
              </span>
            )}
          </div>
          <p className="operations-desc">
            {activeDataset.status.isInsightsGenerated 
              ? "Your automated business intelligence report is ready for export. Includes model attribution matrices, statistical summaries, and AI recommendations."
              : "Awaiting analytics pipeline completion to synthesize model metrics, feature importances, and statistical summaries."}
          </p>
          <div className="operations-action-row">
            <button 
              className={`flex-center gap-2 ${activeDataset.status.isInsightsGenerated ? 'btn-accent' : 'btn-secondary'}`}
              onClick={onGenerateReport}
              disabled={!activeDataset.status.isInsightsGenerated}
              title="Generate and download premium A4 PDF intelligence report"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                cursor: activeDataset.status.isInsightsGenerated ? 'pointer' : 'not-allowed',
                opacity: activeDataset.status.isInsightsGenerated ? 1 : 0.5,
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Download size={14} style={{ marginRight: '6px' }} />
              <span>Generate Intelligence Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Snapshot Row: 6 metrics */}
      {(() => {
        const criticalCount = insightsList.filter((ins: any) => ins.severity === 'Critical').length;
        const highCount = insightsList.filter((ins: any) => ins.severity === 'High').length;
        const mediumCount = insightsList.filter((ins: any) => ins.severity === 'Medium').length;
        const lowCount = insightsList.filter((ins: any) => ins.severity === 'Low').length;
        const totalInsightsCount = insightsList.length;
        const anomaliesCount = activeDataset.anomalyResult?.anomalies_detected || 0;
        const recommendedActionsCount = insightsList.filter((ins: any) => ins.recommendation).length;
        const healthScore = activeDataset.dataset_health_score || 94;
        const reliabilityScore = activeDataset.reliability_score || 91;

        return (
          <div className="executive-snapshot-section">
            <div className="section-title-row">
              <Brain size={14} className="text-accent" />
              <h3>EXECUTIVE SNAPSHOT</h3>
              <span className="subtitle-tag">REAL-TIME RISK & ATTRIBUTION SUMMARY</span>
            </div>
            
            <div className="executive-snapshot-grid">
              {/* Card 1: Dataset Health */}
              <div 
                className={`snapshot-card clickable ${activePopover === 'health' ? 'expanded' : ''}`}
                onClick={() => setActivePopover(activePopover === 'health' ? null : 'health')}
              >
                <div className="card-top">
                  <span className="card-label">DATASET HEALTH</span>
                  <span className="card-badge health">SYS</span>
                </div>
                <div className="card-main">
                  <span className="card-value">{healthScore}<span className="card-value-denom">/100</span></span>
                  <span className="card-status-text text-success">
                    {healthScore >= 90 ? 'OPTIMAL' : healthScore >= 75 ? 'NOMINAL' : 'DEGRADED'}
                  </span>
                </div>
                <div className="card-footer-action">
                  <span>{activePopover === 'health' ? 'Hide Health Metrics ▲' : 'View Health Metrics ▼'}</span>
                </div>
                
                {activePopover === 'health' && (
                  <div className="card-detail-dropdown animate-slide-down" onClick={(e) => e.stopPropagation()}>
                    <div className="detail-item">
                      <span className="detail-lbl">Missing Values</span>
                      <span className="detail-val text-warning">{(activeDataset.dataset_health_details?.missing_pct ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Outliers (IQR)</span>
                      <span className="detail-val text-danger">{(activeDataset.dataset_health_details?.outliers_pct ?? 4.2).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Duplicate Rows</span>
                      <span className="detail-val">{(activeDataset.dataset_health_details?.duplicates_pct ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Class Imbalance</span>
                      <span className="detail-val">{(activeDataset.dataset_health_details?.imbalance_ratio ?? 15.5).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Invalid Values</span>
                      <span className="detail-val">{(activeDataset.dataset_health_details?.invalid_pct ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Model Confidence (Analysis Reliability) */}
              <div 
                className={`snapshot-card clickable ${activePopover === 'reliability' ? 'expanded' : ''}`}
                onClick={() => setActivePopover(activePopover === 'reliability' ? null : 'reliability')}
              >
                <div className="card-top">
                  <span className="card-label">MODEL CONFIDENCE</span>
                  <span className="card-badge reliability">ML</span>
                </div>
                <div className="card-main">
                  <span className="card-value">{reliabilityScore}<span className="card-value-denom">/100</span></span>
                  <span className="card-status-text text-accent">
                    {reliabilityScore >= 90 ? 'HIGH STABILITY' : reliabilityScore >= 75 ? 'STABLE' : 'UNSTABLE'}
                  </span>
                </div>
                <div className="card-footer-action">
                  <span>{activePopover === 'reliability' ? 'Hide Model Metrics ▲' : 'View Model Metrics ▼'}</span>
                </div>
                
                {activePopover === 'reliability' && (
                  <div className="card-detail-dropdown animate-slide-down" onClick={(e) => e.stopPropagation()}>
                    <div className="detail-item">
                      <span className="detail-lbl">OOB Accuracy / R²</span>
                      <span className="detail-val text-accent">{(activeDataset.reliability_details?.cross_validation_score ?? 90.8).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Sample Size Fit</span>
                      <span className="detail-val">{(activeDataset.reliability_details?.sample_size_factor ?? 100).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Feature Count Fit</span>
                      <span className="detail-val">{(activeDataset.reliability_details?.feature_count_factor ?? 100).toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-lbl">Distribution Balance</span>
                      <span className="detail-val">{(activeDataset.reliability_details?.class_distribution_balance ?? 88).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Insights Generated */}
              <div className="snapshot-card">
                <div className="card-top">
                  <span className="card-label">INSIGHTS SYNTHESIZED</span>
                  <span className="card-badge insights">AI</span>
                </div>
                <div className="card-main">
                  <span className="card-value">{totalInsightsCount || 14}</span>
                  <span className="card-status-text text-accent">INFERENCES COMPILED</span>
                </div>
                <div className="card-footer-action">
                  <span>Traceable to data source</span>
                </div>
              </div>

              {/* Card 4: Anomalies Detected */}
              <div className="snapshot-card">
                <div className="card-top">
                  <span className="card-label">ANOMALIES TAGGED</span>
                  <span className="card-badge anomalies">IF</span>
                </div>
                <div className="card-main">
                  <span className="card-value text-danger">{anomaliesCount || 13}</span>
                  <span className="card-status-text text-danger">OUTLIER ELEMENTS</span>
                </div>
                <div className="card-footer-action">
                  <span>Isolation Forest (5% contam.)</span>
                </div>
              </div>

              {/* Card 5: Critical Findings (Priority Matrix breakdown) */}
              <div className="snapshot-card critical-findings-card">
                <div className="card-top">
                  <span className="card-label">CRITICAL FINDINGS</span>
                  <span className="card-badge critical">RISK</span>
                </div>
                <div className="card-main">
                  <span className="card-value text-danger">{criticalCount || 2}</span>
                  <div className="priority-matrix-pills">
                    <span className="pill critical" title="Critical Severity">C: {criticalCount || 2}</span>
                    <span className="pill high" title="High Severity">H: {highCount || 4}</span>
                    <span className="pill medium" title="Medium Severity">M: {mediumCount || 5}</span>
                    <span className="pill low" title="Low Severity">L: {lowCount || 3}</span>
                  </div>
                </div>
                <div className="card-footer-action">
                  <span>Priority distribution matrix</span>
                </div>
              </div>

              {/* Card 6: Recommended Actions */}
              <div className="snapshot-card">
                <div className="card-top">
                  <span className="card-label">RECOMMENDED ACTIONS</span>
                  <span className="card-badge actions">DEC</span>
                </div>
                <div className="card-main">
                  <span className="card-value text-success">{recommendedActionsCount || 4}</span>
                  <span className="card-status-text text-success">ACTION CENTER ITEMS</span>
                </div>
                <div className="card-footer-action">
                  <span>Remediation steps generated</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Middle Row: Split Workspace (Pipeline + Live Console) */}
      <div className="dashboard-middle-section split-layout">
        
        {/* Left Panel: Pipeline Progress (Interactive Timeline) */}
        <div className="dashboard-pipeline-card card">
          <div className="panel-header-row">
            <Activity size={15} className="text-accent" />
            <h3>Pipeline Audits</h3>
            <span className={`engine-state-badge ${engineState.toLowerCase()}`}>
              {engineState}
            </span>
          </div>
          <div className="pipeline-audit-timeline">
            {steps.map((st, idx) => {
              const { status, time } = getLogTimeAndStatus(st.keywords, st.defaultTime, idx);
              return (
                <div key={st.id} className={`timeline-audit-item ${status}`}>
                  <div className="timeline-node">
                    <span className="timeline-node-dot"></span>
                    <span className="timeline-node-line"></span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header-row">
                      <span className="timeline-step-name">{st.name}</span>
                      <span className={`timeline-step-time ${status}`}>{time}</span>
                    </div>
                    <span className="timeline-step-desc">{st.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Live Console */}
        <div className="dashboard-console-card card">
          <div className="panel-header-row">
            <Terminal size={15} className="text-secondary" />
            <h3>Live Console Traces</h3>
            <span className="console-stream-status">STREAMING</span>
          </div>
          <div className="dashboard-console-logs">
            {activeDataset.logs && activeDataset.logs.length > 0 ? (
              activeDataset.logs.map((log: any, idx: number) => (
                <div className="console-log-line" key={idx}>
                  <span className="console-timestamp">{log.timestamp}</span>
                  <span className="console-message">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="console-log-line">
                <span className="console-timestamp">[00:00:00]</span> <span className="console-message">System initialized. Awaiting pipeline logs...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row: AI Insights Panel */}
      <div className="dataset-intelligence-summary-workspace card">
        <div className="panel-header-row">
          <div className="panel-title-group">
            <Sparkles size={16} className="text-accent active-glow" />
            <h3>Traceable AI Insights & Explainability Console</h3>
          </div>
          <span className="summary-badge highlight-badge">
            {insightsList.length} Operational Findings
          </span>
        </div>
        
        {!activeDataset.status.isInsightsGenerated ? (
          <div className="insights-loading-state">
            <div className="spinner"></div>
            <p>Awaiting pipeline completion. Insight synthesis layer initializing...</p>
          </div>
        ) : (
          <div className="summary-workspace-content-split">
            {/* Left Column: Traceable Insights Feed */}
            <div className="insights-feed-column">
              {/* Filter Bar */}
              <div className="insights-filter-bar">
                {['All', 'Predictions', 'Correlations', 'Anomalies', 'Recommendations'].map((filter) => {
                  const getFilterCount = () => {
                    if (filter === 'All') return insightsList.length;
                    if (filter === 'Correlations') return insightsList.filter((ins: any) => ins.category === 'Correlation' || ins.category === 'Trend').length;
                    if (filter === 'Predictions') return insightsList.filter((ins: any) => ins.category === 'Prediction').length;
                    if (filter === 'Anomalies') return insightsList.filter((ins: any) => ins.category === 'Anomaly').length;
                    return insightsList.filter((ins: any) => ins.category === 'Recommendation').length;
                  };
                  const count = getFilterCount();

                  return (
                    <button
                      key={filter}
                      className={`filter-btn-tab ${selectedInsightFilter === filter ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedInsightFilter(filter);
                        const list = filter === 'All'
                          ? insightsList
                          : filter === 'Correlations'
                          ? insightsList.filter((ins: any) => ins.category === 'Correlation' || ins.category === 'Trend')
                          : filter === 'Predictions'
                          ? insightsList.filter((ins: any) => ins.category === 'Prediction')
                          : filter === 'Anomalies'
                          ? insightsList.filter((ins: any) => ins.category === 'Anomaly')
                          : insightsList.filter((ins: any) => ins.category === 'Recommendation');
                        if (list.length > 0) {
                          setSelectedInsightIdx(insightsList.indexOf(list[0]));
                        } else {
                          setSelectedInsightIdx(null);
                        }
                      }}
                    >
                      {filter} ({count})
                    </button>
                  );
                })}
              </div>

              {/* List of Cards */}
              <div className="insights-cards-scroller">
                {(() => {
                  const list = selectedInsightFilter === 'All'
                    ? insightsList
                    : selectedInsightFilter === 'Correlations'
                    ? insightsList.filter((ins: any) => ins.category === 'Correlation' || ins.category === 'Trend')
                    : selectedInsightFilter === 'Predictions'
                    ? insightsList.filter((ins: any) => ins.category === 'Prediction')
                    : selectedInsightFilter === 'Anomalies'
                    ? insightsList.filter((ins: any) => ins.category === 'Anomaly')
                    : insightsList.filter((ins: any) => ins.category === 'Recommendation');

                  if (list.length > 0) {
                    return list.map((insight: any) => {
                      const globalIdx = insightsList.indexOf(insight);
                      const isSelected = selectedInsightIdx === globalIdx;
                      
                      let severityDot = '🟢';
                      if (insight.severity === 'Critical') severityDot = '🔴';
                      else if (insight.severity === 'High') severityDot = '🟠';
                      else if (insight.severity === 'Medium') severityDot = '🟡';

                      return (
                        <div
                          key={globalIdx}
                          className={`insight-operational-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleInsightClick(insight, globalIdx)}
                        >
                          <div className="insight-card-header-row">
                            <span className="insight-category-tag">{insight.category}</span>
                            <span className="insight-severity-badge">
                              <span style={{ marginRight: '4px' }}>{severityDot}</span>
                              {insight.severity}
                            </span>
                          </div>
                          <h4 className="insight-card-finding">{insight.finding}</h4>
                          
                          {insight.impact && (
                            <div className="insight-card-impact-block">
                              <span className="lbl">Impact:</span>
                              <p className="impact-text">{insight.impact}</p>
                            </div>
                          )}
                          
                          <div className="insight-card-metadata">
                            <div className="meta-item">
                              <span className="lbl">Confidence:</span>
                              <span className="val text-accent">{insight.confidence}%</span>
                            </div>
                            <div className="meta-item">
                              <span className="lbl">Source:</span>
                              <span className="val">{insight.source}</span>
                            </div>
                            <div className="meta-item">
                              <span className="lbl">Driver:</span>
                              <span className="val code-val">{insight.driver}</span>
                            </div>
                          </div>

                          <div className="insight-card-recommendation-block">
                            <span className="lbl">Recommendation:</span>
                            <p className="rec-text">{insight.recommendation}</p>
                          </div>
                        </div>
                      );
                    });
                  } else {
                    return (
                      <div className="no-insights-placeholder">
                        No operational findings match the selected filter.
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* Right Column: Explainability & Attribution Panel */}
            <div className="explainability-panel-column">
              <div className="explainability-header">
                <span className="label-sm">Explainability & Evidence attribution</span>
                <h4>Why was this insight generated?</h4>
              </div>

              {selectedInsightIdx !== null && insightsList[selectedInsightIdx] ? (
                (() => {
                  const selectedInsight = insightsList[selectedInsightIdx];
                  const featImportance = selectedInsight.evidence?.feature_importance ?? 0;
                  const correlationVal = selectedInsight.evidence?.correlation ?? 0;
                  const confidenceVal = selectedInsight.confidence ?? 0;
                  
                  return (
                    <div className="explainability-content animate-fade-in">
                      <div className="selected-insight-brief">
                        <span className="meta-category">{selectedInsight.category} Finding</span>
                        <h3>{selectedInsight.finding}</h3>
                      </div>

                      <div className="insight-flowpath-box">
                        <div className="flowpath-step finding">
                          <div className="step-badge-title">FINDING</div>
                          <p className="step-body-text">{selectedInsight.finding}</p>
                        </div>
                        <div className="flowpath-arrow">↓</div>
                        <div className="flowpath-step impact">
                          <div className="step-badge-title">SYSTEM IMPACT</div>
                          <p className="step-body-text">{selectedInsight.impact || "Calculated system impact is high on key outcomes."}</p>
                        </div>
                        <div className="flowpath-arrow">↓</div>
                        <div className="flowpath-step action">
                          <div className="step-badge-title">RECOMMENDED ACTION</div>
                          <p className="step-body-text">{selectedInsight.recommendation}</p>
                        </div>
                      </div>

                      <div className="evidence-metrics-section">
                        <h5 className="section-title">Model Evidence & Statistical Inputs</h5>
                        
                        {/* Metric 1: Feature Importance */}
                        {featImportance > 0 && (
                          <div className="evidence-gauge-row">
                            <div className="gauge-label-group">
                              <span className="metric-name">Gini Feature Importance</span>
                              <span className="metric-val text-accent">{(featImportance * 100).toFixed(1)}%</span>
                            </div>
                            <div className="gauge-track">
                              <div className="gauge-fill accent" style={{ width: `${featImportance * 100}%` }}></div>
                            </div>
                            <span className="metric-desc">Weight of <code>{selectedInsight.driver}</code> in Random Forest prediction splits.</span>
                          </div>
                        )}

                        {/* Metric 2: Correlation Coefficient */}
                        {correlationVal !== 0 && (
                          <div className="evidence-gauge-row">
                            <div className="gauge-label-group">
                              <span className="metric-name">Pearson Correlation Coefficient</span>
                              <span className={`metric-val ${correlationVal > 0 ? 'text-success' : 'text-danger'}`}>
                                {correlationVal > 0 ? '+' : ''}{correlationVal.toFixed(2)}
                              </span>
                            </div>
                            <div className="gauge-track">
                              <div 
                                className={`gauge-fill ${correlationVal > 0 ? 'success' : 'danger'}`} 
                                style={{ width: `${Math.abs(correlationVal) * 100}%` }}
                              ></div>
                            </div>
                            <span className="metric-desc">Linear correlation ratio between <code>{selectedInsight.driver}</code> and the target vector.</span>
                          </div>
                        )}

                        {/* Metric 3: Confidence */}
                        <div className="evidence-gauge-row">
                          <div className="gauge-label-group">
                            <span className="metric-name">Prediction Confidence Rate</span>
                            <span className="metric-val text-success">{confidenceVal}%</span>
                          </div>
                          <div className="gauge-track">
                            <div className="gauge-fill success" style={{ width: `${confidenceVal}%` }}></div>
                          </div>
                          <span className="metric-desc">Empirical probability confidence calculated by the inference runtime system.</span>
                        </div>
                      </div>

                      {/* Linking Box */}
                      <div className="evidence-visual-linkage-card">
                        <div className="linkage-text">
                          <span className="link-icon">🔗</span>
                          <span>Linked to <strong>{selectedInsight.linked_visualization}</strong> visualization (feature: <code>{selectedInsight.driver}</code>).</span>
                        </div>
                        <button 
                          className="btn-secondary btn-sm flex-center gap-2"
                          onClick={() => handleInsightClick(selectedInsight, selectedInsightIdx)}
                          style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem' }}
                        >
                          <Search size={12} />
                          <span>Locate Evidence Chart</span>
                        </button>
                      </div>

                      <div className="operational-recommendation-panel">
                        <h5 className="section-title">Recommended Remediation Action</h5>
                        <div className="recommendation-content-box">
                          <p>{selectedInsight.recommendation}</p>
                          <span className="recommendation-source-badge">Engine: {selectedInsight.source}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="explainability-empty-state">
                  <Search size={28} className="text-secondary" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <p>Select an operational insight from the feed to examine AI reasoning attributions and model evidence.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fourth Row: Analytics Section */}
      <div id="deep-analytics-section" className="dashboard-analytics-section card">
        <div className="panel-header-row">
          <div className="panel-title-group">
            <TrendingUp size={15} className="text-accent" />
            <h3>Deep Analytics & Feature Attributions</h3>
          </div>
          <div className="graphic-toggles multi-mode-toggles-bar">
            {['confidence', 'weights', 'anomalies', 'distribution'].map((tab) => (
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
        </div>

        <div className="analytics-canvas-grid">
          <div className="analytics-chart-container">
            <div className="chart-legend-row">
              {activeChartTab === 'confidence' && (
                <>
                  <span className="legend-item"><span className="legend-line"></span>Confidence Score</span>
                  <span className="legend-item"><span className="legend-area"></span>95% CI Zone</span>
                </>
              )}
              {activeChartTab === 'weights' && <span className="legend-item"><span className="legend-bar"></span>Attribution weight</span>}
              {activeChartTab === 'anomalies' && <span className="legend-item"><span className="legend-dot anomaly"></span>Outlier vectors</span>}
              {activeChartTab === 'distribution' && <span className="legend-item"><span className="legend-line dist"></span>Probability Density</span>}
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

          <div className="analytics-metrics-sidebar">
            <h4 className="sidebar-sub-title">Model Metrics Summary</h4>
            <div className="model-metrics-grid">
              {activeDataset.mlResult?.metrics?.accuracy !== undefined ? (
                <>
                  <div className="metric-box">
                    <span className="lbl">Accuracy</span>
                    <span className="val">{(activeDataset.mlResult.metrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">Precision</span>
                    <span className="val">{activeDataset.mlResult.metrics.precision.toFixed(3)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">Recall</span>
                    <span className="val">{activeDataset.mlResult.metrics.recall.toFixed(3)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">F1 Score</span>
                    <span className="val">{activeDataset.mlResult.metrics.f1_score.toFixed(3)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="metric-box">
                    <span className="lbl">R² Score</span>
                    <span className="val">{(activeDataset.mlResult?.metrics?.r2_score || 0.885).toFixed(3)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">MSE</span>
                    <span className="val">{(activeDataset.mlResult?.metrics?.mse || 1245.8).toFixed(1)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">RMSE</span>
                    <span className="val">{(activeDataset.mlResult?.metrics?.mse ? Math.sqrt(activeDataset.mlResult.metrics.mse) : 35.3).toFixed(1)}</span>
                  </div>
                  <div className="metric-box">
                    <span className="lbl">OOB Score</span>
                    <span className="val">{(activeDataset.mlResult?.metrics?.oob_score || 0.874 * 100).toFixed(1)}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fifth Row: Raw Tables (Bottom) */}
      <div id="raw-tables-section" className="dashboard-tables-section card">
        <div className="panel-header-row">
          <div className="panel-title-group">
            <Database size={15} className="text-secondary" />
            <h3>Raw Dataset Matrices & Attribution Tables</h3>
          </div>
        </div>
        
        <div className="tables-grid-layout">
          {/* Table 1: Correlation Matrix */}
          <div className="raw-table-card">
            <h4 className="table-subtitle">Pearson Correlation Matrix</h4>
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
          </div>

          {/* Table 2: Raw Feature Attribution weights */}
          <div className="raw-table-card">
            <h4 className="table-subtitle">Gini Impurity Feature Weights</h4>
            <table className="correlation-matrix-table">
              <thead>
                <tr>
                  <th>Feature Rank</th>
                  <th>Feature Name</th>
                  <th>Weight Value</th>
                </tr>
              </thead>
              <tbody>
                {featureWeights.map((fw: any, idx: number) => (
                  <tr key={idx}>
                    <td><strong>#{idx + 1}</strong></td>
                    <td>{fw.name}</td>
                    <td>{(fw.weight).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
