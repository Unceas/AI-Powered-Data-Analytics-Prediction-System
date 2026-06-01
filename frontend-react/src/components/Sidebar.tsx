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
  LayoutDashboard
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
  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/favicon.png" alt="InsightGrid Logo" className="logo-img" />
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
            <LayoutDashboard size={18} />
            {isExpanded && <span>System Dashboard</span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'diagnostics' ? 'active' : ''}`} 
            onClick={() => onNavigate('diagnostics')}
            title="Pipeline Diagnostics"
          >
            <Activity size={18} />
            {isExpanded && <span>Pipeline Diagnostics</span>}
            {isExpanded && activeDataset && activeDataset.engineState !== 'COMPLETE' && activeDataset.engineState !== 'IDLE' && activeDataset.engineState !== 'ERROR' && (
              <span className="active-dot-indicator processing-dot"></span>
            )}
            {isExpanded && activeDataset && activeDataset.engineState === 'COMPLETE' && (
              <span className="active-dot-indicator complete-dot"></span>
            )}
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
