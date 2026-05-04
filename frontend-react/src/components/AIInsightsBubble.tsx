import { useState } from 'react';
import { Sparkles, X, ChevronRight, FileText } from 'lucide-react';
import api from '../utils/api';
import './AIInsightsBubble.css';
import type { Dataset } from '../types';

interface AIInsightsBubbleProps {
  datasets: Dataset[];
}

export function AIInsightsBubble({ datasets }: AIInsightsBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);

  const selectedDataset = datasets.find(d => d.id === selectedId);

  const generateInsights = async () => {
    if (!selectedDataset?.analyticsData) return;
    
    setIsLoading(true);
    try {
      const response = await api.post('/generate-insights', {
        analysis_data: selectedDataset.analyticsData,
        context: 'You are a senior data scientist. Identify the top 3 actionable insights from this dataset. Be specific, concise, and business-focused.'
      });
      setInsights(response.data.insights);
    } catch (error) {
      console.error('AI Insights failed', error);
      alert('Failed to generate insights. Ensure analytics are generated for this dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className={`ai-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Insights"
      >
        <Sparkles size={24} />
      </button>

      <div className={`ai-overlay ${isOpen ? 'open' : ''}`}>
        <div className="overlay-header">
          <div className="header-title">
            <Sparkles size={20} className="text-accent" />
            <span>AI Insights Assistant</span>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="overlay-content">
          <div className="dataset-picker">
            <label className="input-label">Select Dataset</label>
            <div className="picker-list">
              {datasets.length === 0 ? (
                <p className="empty-text">No datasets uploaded yet.</p>
              ) : (
                datasets.map(ds => (
                  <div 
                    key={ds.id}
                    className={`picker-item ${selectedId === ds.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedId(ds.id);
                      setInsights(null);
                    }}
                  >
                    <FileText size={16} />
                    <span className="name">{ds.name}</span>
                    {!ds.status.isAnalyzed && <span className="warning-tag">Needs Analysis</span>}
                    <ChevronRight size={14} className="arrow" />
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedDataset && (
            <div className="insights-workspace animate-fade-in">
              <button 
                className="btn-primary generate-btn"
                onClick={generateInsights}
                disabled={isLoading || !selectedDataset.status.isAnalyzed}
              >
                {isLoading ? 'Analyzing Data...' : 'Generate AI Insights'}
              </button>

              {insights && (
                <div className="insights-text-card card">
                  {insights.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}

              {!selectedDataset.status.isAnalyzed && (
                <p className="helper-text warning">
                  Please run the Analytics pipeline for this dataset first.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
