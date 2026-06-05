import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronRight, FileText, Send } from 'lucide-react';
import api from '../utils/api';
import './AIInsightsBubble.css';
import type { Dataset } from '../types';

interface AIInsightsBubbleProps {
  datasets: Dataset[];
  onInsightsGenerated?: (id: string) => void;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export function AIInsightsBubble({ datasets, onInsightsGenerated }: AIInsightsBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedDataset = datasets.find(d => d.id === selectedId);

  useEffect(() => {
    if (selectedDataset && selectedDataset.status.isAnalyzed && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I am the Insight Engine. I've looked at **${selectedDataset.name}** (${selectedDataset.stats.rows.toLocaleString()} rows, ${selectedDataset.stats.columns} columns).\n\nWhat would you like to know about it?`
      }]);
    } else if (!selectedDataset) {
      setMessages([]);
    }
  }, [selectedDataset, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedDataset?.analyticsData) return;
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const chatHistory = newMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
      const response = await api.post('/generate-insights', {
        analysis_data: selectedDataset.analyticsData,
        context: `You are the Insight Engine, an expert AI data analyst assistant. The user is asking questions about the dataset. Respond conversationally, concisely, and use the data context to answer.\n\nChat History:\n${chatHistory}`
      });
      
      setMessages([...newMessages, { role: 'assistant', content: response.data.insights }]);
      if (onInsightsGenerated) onInsightsGenerated(selectedDataset.id);
    } catch (error) {
      console.error('AI Chat failed', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Oops! I encountered an error while trying to respond.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className={`ai-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Insight Engine"
      >
        <Sparkles size={24} />
      </button>

      <div className={`ai-overlay ${isOpen ? 'open' : ''}`}>
        <div className="overlay-header">
          <div className="header-title">
            <Sparkles size={20} className="text-accent" />
            <span>Chat with Insight Engine</span>
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
                      if (selectedId !== ds.id) {
                        setSelectedId(ds.id);
                        setMessages([]);
                      }
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
            <div className="chat-workspace animate-fade-in">
              {!selectedDataset.status.isAnalyzed ? (
                <p className="helper-text warning">
                  Please run the Analytics pipeline for this dataset first.
                </p>
              ) : (
                <div className="chat-container card">
                  <div className="chat-messages">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="msg-content">
                          {msg.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="chat-message assistant">
                        <div className="msg-content typing-indicator">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="chat-input-area">
                    <input 
                      type="text" 
                      placeholder="Ask Insight Engine about your data..." 
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      disabled={isLoading}
                    />
                    <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
