import { useState, useEffect, useRef } from 'react';
import { Send, FileText, ChevronRight, Brain, Bot } from 'lucide-react';
import api from '../utils/api';
import './AIChatPage.css';
import type { Dataset } from '../types';

interface AIChatPageProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
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

export function AIChatPage({ datasets, activeDatasetId, onSelectDataset }: AIChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  // Suggested quick prompts
  const quickPrompts = [
    { label: "📊 Summarize correlations", text: "What are the most notable feature correlations in this dataset?" },
    { label: "🔍 Explain anomalies", text: "Can you detail the anomaly detection results? What features are skewing the outliers?" },
    { label: "🤖 Evaluate trained model", text: "Analyze the random forest metrics. Which features are contributing most to predictions?" },
    { label: "📈 Overall patterns", text: "Identify the top 3 actionable insights from this data." }
  ];

  // Auto initialize chat context when selecting a processed dataset
  useEffect(() => {
    if (activeDataset) {
      if (activeDataset.status.isProcessed) {
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I am Grok, your AI intelligence assistant. I have loaded **${activeDataset.name}** into memory.\n\n` + 
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
          content: "Welcome to Grok AI Insight Engine. Select a dataset from the list to begin conversational reasoning.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [activeDatasetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeDataset) return;
    
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const dataPayload = activeDataset.analyticsData || {
        rows: activeDataset.stats.rows,
        columns: activeDataset.stats.columns
      };

      const response = await api.post('/generate-insights', {
        analysis_data: {
          ...dataPayload,
          ml_result: activeDataset.mlResult || null,
          anomaly_result: activeDataset.anomalyResult || null
        },
        context: `You are Grok, an expert senior data scientist. The user asks: "${text}". Respond concisely, professionally, and ground all insights in the provided dataset schema. Use Markdown formatting.`
      });

      // Grounding: simulated confidence / links if response touches certain words
      let linked: any = undefined;
      const lower = response.data.insights.toLowerCase();
      if (lower.includes('anomaly') || lower.includes('outlier')) {
        linked = { type: 'anomaly', value: 'outlier_marker' };
      } else if (lower.includes('feature') || lower.includes('weight') || lower.includes('importance')) {
        linked = { type: 'feature', value: 'feature_importance_weights' };
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.insights,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        linkedElement: linked
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'An error occurred while generating insights. Please verify connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-view animate-fade-in">
      <div className="view-header" style={{ marginBottom: '1.25rem' }}>
        <h2>Grok AI Insight Engine</h2>
        <p>Conversational LLM reasoning grounded in dataset parameters, model weights, and statistical vectors.</p>
      </div>

      <div className="chat-page-layout">
        {/* Left Side: Context Selector */}
        <div className="chat-sidebar card">
          <div className="sidebar-title">
            <Brain size={16} className="text-cyan" />
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
                <li><span>Target Column:</span> <strong>{activeDataset.mlResult ? 'dropout_risk' : 'Not set'}</strong></li>
                <li><span>Features Parsed:</span> <strong>{activeDataset.stats.columns}</strong></li>
                <li><span>Inference Mode:</span> <strong>{activeDataset.status.isModelTrained ? 'ACTIVE' : 'STANDBY'}</strong></li>
                <li><span>Confidence Band:</span> <strong>95% CI (Fitted)</strong></li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Chat Workspace */}
        <div className="chat-workspace-panel card">
          <div className="chat-header-bar">
            <div className="header-status">
              <Bot size={16} className="text-cyan active-glow" />
              <span>Grok AI Agent</span>
            </div>
            <span className="status-indicator-pill">INTELLIGENCE SYNTESIZER ACTIVE</span>
          </div>

          <div className="messages-scroller">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-bubble-row ${msg.role}`}>
                <div className="msg-avatar">
                  {msg.role === 'assistant' ? <Bot size={14} /> : 'U'}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <span className="author">{msg.role === 'assistant' ? 'GROK' : 'YOU'}</span>
                    <span className="time">{msg.timestamp}</span>
                  </div>
                  <div className="message-text">
                    {msg.content.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '0.4rem' }}>{line}</p>)}
                  </div>
                  {msg.linkedElement && (
                    <div className="linked-reasoning-anchor">
                      <span>Reasoning path anchored to: </span>
                      <strong className="text-cyan">
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
                    <span className="author">GROK</span>
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
              placeholder={activeDataset ? "Ask Grok to analyze metrics, weights, or outliers..." : "Select active dataset first..."}
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
