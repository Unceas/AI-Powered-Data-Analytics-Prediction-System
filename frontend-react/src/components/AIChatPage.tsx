import { useState, useEffect, useRef } from 'react';
import { Send, FileText, ChevronRight, Brain, Bot, Download } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import api from '../utils/api';
import './AIChatPage.css';
import type { Dataset } from '../types';

interface AIChatPageProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onGenerateReport?: () => void;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string;
  linkedElement?: {
    type: 'anomaly' | 'feature' | 'metrics';
    value: string;
  };
}

export function AIChatPage({ datasets, activeDatasetId, onSelectDataset, onGenerateReport }: AIChatPageProps) {
  const { workspace } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  // Suggested quick prompts adapted to current workspace investigation
  const quickPrompts = workspace.investigation?.active ? [
    { 
      label: `🔍 Why did ${workspace.investigation.subject} change?`, 
      text: `What underlying evidence and drivers explain the patterns observed in ${workspace.investigation.subject}?` 
    },
    { 
      label: `📊 Breakdown by ${workspace.investigation.selected_dimensions[0] || 'dimension'}`, 
      text: `How does ${workspace.investigation.subject} distribute across ${workspace.investigation.selected_dimensions[0] || 'segments'}?` 
    },
    { 
      label: `🤖 Predict ${workspace.prediction_context?.target || workspace.investigation.subject}`, 
      text: `What can we reasonably predict about ${workspace.prediction_context?.target || workspace.investigation.subject} based on verified evidence?` 
    },
    { 
      label: `📈 Top Evidence`, 
      text: `Summarize the strongest correlation and outlier evidence related to ${workspace.investigation.subject}.` 
    }
  ] : [
    { label: "📊 Summarize correlations", text: "What are the most notable feature correlations in this dataset?" },
    { label: "🔍 Explain anomalies", text: "Can you detail the anomaly detection results? What features are skewing the outliers?" },
    { label: "🤖 Evaluate trained model", text: "Analyze the prediction metrics. Which features are contributing most to outcomes?" },
    { label: "📈 Overall patterns", text: "Identify the top 3 actionable insights from this data." }
  ];

  // Auto initialize chat context when selecting a processed dataset
  useEffect(() => {
    if (activeDataset) {
      if (activeDataset.status.isProcessed) {
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am the resident Insight Engine. I have loaded **${activeDataset.name}** into memory.\n\n` + 
                     `- Rows: **${activeDataset.stats.rows.toLocaleString()}** | Columns: **${activeDataset.stats.columns}**\n` +
                     `- Preprocessed Strategy: **Imputation (Mean) + StandardScaler**\n\n` +
                     `Ask me any questions about distributions, predictions, feature importances, or anomaly patterns.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages([
          {
            role: 'assistant',
            content: `Dataset **${activeDataset.name}** is loaded, but it has not been preprocessed yet. Please go to the Data Manager to run the preprocessing pipeline so I can ingest its features.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Welcome to the Intelligence Studio. Select a dataset from the list to begin conversational reasoning.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeDatasetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [lastSubject, setLastSubject] = useState<string | undefined>(undefined);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeDataset) return;
    
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.post('/ask-insightgrid', {
        question: text,
        dataset_id: activeDataset.id,
        dataset_name: activeDataset.name,
        evidence_items: activeDataset.evidence || [],
        context: {
          dataset_id: activeDataset.id,
          dataset_name: activeDataset.name,
          analysis_id: workspace.analysis_id || undefined,
          active_insight_id: workspace.active_insight_id || undefined,
          previous_subject: workspace.investigation?.subject || lastSubject,
          active_target: workspace.prediction_context?.target || activeDataset.mlResult?.target_column,
          active_dimensions: workspace.investigation?.selected_dimensions || activeDataset.activeInvestigation?.drill_down_path || []
        },
        history: newHistory.map(m => ({ role: m.role, content: m.content }))
      });

      if (response.data.resolved_subject) {
        setLastSubject(response.data.resolved_subject);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer || 'No direct evidence answer produced.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedElement: response.data.referenced_evidence_ids?.length > 0 ? {
          type: 'metrics',
          value: `Referenced Evidence: ${response.data.referenced_evidence_ids.join(', ')} (${response.data.confidence || 'High'} Confidence)`
        } : undefined
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'An error occurred while querying the intelligence assistant. Please verify connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-view animate-fade-in">
      <div className="view-header" style={{ marginBottom: '1.25rem' }}>
        <h2>Intelligence Studio</h2>
        <p>Conversational LLM reasoning grounded in dataset parameters, model weights, and statistical vectors.</p>
      </div>

      <div className="chat-page-layout">
        {/* Left Side: Context Selector */}
        <div className="chat-sidebar card">
          <div className="sidebar-title">
            <Brain size={16} className="text-accent" />
            <h3>ACTIVE CONTEXT</h3>
          </div>

          <div className="chat-dataset-picker-list">
            {datasets.map(d => (
              <div 
                key={d.id}
                className={`picker-dataset-item ${d.id === activeDatasetId ? 'selected' : ''}`}
                onClick={() => onSelectDataset(d.id)}
              >
                <FileText size={16} />
                <div className="item-meta">
                  <span className="name">{d.name}</span>
                  <span className="rows">{(d.stats.rows || 0).toLocaleString()} rows</span>
                </div>
                <ChevronRight size={14} className="chevron" />
              </div>
            ))}
          </div>

          {activeDataset && (
            <div className="active-grounding-meta">
              <h4 className="grounding-title">Grounded Context Elements</h4>
              <ul className="grounding-list">
                <li><span>Target Column:</span> <strong>{workspace.prediction_context?.target || (activeDataset.mlResult ? 'dropout_risk' : 'Not set')}</strong></li>
                <li><span>Features Parsed:</span> <strong>{activeDataset.stats.columns}</strong></li>
                <li><span>Inference Mode:</span> <strong>{activeDataset.status.isModelTrained ? 'ACTIVE' : 'STANDBY'}</strong></li>
                <li><span>Confidence Band:</span> <strong>95% CI (Fitted)</strong></li>
                {workspace.investigation?.active && (
                  <li><span>Active Focus:</span> <strong className="text-accent">{workspace.investigation.subject}</strong></li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Chat Workspace */}
        <div className="chat-workspace-panel card">
          <div className="chat-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="header-status" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={16} className="text-accent active-glow" />
              <span>Intelligence Studio</span>
              {workspace.investigation?.active && (
                <span style={{ 
                  fontSize: '0.72rem', 
                  background: 'var(--accent-light)', 
                  color: 'var(--accent-color)', 
                  border: '1px solid var(--accent-border)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  Exploring: {workspace.investigation.subject}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {activeDataset && activeDataset.status.isInsightsGenerated && onGenerateReport && (
                <button
                  onClick={onGenerateReport}
                  title="Generate premium A4 PDF intelligence report"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.75rem',
                    borderRadius: '0.35rem',
                    background: 'var(--accent-light)',
                    color: 'var(--accent-color)',
                    border: '1px solid var(--accent-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600,
                    gap: '4px'
                  }}
                >
                  <Download size={12} />
                  <span>Generate Report</span>
                </button>
              )}
              <span className="status-indicator-pill">INTELLIGENCE SYNTESIZER ACTIVE</span>
            </div>
          </div>

          <div className="messages-scroller">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-bubble-row ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'assistant' ? <Bot size={14} /> : 'U'}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <span className="author">{msg.role === 'assistant' ? 'INSIGHT ENGINE' : 'YOU'}</span>
                    <span className="time">{msg.timestamp}</span>
                  </div>
                  <div className="message-text">
                    {msg.content.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '0.4rem' }}>{line}</p>)}
                  </div>
                  {msg.linkedElement && (
                    <div className="linked-reasoning-anchor">
                      <span>Reasoning path anchored to: </span>
                      <strong className="text-accent">
                        {msg.linkedElement.type === 'anomaly' ? '→ anomaly_outlier.vector' : '→ model_feature_weights.matrix'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble-row assistant">
                <div className="msg-avatar"><Bot size={14} /></div>
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <span className="author">INSIGHT ENGINE</span>
                  </div>
                  <div className="typing-loader">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions panel */}
          {activeDataset && activeDataset.status.isProcessed && messages.length <= 1 && (
            <div className="quick-suggestions-row">
              {quickPrompts.map((p, i) => (
                <button 
                  key={i} 
                  className="suggestion-pill-btn" 
                  onClick={() => sendMessage(p.text)}
                  disabled={isLoading}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-row">
            <input 
              type="text" 
              placeholder={activeDataset ? "Ask Insight Engine to analyze metrics, weights, or outliers..." : "Select active dataset first..."}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
              disabled={isLoading || !activeDataset}
            />
            <button 
              className="send-button"
              onClick={() => sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim() || !activeDataset}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
