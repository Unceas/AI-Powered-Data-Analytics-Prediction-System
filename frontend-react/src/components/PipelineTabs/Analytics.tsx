import { useState, useEffect } from 'react';
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
}

export function Analytics({ file, onAnalyzed, cachedData }: AnalyticsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(cachedData);

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

          {data.categorical_summaries && (
            <>
              <div className="section-header" style={{marginTop: '2rem'}}>Categorical Feature Summaries</div>
              <div className="charts-grid">
                {Object.entries(data.categorical_summaries).map(([feat, info]) => renderCategoricalChart(feat, info))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
