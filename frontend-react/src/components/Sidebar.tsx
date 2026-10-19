import { useState, useEffect, useRef } from 'react';
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
  Compass,
  X
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
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function Sidebar({ 
  status, 
  currentView, 
  onNavigate, 
  activeDataset, 
  onExitWorkspace,
  mobileOpen = false,
  onCloseMobile,
  triggerRef
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const sidebarRef = useRef<HTMLElement>(null);
  const mobileCloseBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Focus management and keyboard accessibility (ISSUE-A11Y-002)
  useEffect(() => {
    if (mobileOpen) {
      lastActiveElementRef.current = (document.activeElement as HTMLElement) || triggerRef?.current || null;
      // Move focus into the drawer close button when opened
      const focusTimer = setTimeout(() => {
        mobileCloseBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCloseMobile?.();
          return;
        }

        // Trap focus inside drawer while modal
        if (e.key === 'Tab' && sidebarRef.current) {
          const focusables = sidebarRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus to trigger button when drawer closes
      const restoreTarget = triggerRef?.current || lastActiveElementRef.current;
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        restoreTarget.focus();
      }
    }
  }, [mobileOpen, onCloseMobile, triggerRef]);

  // Deliberate horizontal swipe-to-close handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!mobileOpen) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!mobileOpen || !touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Check for deliberate leftward swipe: > 50px left and horizontal > 1.5x vertical
    if (deltaX < -50 && Math.abs(deltaX) > 1.5 * Math.abs(deltaY)) {
      onCloseMobile?.();
    }
  };

  const handleNav = (view: string) => {
    onNavigate(view);
    onCloseMobile?.();
  };

  const handleExit = () => {
    onExitWorkspace();
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true" 
        />
      )}
      <aside 
        ref={sidebarRef}
        className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? 'Navigation drawer' : 'Sidebar navigation'}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebar-header">
          <div className="logo-container" onClick={() => handleNav('dashboard')} style={{ cursor: 'pointer' }}>
            <BrandIcon size={28} className="logo-img" />
            {(isExpanded || mobileOpen) && (
              <div className="logo-text-wrapper">
                <span className="logo-text">INSIGHTGRID</span>
                <span className="logo-subtext">INTELLIGENCE PLATFORM</span>
              </div>
            )}
          </div>
          <button 
            className="toggle-btn desktop-toggle-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          <button
            ref={mobileCloseBtnRef}
            className="toggle-btn mobile-close-btn"
            onClick={onCloseMobile}
            title="Close navigation menu"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {(isExpanded || mobileOpen) && <h3 className="section-title">Operations</h3>}
          
          <button 
            className="nav-btn" 
            onClick={handleExit}
            title="Product Tour & Info"
          >
            <Compass size={18} />
            {(isExpanded || mobileOpen) && <span>Product Overview</span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => handleNav('dashboard')}
            title="Overview"
          >
            <LayoutDashboard size={18} />
            {(isExpanded || mobileOpen) && <span>Overview</span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'data-manager' ? 'active' : ''}`} 
            onClick={() => handleNav('data-manager')}
            title="Data & Understanding"
          >
            <Database size={18} />
            {(isExpanded || mobileOpen) && <span>Data & Understanding</span>}
            {(isExpanded || mobileOpen) && status.isLoaded && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'analytics' ? 'active' : ''}`} 
            onClick={() => handleNav('analytics')}
            title="Analysis & Patterns"
          >
            <TrendingUp size={18} />
            {(isExpanded || mobileOpen) && <span>Analysis & Patterns</span>}
            {(isExpanded || mobileOpen) && status.isAnalyzed && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ml-workbench' ? 'active' : ''}`} 
            onClick={() => handleNav('ml-workbench')}
            title="Predictions"
          >
            <Brain size={18} />
            {(isExpanded || mobileOpen) && <span>Predictions</span>}
            {(isExpanded || mobileOpen) && status.isModelTrained && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'ai-chat' ? 'active' : ''}`} 
            onClick={() => handleNav('ai-chat')}
            title="Ask InsightGrid"
          >
            <MessageSquareCode size={18} />
            {(isExpanded || mobileOpen) && <span>Ask InsightGrid</span>}
            {(isExpanded || mobileOpen) && status.isInsightsGenerated && <span className="active-dot-indicator"></span>}
          </button>

          <button 
            className={`nav-btn ${currentView === 'diagnostics' ? 'active' : ''}`} 
            onClick={() => handleNav('diagnostics')}
            title="Diagnostics"
          >
            <Activity size={18} />
            {(isExpanded || mobileOpen) && <span>Diagnostics</span>}
            {(isExpanded || mobileOpen) && activeDataset && activeDataset.engineState !== 'COMPLETE' && activeDataset.engineState !== 'IDLE' && activeDataset.engineState !== 'ERROR' && (
              <span className="active-dot-indicator processing-dot"></span>
            )}
          </button>

          <button 
            className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`} 
            onClick={() => handleNav('settings')}
            title="Settings"
          >
            <SettingsIcon size={18} />
            {(isExpanded || mobileOpen) && <span>Settings</span>}
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
          {(isExpanded || mobileOpen) && <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>}
        </button>
      </div>
    </aside>
    </>
  );
}
