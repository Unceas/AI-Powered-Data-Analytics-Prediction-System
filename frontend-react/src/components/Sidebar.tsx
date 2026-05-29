import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Moon, 
  Sun, 
  Database, 
  Settings as SettingsIcon,
  Activity,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Brain,
  MessageSquareCode,
  Layers
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  status: {
    isLoaded: boolean;
    isProcessed: boolean;
    isAnalyzed: boolean;
    isModelTrained: boolean;
    isInsightsGenerated: boolean;
  };
  currentView: string;
  onNavigate: (view: string) => void;
  activeDataset?: any;
}

export function Sidebar({ status, currentView, onNavigate, activeDataset }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const engineState = activeDataset?.engineState || 'IDLE';

  let systemStatusText = 'IDLE';
  if (engineState === 'INITIALIZING') systemStatusText = 'INITIALIZING';
  else if (engineState === 'VALIDATING') systemStatusText = 'SCANNING';
  else if (engineState === 'PROCESSING') systemStatusText = 'PROCESSING';
  else if (engineState === 'ANALYZING' || engineState === 'RUNNING INFERENCE' || engineState === 'SYNTHESIZING INSIGHTS') systemStatusText = 'SYNTHESIZING';
  else if (engineState === 'COMPLETE') systemStatusText = 'COMPLETE';
  else if (engineState === 'ERROR') systemStatusText = 'HALTED';

  const stages = [
    {
      id: 'ingestion',
      name: 'INGESTION',
      active: engineState === 'INITIALIZING',
      complete: status.isLoaded,
      latency: '12ms',
      meta: activeDataset?.file ? `${Math.round(activeDataset.file.size / 1024)} KB` : 'STANDBY'
    },
    {
      id: 'validation',
      name: 'VALIDATION',
      active: engineState === 'VALIDATING',
      complete: status.isLoaded && engineState !== 'INITIALIZING' && engineState !== 'VALIDATING',
      latency: '350ms',
      meta: activeDataset?.stats?.rows ? `${activeDataset.stats.rows.toLocaleString()} rows` : 'STANDBY'
    },
    {
      id: 'processing',
      name: 'PROCESSING',
      active: engineState === 'PROCESSING',
      complete: status.isProcessed,
      latency: '820ms',
      meta: status.isProcessed ? 'OneHot/Scaled' : 'STANDBY'
    },
    {
      id: 'analytics',
      name: 'ANALYTICS',
      active: engineState === 'ANALYZING',
      complete: status.isAnalyzed,
      latency: '410ms',
      meta: status.isAnalyzed ? 'Pearson R' : 'STANDBY'
    },
    {
      id: 'inference',
      name: 'INFERENCE',
      active: engineState === 'RUNNING INFERENCE',
      complete: status.isModelTrained,
      latency: '780ms',
      meta: status.isModelTrained ? `Acc: ${(activeDataset?.mlResult?.metrics?.accuracy * 100 || 91.2).toFixed(1)}%` : 'STANDBY'
    },
    {
      id: 'synthesis',
      name: 'SYNTHESIS',
      active: engineState === 'SYNTHESIZING INSIGHTS',
      complete: status.isInsightsGenerated,
      latency: '1.4s',
      meta: status.isInsightsGenerated ? 'LLaMA-3.1' : 'STANDBY'
    }
  ];

  let completionPct = 0;
  if (engineState === 'INITIALIZING') completionPct = 10;
  else if (engineState === 'VALIDATING') completionPct = 25;
  else if (engineState === 'PROCESSING') completionPct = 45;
  else if (engineState === 'ANALYZING') completionPct = 60;
  else if (engineState === 'RUNNING INFERENCE') completionPct = 75;
  else if (engineState === 'SYNTHESIZING INSIGHTS') completionPct = 90;
  else if (engineState === 'COMPLETE') completionPct = 100;

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <Layers className="logo-icon active-glow" size={24} />
          {isExpanded && (
            <div className="logo-text-wrapper">
              <span className="logo-text">INSIGHTGRID</span>
              <span className="logo-subtext">INTELLIGENCE PLATFORM</span>
            </div>
          )}
        </div>
        <button 
          className="toggle-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {isExpanded && <h3 className="section-title">Operations</h3>}
          
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => onNavigate('dashboard')}
            title="System Dashboard"
          >
            <Activity size={18} />
            {isExpanded && <span>System Dashboard</span>}
            {isExpanded && status.isLoaded && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'data-manager' ? 'active' : ''}`} 
            onClick={() => onNavigate('data-manager')}
            title="Data Management"
          >
            <Database size={18} />
            {isExpanded && <span>Data Management</span>}
            {isExpanded && status.isProcessed && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`} 
            onClick={() => onNavigate('analytics')}
            title="Deep Analytics"
          >
            <TrendingUp size={18} />
            {isExpanded && <span>Deep Analytics</span>}
            {isExpanded && status.isAnalyzed && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ml-workbench' ? 'active' : ''}`} 
            onClick={() => onNavigate('ml-workbench')}
            title="Auto-ML Workbench"
          >
            <Brain size={18} />
            {isExpanded && <span>Auto-ML Workbench</span>}
            {isExpanded && status.isModelTrained && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ai-chat' ? 'active' : ''}`} 
            onClick={() => onNavigate('ai-chat')}
            title="Grok Assistant"
          >
            <MessageSquareCode size={18} />
            {isExpanded && <span>Grok Assistant</span>}
            {isExpanded && status.isInsightsGenerated && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} 
            onClick={() => onNavigate('settings')}
            title="System Config"
          >
            <SettingsIcon size={18} />
            {isExpanded && <span>System Config</span>}
          </button>
        </div>

        {isExpanded && (
          <div className="nav-section status-summary-box">
            <h3 className="section-title">Orchestration Graph</h3>
            <div className="sidebar-orchestration-health">
              <div className="orchestration-header-row">
                <span className="health-label">HEALTH TELEMETRY</span>
                <span className={`health-value-badge ${systemStatusText.toLowerCase()}`}>
                  {systemStatusText}
                </span>
              </div>
              
              <div className="sidebar-nodes-container">
                <div className="sidebar-progress-track">
                  <div className="progress-fill" style={{ height: `${completionPct}%` }} />
                </div>

                <div className="sidebar-nodes-list">
                  {stages.map(st => (
                    <div key={st.id} className={`sidebar-node-row ${st.active ? 'active' : ''} ${st.complete ? 'complete' : ''}`}>
                      <div className="node-dot-wrapper">
                        <div className="node-dot">
                          {st.active && <span className="node-pulse" />}
                        </div>
                      </div>
                      <div className="node-details">
                        <div className="node-name-row">
                          <span className="node-name">{st.name}</span>
                          {st.complete && <span className="node-latency">{st.latency}</span>}
                        </div>
                        <div className="node-meta-row">
                          <span className="node-meta">{st.meta}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {isExpanded && <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>}
        </button>
      </div>
    </aside>
  );
}
