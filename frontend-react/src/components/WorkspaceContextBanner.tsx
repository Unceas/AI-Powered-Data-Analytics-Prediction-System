import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Search, Brain, MessageSquareCode, TrendingUp, X, Database } from 'lucide-react';
import './WorkspaceContextBanner.css';

interface WorkspaceContextBannerProps {
  onNavigate: (view: string) => void;
}

export const WorkspaceContextBanner: React.FC<WorkspaceContextBannerProps> = ({ onNavigate }) => {
  const { workspace, removeDimension, clearInvestigation } = useWorkspace();
  const { investigation, dataset_name, prediction_context } = workspace;

  if (!workspace.dataset_id) {
    return null;
  }

  return (
    <div className="workspace-context-banner animate-fade-in">
      <div className="workspace-context-left">
        <div className="workspace-dataset-chip" title="Active Dataset in Workspace">
          <Database size={13} className="text-accent" />
          <span className="dataset-label">{dataset_name || 'Active Dataset'}</span>
        </div>

        {investigation && investigation.active ? (
          <>
            <span className="context-separator">/</span>
            <div className="workspace-investigation-badge">
              <Search size={13} className="text-accent" />
              <span className="context-action-label">EXPLORING:</span>
              <strong className="context-subject">{investigation.subject}</strong>
            </div>

            {investigation.selected_dimensions && investigation.selected_dimensions.length > 0 && (
              <div className="workspace-dimensions-list">
                {investigation.selected_dimensions.map(dim => (
                  <span key={dim} className="workspace-dimension-pill">
                    {dim}
                    <button 
                      className="dimension-remove-btn" 
                      onClick={() => removeDimension(dim)}
                      title={`Remove ${dim} dimension`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <span className="context-separator">/</span>
            <span className="workspace-idle-hint">Ready for exploratory analysis & investigation</span>
          </>
        )}
      </div>

      <div className="workspace-context-actions">
        {investigation && investigation.active && (
          <>
            <button 
              className="workspace-quick-action-btn"
              onClick={() => onNavigate('analytics')}
              title="Inspect patterns & correlations for active investigation"
            >
              <TrendingUp size={12} />
              <span>Patterns</span>
            </button>

            <button 
              className="workspace-quick-action-btn highlight"
              onClick={() => onNavigate('ml-workbench')}
              title="Launch contextual prediction based on active investigation"
            >
              <Brain size={12} />
              <span>Predict {prediction_context?.target ? `(${prediction_context.target})` : ''}</span>
            </button>

            <button 
              className="workspace-quick-action-btn"
              onClick={() => onNavigate('ai-chat')}
              title="Ask InsightGrid questions grounded in active context"
            >
              <MessageSquareCode size={12} />
              <span>Ask AI</span>
            </button>

            <button 
              className="workspace-clear-btn"
              onClick={clearInvestigation}
              title="Clear active investigation context"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
