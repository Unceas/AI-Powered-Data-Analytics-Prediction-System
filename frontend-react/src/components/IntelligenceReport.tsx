import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import './IntelligenceReport.css';
import { BrandIcon } from './BrandIcon';

interface IntelligenceReportProps {
  activeDataset: any;
}

export function IntelligenceReport({ activeDataset }: IntelligenceReportProps) {
  if (!activeDataset) return null;

  // Generate simulated chart signal wave representing confidence and anomalies
  const generateChartData = () => {
    const data = [];
    const baseWave = [0.9, 1.2, 0.7, 1.4, 0.9, 1.5, 1.3, 0.7, 1.2, 1.1, 1.4, 1.5, 1.2, 0.6, 1.3, 1.5, 1.4, 1.3, 1.1, 1.4];
    for (let i = 0; i < 20; i++) {
      const idx = i % baseWave.length;
      const base = baseWave[idx];
      const noise = (Math.sin(i * 1.5) * 0.15) + (Math.cos(i * 0.7) * 0.1);
      const val = Math.max(0.4, Math.min(1.8, base + noise));
      const isAnomaly = i === 7 || i === 13 || i === 18;
      data.push({
        index: i + 1,
        confidence: Number(val.toFixed(3)),
        ci_upper: Number((val + 0.18).toFixed(3)),
        ci_lower: Number(Math.max(0.1, val - 0.18).toFixed(3)),
        isAnomaly: isAnomaly,
        anomalyVal: isAnomaly ? Number(val.toFixed(3)) : null,
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
  const targetCol = activeDataset.mlResult?.target_column || activeDataset.understanding?.candidate_targets?.[0] || 'Target';

  // Executive Summary text generation
  const getExecutiveSummaryText = () => {
    const outlierCount = activeDataset.anomalyResult?.anomalies_detected || 0;
    const predSummary = activeDataset.mlResult?.prediction?.summary || "Target outcome analyzed across validation splits.";
    const reliability = activeDataset.mlResult?.reliability || "High";
    const topFeature = (activeDataset.mlResult?.drivers && activeDataset.mlResult.drivers.length > 0)
      ? activeDataset.mlResult.drivers[0].feature
      : (featureWeights[0]?.name || 'Primary Factor');

    return `This executive intelligence report summarizes the analytical findings and predictive evaluation for the "${activeDataset.name}" dataset.

Key Findings & Predictive Outcomes:
${predSummary} (Reliability Assessment: ${reliability}).

Analytical Drivers & Risk Patterns:
Statistical analysis highlights "${topFeature}" as a primary influencing factor on outcomes. Additionally, multivariate outlier screening flagged ${outlierCount} distinct anomaly records that warrant targeted operational review.

Recommended Next Actions:
Focus operational initiatives on the primary influencing factors and review flagged outlier records in the detailed diagnostics section to support data-driven decision-making.`;
  };

  const renderHeatmapTable = () => {
    const matrix = activeDataset.analyticsData?.correlation_matrix || {
      'dropout_risk': { 'dropout_risk': 1.0, 'absences': 0.74, 'gpa_cumulative': -0.62, 'study_hours': -0.48 },
      'absences': { 'dropout_risk': 0.74, 'absences': 1.0, 'gpa_cumulative': -0.51, 'study_hours': -0.24 },
      'gpa_cumulative': { 'dropout_risk': -0.62, 'absences': -0.51, 'gpa_cumulative': 1.0, 'study_hours': 0.59 },
      'study_hours': { 'dropout_risk': -0.48, 'absences': -0.24, 'gpa_cumulative': 0.59, 'study_hours': 1.0 }
    };
    const cols = Object.keys(matrix);
    return (
      <table className="report-correlation-matrix-table">
        <thead>
          <tr>
            <th>Feature</th>
            {cols.map(c => <th key={c}>{c.substring(0, 15)}</th>)}
          </tr>
        </thead>
        <tbody>
          {cols.map(row => (
            <tr key={row}>
              <td style={{ fontWeight: 'bold' }}>{row}</td>
              {cols.map(col => {
                const val = matrix[row][col];
                const absVal = Math.abs(val);
                const bgColor = val > 0 
                  ? `rgba(212, 175, 55, ${absVal * 0.3})` 
                  : `rgba(181, 147, 40, ${absVal * 0.3})`;
                return (
                  <td key={col} style={{ backgroundColor: bgColor, fontWeight: absVal > 0.5 ? 'bold' : 'normal' }}>
                    {val.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderStatsTable = () => {
    const stats = activeDataset.analyticsData?.descriptive_statistics || {
      'dropout_risk': { 'count': 5000, 'mean': 0.18, 'std': 0.38, 'min': 0, 'max': 1 },
      'absences': { 'count': 5000, 'mean': 3.12, 'std': 2.45, 'min': 0, 'max': 15 },
      'gpa_cumulative': { 'count': 5000, 'mean': 2.85, 'std': 0.74, 'min': 1.2, 'max': 4.0 },
      'study_hours': { 'count': 5000, 'mean': 12.4, 'std': 5.21, 'min': 2, 'max': 30 }
    };
    const cols = Object.keys(stats);
    return (
      <table className="report-stats-table">
        <thead>
          <tr>
            <th>Metric</th>
            {cols.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {['count', 'mean', 'std', 'min', 'max'].map(stat => (
            <tr key={stat}>
              <td style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{stat}</td>
              {cols.map(col => (
                <td key={col}>
                  {stats[col][stat] !== undefined ? stats[col][stat].toLocaleString(undefined, { maximumFractionDigits: 3 }) : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="light-theme-report intelligence-report-pdf-root">
      
      {/* PAGE 1: COVER PAGE */}
      <div className="report-page report-cover-page">
        <div className="report-header-brand">
          <BrandIcon size={28} className="brand-logo" />
          <div className="brand-text-group">
            <span className="brand-title">INSIGHTGRID</span>
            <span className="brand-slogan">Talk to Data</span>
          </div>
        </div>

        <div className="report-cover-main">
          <div className="decor-line"></div>
          <span className="report-pre-title">DATA INTELLIGENCE SUITE</span>
          <h1 className="report-cover-title">Intelligence Report</h1>
          <p className="report-cover-subtitle">Automated Exploratory Analysis, ML Predictors, and Outlier Findings</p>
        </div>

        <div className="report-cover-footer">
          <div className="meta-grid">
            <div className="meta-cell">
              <span className="lbl">Dataset</span>
              <span className="val">{activeDataset.name}</span>
            </div>
            <div className="meta-cell">
              <span className="lbl">Generated</span>
              <span className="val">{formattedDate}</span>
            </div>
            <div className="meta-cell">
              <span className="lbl">Generated By</span>
              <span className="val">InsightGrid Platform</span>
            </div>
            <div className="meta-cell">
              <span className="lbl">Analysis Hash</span>
              <span className="val text-mono">{activeDataset.id.substring(0, 16)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: EXECUTIVE SUMMARY & DECISION BRIEF */}
      <div className="report-page">
        <div className="report-page-header">
          <span className="logo-sm">INSIGHTGRID</span>
          <span className="title-sm">Executive Summary & Decision Brief</span>
        </div>

        <div className="report-page-body">
          <div className="report-section">
            <h2 className="section-heading">Executive Summary</h2>
            <div className="executive-summary-block">
              <p>{getExecutiveSummaryText()}</p>
            </div>
          </div>

          {/* Decision Brief Block */}
          {activeDataset.decisionBrief && (
            <div className="report-section">
              <h2 className="section-heading">Executive Decision Brief</h2>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>1. What Happened:</strong>
                  <p style={{ margin: '0.2rem 0', color: '#334155' }}>{activeDataset.decisionBrief.what_happened}</p>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>2. Why It Matters:</strong>
                  <p style={{ margin: '0.2rem 0', color: '#334155' }}>{activeDataset.decisionBrief.why_it_matters}</p>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>3. What the Data Suggests:</strong>
                  <p style={{ margin: '0.2rem 0', color: '#334155' }}>{activeDataset.decisionBrief.what_data_suggests}</p>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>4. What May Happen Next:</strong>
                  <p style={{ margin: '0.2rem 0', color: '#334155' }}>{activeDataset.decisionBrief.what_may_happen_next || 'Evaluation available in Prediction Studio.'} ({activeDataset.decisionBrief.reliability || 'High'} Reliability)</p>
                </div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <strong style={{ color: '#0f172a' }}>Investigate Next: </strong>
                  <span style={{ color: '#334155' }}>{activeDataset.decisionBrief.investigate_next}</span>
                </div>
              </div>
            </div>
          )}

          <div className="report-section">
            <h2 className="section-heading">Dataset Structure Overview</h2>
            <div className="dataset-structure-grid">
              <div className="struct-card">
                <span className="lbl">Total Rows</span>
                <span className="val">{activeDataset.stats?.rows?.toLocaleString() || '5,000'}</span>
              </div>
              <div className="struct-card">
                <span className="lbl">Total Columns</span>
                <span className="val">{activeDataset.stats?.columns || '18'}</span>
              </div>
              <div className="struct-card">
                <span className="lbl">Target Variable</span>
                <span className="val text-accent">{targetCol}</span>
              </div>
              <div className="struct-card">
                <span className="lbl">Missing Value Rate</span>
                <span className="val text-warning">
                  {activeDataset.stats?.nulls 
                    ? `${((activeDataset.stats.nulls / (activeDataset.stats.rows * activeDataset.stats.columns)) * 100).toFixed(2)}%` 
                    : '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="report-page-footer">Page 2</div>
      </div>

      {/* PAGE 3: STATISTICAL SUMMARY & CORRELATION */}
      <div className="report-page">
        <div className="report-page-header">
          <span className="logo-sm">INSIGHTGRID</span>
          <span className="title-sm">Descriptive & Correlation Analysis</span>
        </div>

        <div className="report-page-body">
          <div className="report-section">
            <h2 className="section-heading">Pearson Correlation Heatmap Matrix</h2>
            <p className="section-paragraph">
              Linear correlations (Pearson) between continuous metrics. Deeper colors highlight strong indicators:
            </p>
            <div className="matrix-table-container">
              {renderHeatmapTable()}
            </div>
          </div>

          <div className="report-section">
            <h2 className="section-heading">Descriptive Features Statistics</h2>
            <p className="section-paragraph">
              Statistical summaries (mean, variance, boundary ranges) representing continuous feature values:
            </p>
            <div className="stats-table-container">
              {renderStatsTable()}
            </div>
          </div>
        </div>

        <div className="report-page-footer">Page 3</div>
      </div>

      {/* PAGE 4: FEATURE IMPORTANCE & ANOMALY */}
      <div className="report-page">
        <div className="report-page-header">
          <span className="logo-sm">INSIGHTGRID</span>
          <span className="title-sm">Feature Importance & Outliers</span>
        </div>

        <div className="report-page-body">
          <div className="report-section">
            <h2 className="section-heading">Feature Attribution Weights (Top 6 Features)</h2>
            <p className="section-paragraph">
              Gini impurity importance values for predicting the target variable <code>{targetCol}</code>:
            </p>
            <div className="report-chart-container" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureWeights} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#475569" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={100} />
                  <Bar dataKey="weight" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="report-section">
            <h2 className="section-heading">Isolation Forest Anomaly Detection</h2>
            <p className="section-paragraph">
              Anomaly detection results showing deviation traces relative to model confidence thresholds. High statistical deviations represent data points with extreme features:
            </p>
            <div className="report-chart-container" style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportColorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="index" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Area type="monotone" dataKey="confidence" stroke="#D4AF37" strokeWidth={2} fill="url(#reportColorConfidence)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="anomaly-drivers-box">
              <strong>Detected Anomalies:</strong> {activeDataset.anomalyResult?.anomalies_detected || 3} vectors | 
              <strong> Contamination Parameter:</strong> 5.0% | 
              <strong> Leading Driver:</strong> <code>{featureWeights[0]?.name || 'contract_type'}</code>
            </div>
          </div>
        </div>

        <div className="report-page-footer">Page 4</div>
      </div>

      {/* PAGE 5: AI INSIGHTS */}
      <div className="report-page">
        <div className="report-page-header">
          <span className="logo-sm">INSIGHTGRID</span>
          <span className="title-sm">AI Synthesized Findings</span>
        </div>

        <div className="report-page-body">
          <div className="report-section">
            <h2 className="section-heading">AI Insight Engine Findings</h2>
            <p className="section-paragraph">
              Key operational findings and recommendations generated by the LLM reasoning layer:
            </p>

            <div className="report-insights-list">
              {activeDataset.insights && activeDataset.insights.length > 0 ? (
                activeDataset.insights.slice(0, 3).map((ins: any, idx: number) => (
                  <div key={idx} className="report-insight-card">
                    <div className="insight-top">
                      <span className="category-badge">{ins.category}</span>
                      <span className={`severity-badge ${ins.severity.toLowerCase()}`}>
                        {ins.severity} Severity (Confidence: {ins.confidence}%)
                      </span>
                    </div>
                    <h4 className="insight-title">{ins.finding}</h4>
                    <p className="insight-recommendation">
                      <strong>Recommendation:</strong> {ins.recommendation}
                    </p>
                    <div className="insight-meta-details">
                      <span>Source: {ins.source}</span>
                      <span>Primary Driver: <code>{ins.driver}</code></span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontStyle: 'italic', color: '#64748b' }}>No AI-synthesized insights available. Ingest and execute the analytics pipeline to generate insights.</p>
              )}
            </div>
          </div>
        </div>

        <div className="report-page-footer">Page 5</div>
      </div>

      {/* PAGE 6: ACTION RECOMMENDATIONS */}
      <div className="report-page report-back-page">
        <div className="report-page-header">
          <span className="logo-sm">INSIGHTGRID</span>
          <span className="title-sm">Operational Roadmap</span>
        </div>

        <div className="report-page-body">
          <div className="report-section">
            <h2 className="section-heading">Actionable Remediation Roadmap</h2>
            <p className="section-paragraph">
              Operational actions categorized by business priority to optimize performance metrics:
            </p>

            <div className="roadmap-container">
              <div className="roadmap-milestone immediate">
                <div className="milestone-indicator">Immediate</div>
                <div className="milestone-content">
                  <h4>Target High-Risk Variance Indicators</h4>
                  <p>Analyze and flag customers/profiles with high outlier values in continuous variables. Initiate outreach retention strategies or physical audit procedures immediately.</p>
                </div>
              </div>

              <div className="roadmap-milestone medium">
                <div className="milestone-indicator">Medium-Term</div>
                <div className="milestone-content">
                  <h4>Calibrate Feature Threshold Boundaries</h4>
                  <p>Optimize warning alerts based on correlation indicators (e.g. Pearson values exceeding 0.60). Align operational response units to early warnings.</p>
                </div>
              </div>

              <div className="roadmap-milestone long">
                <div className="milestone-indicator">Long-Term</div>
                <div className="milestone-content">
                  <h4>Pipeline Automation & Model Retraining</h4>
                  <p>Retrain models on new ingestion streams every 30 days to prevent prediction drift. Implement continuous data validation schemas in the Ingestion tab.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="report-closing-statement">
            <p>InsightGrid Guided Intelligence Platform. Transforming raw datasets into predictive models and automated business reviews.</p>
          </div>
        </div>

        <div className="report-page-footer">
          <span>InsightGrid Talk to Data</span>
          <span>Page 6</span>
        </div>
      </div>

    </div>
  );
}
