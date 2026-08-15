import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { BrandIcon } from './BrandIcon';
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
  LayoutDashboard,
  Compass
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
  onExitWorkspace: () => void;
}

export function Sidebar({ status, currentView, onNavigate, activeDataset, onExitWorkspace }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();
  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
          <BrandIcon size={28} className="logo-img" />
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
            className="nav-btn" 
            onClick={onExitWorkspace}
            title="Product Tour & Info"
          >
            <Compass size={18} />
            {isExpanded && <span>Product Overview</span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => onNavigate('dashboard')}
            title="Overview"
          >
            <LayoutDashboard size={18} />
            {isExpanded && <span>Overview</span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'data-manager' ? 'active' : ''}`} 
            onClick={() => onNavigate('data-manager')}
            title="Data & Understanding"
          >
            <Database size={18} />
            {isExpanded && <span>Data & Understanding</span>}
            {isExpanded && status.isLoaded && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`} 
            onClick={() => onNavigate('analytics')}
            title="Analysis & Patterns"
          >
            <TrendingUp size={18} />
            {isExpanded && <span>Analysis & Patterns</span>}
            {isExpanded && status.isAnalyzed && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ml-workbench' ? 'active' : ''}`} 
            onClick={() => onNavigate('ml-workbench')}
            title="Predictions"
          >
            <Brain size={18} />
            {isExpanded && <span>Predictions</span>}
            {isExpanded && status.isModelTrained && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ai-chat' ? 'active' : ''}`} 
            onClick={() => onNavigate('ai-chat')}
            title="Ask InsightGrid"
          >
            <MessageSquareCode size={18} />
            {isExpanded && <span>Ask InsightGrid</span>}
            {isExpanded && status.isInsightsGenerated && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'diagnostics' ? 'active' : ''}`} 
            onClick={() => onNavigate('diagnostics')}
            title="Diagnostics"
          >
            <Activity size={18} />
            {isExpanded && <span>Diagnostics</span>}
            {isExpanded && activeDataset && activeDataset.engineState !== 'COMPLETE' && activeDataset.engineState !== 'IDLE' && activeDataset.engineState !== 'ERROR' && (
              <span className="active-dot-indicator processing-dot"></span>
            )}
          </button>

          <button 
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} 
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <SettingsIcon size={18} />
            {isExpanded && <span>Settings</span>}
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
