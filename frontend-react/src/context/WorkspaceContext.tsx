import React, { createContext, useContext, useState, useCallback } from 'react';
import type { 
  WorkspaceState, 
  WorkspaceContextValue, 
  WorkspaceInvestigation, 
  WorkspacePredictionContext,
  Insight, 
  Dataset 
} from '../types';

const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  dataset_id: null,
  dataset_name: null,
  analysis_id: null,
  active_insight_id: null,
  active_evidence_ids: [],
  investigation: null,
  prediction_context: null,
  conversation_context: {
    active_subject: undefined,
    active_dimensions: []
  }
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<WorkspaceState>(INITIAL_WORKSPACE_STATE);

  const resetWorkspaceOnDatasetChange = useCallback((newDatasetId: string | null, newDatasetName: string | null) => {
    setWorkspace(prev => {
      // If same dataset, keep existing context
      if (prev.dataset_id === newDatasetId) {
        return prev;
      }

      // If dataset changed, safely invalidate all downstream context
      return {
        ...INITIAL_WORKSPACE_STATE,
        dataset_id: newDatasetId,
        dataset_name: newDatasetName,
        analysis_id: newDatasetId ? `an-${newDatasetId.slice(0, 8)}` : null
      };
    });
  }, []);

  const setActiveInsightId = useCallback((insightId: string | null) => {
    setWorkspace(prev => ({
      ...prev,
      active_insight_id: insightId
    }));
  }, []);

  const setInvestigationFromInsight = useCallback((insight: Insight, dataset: Dataset) => {
    const datasetId = dataset.id;
    const analysisId = insight.analysis_id || (dataset.analyticsData ? `an-${datasetId.slice(0, 8)}` : null);
    
    // Extract related columns from the insight
    const relatedCols = insight.related_columns || (insight.driver ? [insight.driver] : []);
    const subject = insight.driver || (relatedCols.length > 0 ? relatedCols[0] : insight.title || 'Finding');
    
    // Identify valid dataset dimensions from actual column profiles (categorical/temporal)
    const validDimensions: string[] = [];
    if (dataset.understanding?.column_profiles) {
      dataset.understanding.column_profiles.forEach(p => {
        if (p.name !== subject && (p.inferred_type === 'categorical' || p.inferred_type === 'temporal' || p.is_temporal)) {
          if (!validDimensions.includes(p.name)) {
            validDimensions.push(p.name);
          }
        }
      });
    }

    // Default select up to 2 initial dimensions
    const initialSelectedDims = validDimensions.slice(0, 2);
    const drillDown = [subject, ...initialSelectedDims];
    const evidenceIds = insight.evidence_ids || (insight.evidence_items ? insight.evidence_items.map(e => e.evidence_id) : []);

    const newInvestigation: WorkspaceInvestigation = {
      active: true,
      investigation_id: `inv-${Date.now().toString(36)}`,
      source_insight_id: insight.insight_id,
      subject: subject,
      selected_dimensions: initialSelectedDims,
      filters: {},
      related_columns: relatedCols,
      drill_down_path: drillDown,
      summary: insight.why_it_matters || insight.finding || `Investigation on ${subject}`,
      suggested_target: insight.actionable_investigation_target || dataset.understanding?.candidate_targets?.[0] || subject
    };

    const newPredictionContext: WorkspacePredictionContext = {
      target: newInvestigation.suggested_target || subject,
      relevant_columns: relatedCols,
      evidence_ids: evidenceIds,
      investigation_id: newInvestigation.investigation_id,
      inherited_from: `Investigation on ${subject}`
    };

    setWorkspace(prev => ({
      ...prev,
      dataset_id: datasetId,
      dataset_name: dataset.name,
      analysis_id: analysisId,
      active_insight_id: insight.insight_id || null,
      active_evidence_ids: evidenceIds,
      investigation: newInvestigation,
      prediction_context: newPredictionContext,
      conversation_context: {
        active_subject: subject,
        active_dimensions: initialSelectedDims
      }
    }));
  }, []);

  const setPredictionFromInvestigation = useCallback((target: string, relevantColumns?: string[], evidenceIds?: string[]) => {
    setWorkspace(prev => {
      const activeInv = prev.investigation;
      return {
        ...prev,
        prediction_context: {
          target: target,
          relevant_columns: relevantColumns || (activeInv ? activeInv.related_columns : []),
          evidence_ids: evidenceIds || (activeInv ? prev.active_evidence_ids : []),
          investigation_id: activeInv?.investigation_id,
          inherited_from: activeInv ? `Investigation on ${activeInv.subject}` : 'Workspace Context'
        }
      };
    });
  }, []);

  const selectDimension = useCallback((dimension: string) => {
    setWorkspace(prev => {
      if (!prev.investigation) return prev;
      const currentDims = prev.investigation.selected_dimensions || [];
      if (currentDims.includes(dimension)) return prev;

      const updatedDims = [...currentDims, dimension];
      const updatedDrillDown = [prev.investigation.subject || 'Subject', ...updatedDims];

      return {
        ...prev,
        investigation: {
          ...prev.investigation,
          selected_dimensions: updatedDims,
          drill_down_path: updatedDrillDown
        },
        conversation_context: {
          ...prev.conversation_context,
          active_dimensions: updatedDims
        }
      };
    });
  }, []);

  const removeDimension = useCallback((dimension: string) => {
    setWorkspace(prev => {
      if (!prev.investigation) return prev;
      const currentDims = prev.investigation.selected_dimensions || [];
      const updatedDims = currentDims.filter(d => d !== dimension);
      const updatedDrillDown = [prev.investigation.subject || 'Subject', ...updatedDims];

      return {
        ...prev,
        investigation: {
          ...prev.investigation,
          selected_dimensions: updatedDims,
          drill_down_path: updatedDrillDown
        },
        conversation_context: {
          ...prev.conversation_context,
          active_dimensions: updatedDims
        }
      };
    });
  }, []);

  const clearInvestigation = useCallback(() => {
    setWorkspace(prev => ({
      ...prev,
      active_insight_id: null,
      active_evidence_ids: [],
      investigation: null,
      prediction_context: null,
      conversation_context: {
        active_subject: undefined,
        active_dimensions: []
      }
    }));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setInvestigationFromInsight,
        setPredictionFromInvestigation,
        selectDimension,
        removeDimension,
        clearInvestigation,
        resetWorkspaceOnDatasetChange,
        setActiveInsightId
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
