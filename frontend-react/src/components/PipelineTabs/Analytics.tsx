import { useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, Download } from 'lucide-react';
import api from '../../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import './PipelineTabs.css';

interface AnalyticsProps {
  activeDataset: any;
  onAnalyzed: (id: string, data: any) => void;
  onGenerateReport?: () => void;
}

export function Analytics({ activeDataset, onAnalyzed, onGenerateReport }: AnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [quickInsight, setQuickInsight] = useState<string | null>(null);
  const [typedQuickInsight, setTypedQuickInsight] = useState('');
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);

  const data = activeDataset?.analyticsData || null;

  const generateQuickInsight = useCallback(async (analyticsData: any) => {
    setIsGeneratingQuick(true);
    try {
      const response = await api.post('/generate-insights', {
        analysis_data: analyticsData,
        context: 'You are an AI data assistant. Provide a single, punchy 1-2 line summary of the most interesting pattern in this dataset. Be very concise and do not use bullet points.'
      });
      const rawInsights = response.data.insights;
      let text = '';
      if (Array.isArray(rawInsights)) {
        text = rawInsights.map(ins => ins.finding || String(ins)).join('\n');
      } else if (typeof rawInsights === 'string') {
        text = rawInsights;
      } else if (rawInsights && typeof rawInsights === 'object') {
        text = rawInsights.insights || JSON.stringify(rawInsights);
      } else {
        text = 'No insights generated.';
      }

      setQuickInsight(text);
      
      let i = 0;
      setTypedQuickInsight('');
      const interval = setInterval(() => {
        setTypedQuickInsight(() => text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 5);
    } catch (error) {
      console.error("Failed to generate quick insight:", error);
      setQuickInsight('Failed to generate quick insights.');
      setTypedQuickInsight('Failed to generate quick insights.');
    } finally {
      setIsGeneratingQuick(false);
    }
  }, []);

  useEffect(() => {
    if (data && !quickInsight && !isGeneratingQuick) {
      generateQuickInsight(data);
    } else if (!data) {
      setQuickInsight(null);
      setTypedQuickInsight('');
    }
  }, [data, generateQuickInsight, isGeneratingQuick, quickInsight]);

  const renderCorrelationMatrix = (matrix: any) => {
    if (!matrix) return null;
    const cols = Object.keys(matrix);
    return (
      <div className="correlation-heatmap" style={{ overflowX: 'auto', marginTop: '1rem', paddingBottom: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Feature</th>
              {cols.map(c => <th key={c} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{c.substring(0,10)}</th>)}
            </tr>
          </thead>
          <tbody>
            {cols.map(row => (
              <tr key={row}>
                <td style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>{row}</td>
                {cols.map(col => {
                  const val = matrix[row][col];
                  if (val === null || val === undefined) return <td key={col} style={{ border: '1px solid var(--border-color)' }}>-</td>;
                  const absVal = Math.abs(val);
                  
                  // Muted blue/red colors matching dark mode
                  const bgColor = val > 0 
                    ? `rgba(244, 63, 94, ${absVal * 0.4})` 
                    : `rgba(6, 182, 212, ${absVal * 0.4})`;
                  
                  return (
                    <td key={col} style={{ backgroundColor: bgColor, border: '1px solid var(--border-color)', padding: '0.5rem', color: 'var(--text-primary)', fontWeight: absVal > 0.5 ? 'bold' : 'normal' }}>
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const runAnalytics = async () => {
    if (!activeDataset) return;
    setIsLoading(true);

    const fileObj = (activeDataset as any).rawFile;
    if (!fileObj) {
      alert("No raw file reference available for this dataset.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileObj);

    try {
      const response = await api.post('/analyze-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onAnalyzed(activeDataset.id, response.data);
    } catch (error) {
      console.error('Analytics failed', error);
      alert('Analytics failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoricalChart = (feat: string, info: any) => {
    const chartData = Object.entries(info.top_values).map(([name, value]) => ({ name, value }));
    const COLORS = ['#D4AF37', '#B8894D', '#A27B38', '#8C6228', '#C9C4B8'];

    return (
      <div key={feat} className="stat-chart-container card">
        <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>📌 {feat} — {info.unique_count} unique values</h4>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.015)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)', fontSize: '11px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={16}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Helper calculations for metrics dashboard
  const numericCols = data && data.descriptive_statistics ? Object.keys(data.descriptive_statistics) : [];
  const totalRows = data && data.descriptive_statistics && numericCols.length > 0 ? (data.descriptive_statistics[numericCols[0]]['count'] || 0) : 0;
  const catCols = data && data.categorical_summaries ? Object.keys(data.categorical_summaries) : [];

  const topCorrelation = (() => {
    if (!data || !data.correlation_matrix) return 'None';
    const cols = Object.keys(data.correlation_matrix);
    let maxVal = 0;
    let maxPair = '';
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const c1 = cols[i];
        const c2 = cols[j];
        const val = Math.abs(data.correlation_matrix[c1][c2] || 0);
        if (val > maxVal && val < 0.99) {
          maxVal = val;
          maxPair = `${c1} / ${c2} (${data.correlation_matrix[c1][c2] > 0 ? '+' : ''}${data.correlation_matrix[c1][c2].toFixed(2)})`;
        }
      }
    }
    return maxPair || 'None';
  })();

  if (!activeDataset) {
    return (
      <div className="tab-pane placeholder-tab card">
        <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <h3>No active dataset selected</h3>
        <p>Go to the Data Manager and upload or select a dataset first.</p>
      </div>
    );
  }

  return (
    <div className="tab-pane animate-fade-in">
      <div className="view-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Deep Exploratory Data Analytics</h2>
        <p>Auto-generate descriptive statistics, correlation heatmaps, and distributions for features in {activeDataset.name}.</p>
      </div>

      {!activeDataset.status.isProcessed ? (
        <div className="warning-banner card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid var(--warning)' }}>
          <AlertCircle className="text-warning" size={20} />
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Preprocessing Required</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Please go to the Data Manager and run the preprocessing pipeline before generating analytics reports.</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary run-btn" 
              onClick={runAnalytics}
              disabled={isLoading}
              style={{ width: 'fit-content', padding: '0.6rem 1.5rem !important', marginTop: '0', fontSize: '0.88rem' }}
            >
              {isLoading ? 'Analyzing...' : '📊 Generate Full Analytics Report'}
            </button>
            {data && onGenerateReport && (
              <button 
                className="btn-secondary" 
                onClick={onGenerateReport}
                style={{ 
                  width: 'fit-content', 
                  padding: '0.6rem 1.5rem', 
                  fontSize: '0.88rem', 
                  border: '1px solid var(--border-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  borderRadius: '0.4rem', 
                  background: 'transparent', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Download size={14} />
                <span>Generate Intelligence Report</span>
              </button>
            )}
          </div>

          {data && (
            <div className="dataset-intelligence-summary-box card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1.75rem', background: 'var(--accent-light)', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent-color)', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', width: '100%' }}>
               <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--accent-color)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                  <Sparkles size={20} /> DATASET INTELLIGENCE SUMMARY
               </h4>
               {isGeneratingQuick && !quickInsight ? (
                 <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.95rem' }} className="pulse-text">Analyzing statistical patterns...</p>
               ) : (
                 <div style={{ lineHeight: 1.7, fontSize: '0.98rem', color: 'var(--text-primary)', fontWeight: '400' }}>
                   {typedQuickInsight.split('\n').map((para, pIdx) => (
                     <p key={pIdx} style={{ marginBottom: '0.75rem' }}>{para}</p>
                   ))}
                   <span className="cursor-blink">|</span>
                 </div>
               )}
            </div>
          )}

          {data && (
            <div className="analytics-key-metrics card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.005)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Statistical Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Observations (Rows)</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{totalRows.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Continuous Features</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{numericCols.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Categorical Features</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{catCols.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Strongest Linear Link</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-color)', marginTop: '0.35rem' }}>{topCorrelation}</span>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="analytics-results animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {data.correlation_matrix && (
                <div>
                  <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: 0 }}>CORRELATION HEATMAP</div>
                  <div className="card" style={{ padding: '0.75rem' }}>
                     {renderCorrelationMatrix(data.correlation_matrix)}
                  </div>
                </div>
              )}

              {data.categorical_summaries && Object.keys(data.categorical_summaries).length > 0 && (
                <div>
                  <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: 0 }}>CATEGORICAL FEATURE SUMMARIES</div>
                  <div className="charts-grid">
                    {Object.entries(data.categorical_summaries).map(([feat, info]) => renderCategoricalChart(feat, info as any))}
                  </div>
                </div>
              )}

              <div>
                <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: 0 }}>DESCRIPTIVE STATISTICS</div>
                <div className="preview-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Stat</th>
                        {Object.keys(data.descriptive_statistics).map(col => <th key={col}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(stat => (
                        <tr key={stat}>
                          <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{stat}</td>
                          {Object.keys(data.descriptive_statistics).map(col => {
                            const val = data.descriptive_statistics[col][stat];
                            return (
                              <td key={col}>
                                {typeof val === 'number' ? val.toFixed(2) : (val !== null && val !== undefined ? String(val) : '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
