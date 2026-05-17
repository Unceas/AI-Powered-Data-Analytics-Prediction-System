import { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
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
  file: File;
  onAnalyzed: (data: any) => void;
  cachedData: any;
  onInsightsGenerated?: () => void;
}

export function Analytics({ file, onAnalyzed, cachedData, onInsightsGenerated }: AnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(cachedData);
  const [quickInsight, setQuickInsight] = useState<string | null>(null);
  const [typedQuickInsight, setTypedQuickInsight] = useState('');
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false);

  useEffect(() => {
    setData(cachedData);
  }, [cachedData]);

  const generateQuickInsight = useCallback(async (analyticsData: any) => {
    setIsGeneratingQuick(true);
    try {
      const response = await api.post('/generate-insights', {
        analysis_data: analyticsData,
        context: 'You are an AI data assistant. Provide a single, punchy 1-2 line summary of the most interesting pattern in this dataset. Be very concise and do not use bullet points.'
      });
      const text = response.data.insights;
      setQuickInsight(text);
      if (onInsightsGenerated) onInsightsGenerated();
      
      let i = 0;
      setTypedQuickInsight('');
      const interval = setInterval(() => {
        setTypedQuickInsight(() => text.substring(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 5);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingQuick(false);
    }
  }, [onInsightsGenerated]);

  useEffect(() => {
    if (data && !quickInsight && !isGeneratingQuick) {
      generateQuickInsight(data);
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
              <th style={{ padding: '0.75rem', textAlign: 'left', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>Feature</th>
              {cols.map(c => <th key={c} style={{ padding: '0.75rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{c.substring(0,10)}..</th>)}
            </tr>
          </thead>
          <tbody>
            {cols.map(row => (
              <tr key={row}>
                <td style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 'bold', borderRight: '1px solid var(--border-color)' }}>{row}</td>
                {cols.map(col => {
                  const val = matrix[row][col];
                  if (val === null || val === undefined) return <td key={col} style={{ border: '1px solid var(--border-color)' }}>-</td>;
                  const absVal = Math.abs(val);
                  const bgColor = val > 0 ? `rgba(239, 68, 68, ${absVal})` : `rgba(59, 130, 246, ${absVal})`;
                  return (
                    <td key={col} style={{ backgroundColor: bgColor, border: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem', color: absVal > 0.5 ? 'white' : 'inherit' }}>
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

  useEffect(() => {
    setData(cachedData);
  }, [cachedData]);

  const runAnalytics = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/analyze-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setData(response.data);
      onAnalyzed(response.data);
    } catch (error) {
      console.error('Analytics failed', error);
      alert('Analytics failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoricalChart = (feat: string, info: any) => {
    const chartData = Object.entries(info.top_values).map(([name, value]) => ({ name, value }));
    const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

    return (
      <div key={feat} className="stat-chart-container card">
        <h4>📌 {feat} — {info.unique_count} unique values</h4>
        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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

  return (
    <div className="tab-pane">
      <div className="pane-header">
        <h2>Exploratory Data Analytics</h2>
        <p>Auto-generate descriptive statistics, feature correlations, and categorical breakdowns.</p>
      </div>

      <button 
        className="btn-primary run-btn" 
        onClick={runAnalytics}
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : '📊 Generate Full Analytics Report'}
      </button>

      {data && (
        <div className="quick-ai-summary" style={{ marginTop: '1.5rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent-color)' }}>
           <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>
              <Sparkles size={18} /> InsightGrid Auto-Analysis
           </h4>
           {isGeneratingQuick && !quickInsight ? (
             <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }} className="pulse-text">Analyzing statistical patterns...</p>
           ) : (
             <p style={{ lineHeight: 1.6 }}>{typedQuickInsight}<span className="cursor-blink">|</span></p>
           )}
        </div>
      )}

      {data && (
        <div className="analytics-results">
          <div className="section-header">Descriptive Statistics</div>
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
                    <td style={{ fontWeight: 600 }}>{stat}</td>
                    {Object.keys(data.descriptive_statistics).map(col => (
                      <td key={col}>{data.descriptive_statistics[col][stat]?.toFixed(2)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.correlation_matrix && (
            <>
              <div className="section-header" style={{marginTop: '2rem'}}>Correlation Heatmap</div>
              <div className="card">
                 {renderCorrelationMatrix(data.correlation_matrix)}
              </div>
            </>
          )}

          {data.categorical_summaries && (
            <>
              <div className="section-header" style={{marginTop: '2rem'}}>Categorical Feature Summaries</div>
              <div className="charts-grid">
                {Object.entries(data.categorical_summaries).map(([feat, info]) => renderCategoricalChart(feat, info as any))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
