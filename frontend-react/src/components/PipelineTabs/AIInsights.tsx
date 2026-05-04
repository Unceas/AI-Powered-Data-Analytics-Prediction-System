import { useState } from 'react';
import api from '../../utils/api';
import './PipelineTabs.css';

interface AIInsightsProps {
  analyticsData: any;
}

export function AIInsights({ analyticsData }: AIInsightsProps) {
  const [context, setContext] = useState('You are a senior data scientist. Identify the top 3 actionable insights from this dataset. Be specific, concise, and business-focused.');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState('');

  const generateInsights = async () => {
    if (!analyticsData) {
      alert('Please run the Analytics report first.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/generate-insights', {
        analysis_data: analyticsData,
        context: context
      });
      setInsights(response.data.insights);
    } catch (error) {
      console.error('AI Insights failed', error);
      alert('AI Insights failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="pane-header">
        <h2>Groq AI Insights</h2>
        <p>The Groq LLM reads your analytics output and returns actionable, human-readable insights.</p>
      </div>

      {!analyticsData ? (
        <div className="warning-banner">
          ⚠️ Analytics not yet generated. Please go to the Analytics tab first and run the report.
        </div>
      ) : (
        <>
          <div className="pane-col">
            <label className="input-label">AI Prompt Context</label>
            <textarea 
              className="pane-textarea"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
            />
          </div>

          <button 
            className="btn-primary run-btn" 
            onClick={generateInsights}
            disabled={isLoading}
          >
            {isLoading ? 'Thinking...' : '✨ Generate Natural Language Insights'}
          </button>

          {insights && (
            <div className="insights-output card">
              <h3>📊 AI Insights</h3>
              <div className="insights-content">
                {insights.split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
