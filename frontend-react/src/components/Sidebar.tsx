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
}

export function Sidebar({ status, currentView, onNavigate }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();

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
            <h3 className="section-title">Pipeline Health</h3>
            <div className="health-status-grid">
              <div className="health-row">
                <span className="health-label">Ingestion</span>
                <span className={`health-value ${status.isLoaded ? 'online' : 'offline'}`}>
                  {status.isLoaded ? 'ONLINE' : 'PENDING'}
                </span>
              </div>
              <div className="health-row">
                <span className="health-label">Preprocessing</span>
                <span className={`health-value ${status.isProcessed ? 'online' : 'offline'}`}>
                  {status.isProcessed ? 'ONLINE' : 'PENDING'}
                </span>
              </div>
              <div className="health-row">
                <span className="health-label">Analytics</span>
                <span className={`health-value ${status.isAnalyzed ? 'online' : 'offline'}`}>
                  {status.isAnalyzed ? 'ONLINE' : 'PENDING'}
                </span>
              </div>
              <div className="health-row">
                <span className="health-label">ML Inference</span>
                <span className={`health-value ${status.isModelTrained ? 'online' : 'offline'}`}>
                  {status.isModelTrained ? 'ONLINE' : 'PENDING'}
                </span>
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
