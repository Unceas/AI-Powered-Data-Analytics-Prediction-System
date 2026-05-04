import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { 
  Moon, 
  Sun, 
  Database, 
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  status: {
    isLoaded: boolean;
    isProcessed: boolean;
    isAnalyzed: boolean;
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
          <Database className="logo-icon" size={24} />
          {isExpanded && <span className="logo-text">AutoData</span>}
        </div>
        <button 
          className="toggle-btn" 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {isExpanded && <h3 className="section-title">Pipeline Status</h3>}
          <ul className="status-list">
            <li className={`status-item ${status.isLoaded ? 'active' : ''}`} title="Dataset Loaded">
              <span className="status-indicator"></span>
              {isExpanded && <span>Dataset Loaded</span>}
            </li>
            <li className={`status-item ${status.isProcessed ? 'active' : ''}`} title="Data Processed">
              <span className="status-indicator"></span>
              {isExpanded && <span>Data Processed</span>}
            </li>
            <li className={`status-item ${status.isAnalyzed ? 'active' : ''}`} title="Analyzed">
              <span className="status-indicator"></span>
              {isExpanded && <span>Analyzed</span>}
            </li>
          </ul>
        </div>

        <div className="nav-section">
          {isExpanded && <h3 className="section-title">Controls</h3>}
          <button 
            className={`nav-btn ${currentView === 'pipeline' ? 'active' : ''}`} 
            onClick={() => onNavigate('pipeline')}
            title="Pipeline"
          >
            <Database size={20} />
            {isExpanded && <span>Pipeline</span>}
          </button>
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => onNavigate('dashboard')}
            title="Dashboard"
          >
            <Activity size={20} />
            {isExpanded && <span>Dashboard</span>}
          </button>
          <button 
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} 
            onClick={() => onNavigate('settings')}
            title="Settings"
          >
            <Settings size={20} />
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
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          {isExpanded && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
      </div>
    </aside>
  );
}
