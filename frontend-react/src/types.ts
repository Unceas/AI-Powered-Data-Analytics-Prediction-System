export interface DatasetLog {
  timestamp: string;
  message: string;
}

export interface ColumnProfile {
  name: string;
  inferred_type: 'numeric' | 'categorical' | 'temporal' | 'boolean' | 'text' | 'unknown';
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  cardinality: 'constant' | 'binary' | 'low' | 'moderate' | 'high' | 'unique';
  sample_values: any[];
  skewness?: number;
  is_candidate_target: boolean;
  is_temporal: boolean;
}

export interface DataUnderstanding {
  status: string;
  message: string;
  dataset_id: string;
  row_count: number;
  column_count: number;
  duplicate_rows_count: number;
  column_profiles: ColumnProfile[];
  temporal_columns: string[];
  candidate_targets: string[];
  quality_score: number;
  quality_details: Record<string, any>;
  limitations: string[];
}

export interface EvidenceItem {
  evidence_id: string;
  analysis_id: string;
  dataset_id: string;
  category: 'correlation' | 'anomaly' | 'distribution' | 'metric' | 'driver' | 'quality' | 'trend' | 'segment';
  title: string;
  description: string;
  metric_name: string;
  metric_value: any;
  unit?: string;
  period?: string;
  scope?: string;
  strength: 'High' | 'Medium' | 'Low';
  related_columns: string[];
  source: string;
  provenance?: Record<string, any>;
  metadata?: Record<string, any>;
  technical_details?: Record<string, any>;
}

export interface Insight {
  insight_id?: string;
  analysis_id?: string;
  dataset_id?: string;
  category: 'Correlation' | 'Prediction' | 'Anomaly' | 'Trend' | 'Quality' | 'Recommendation';
  title?: string;
  finding: string;
  summary?: string;
  impact?: string;
  why_it_matters?: string;
  confidence: number | string;
  priority?: 'High' | 'Medium' | 'Low';
  priority_score?: number;
  priority_reasons?: string[];
  is_key_finding?: boolean;
  source: string;
  driver?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation?: string;
  recommended_next_step?: string;
  actionable_investigation_target?: string;
  evidence_ids?: string[];
  evidence_items?: EvidenceItem[];
  investigation_candidates?: string[];
  reason_for_priority?: string;
  evidence?: {
    feature_importance?: number;
    correlation?: number;
    metric_value?: number;
  };
  related_columns?: string[];
  linked_visualization?: 'weights' | 'correlation' | 'anomalies' | 'confidence' | 'distribution';
  linked_feature?: string;
}

export interface InvestigationDimension {
  dimension: string;
  dimension_type: 'categorical' | 'temporal' | 'segment' | 'feature';
  distinct_count: number;
  sample_values: any[];
  rationale: string;
}

export interface InvestigationContext {
  investigation_id: string;
  insight_id?: string;
  dataset_id: string;
  analysis_id: string;
  primary_feature: string;
  target_feature?: string;
  relevant_dimensions: InvestigationDimension[];
  drill_down_path: string[];
  supporting_evidence_ids: string[];
  summary: string;
  suggested_prediction_target?: string;
}

export interface DecisionBrief {
  brief_id: string;
  dataset_id: string;
  analysis_id: string;
  what_happened: string;
  why_it_matters: string;
  what_data_suggests: string;
  what_may_happen_next?: string;
  reliability?: string;
  reliability_explanation?: string;
  investigate_next: string;
  supporting_evidence_ids: string[];
  generated_at: string;
}

export interface AnalyticalContext {
  dataset_id: string;
  dataset_name?: string;
  analysis_id?: string;
  active_insight_id?: string;
  active_target?: string;
  active_dimensions: string[];
  previous_subject?: string;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface Dataset {
  id: string;
  name: string;
  file: File;
  rawFile?: File;
  isSample?: boolean;
  stats: any;
  dataset_health_score?: number;
  dataset_health_details?: any;
  reliability_score?: number;
  reliability_details?: any;
  status: {
    isLoaded: boolean;
    isProcessed: boolean;
    isAnalyzed: boolean;
    isModelTrained: boolean;
    isInsightsGenerated: boolean;
  };
  understanding?: DataUnderstanding;
  processedData: any;
  analyticsData: any;
  mlResult?: any;
  anomalyResult?: any;
  logs: DatasetLog[];
  insights?: Insight[];
  evidence?: EvidenceItem[];
  decisionBrief?: DecisionBrief;
  investigations?: InvestigationContext[];
  activeInvestigation?: InvestigationContext;
  engineState?: 'IDLE' | 'INITIALIZING' | 'VALIDATING' | 'PROCESSING' | 'ANALYZING' | 'RUNNING INFERENCE' | 'SYNTHESIZING INSIGHTS' | 'COMPLETE' | 'ERROR';
}

export interface ReportPayload {
  dataset_id: string;
  dataset_name: string;
  understanding?: DataUnderstanding;
  analysis?: any;
  insights: Insight[];
  decision_brief?: DecisionBrief;
  investigations?: InvestigationContext[];
  prediction?: any;
  evidence: EvidenceItem[];
  executive_summary: string;
  created_at: string;
}

export interface WorkspaceInvestigation {
  active: boolean;
  investigation_id?: string;
  source_insight_id?: string;
  subject?: string;
  selected_dimensions: string[];
  filters: Record<string, any>;
  related_columns: string[];
  drill_down_path: string[];
  summary?: string;
  suggested_target?: string;
}

export interface WorkspacePredictionContext {
  target: string | null;
  relevant_columns: string[];
  evidence_ids: string[];
  investigation_id?: string;
  inherited_from?: string;
}

export interface WorkspaceState {
  dataset_id: string | null;
  dataset_name: string | null;
  analysis_id: string | null;
  active_insight_id: string | null;
  active_evidence_ids: string[];
  investigation: WorkspaceInvestigation | null;
  prediction_context: WorkspacePredictionContext | null;
  conversation_context: {
    active_subject?: string;
    active_dimensions: string[];
  };
}

export interface WorkspaceContextValue {
  workspace: WorkspaceState;
  setInvestigationFromInsight: (insight: Insight, dataset: Dataset) => void;
  setPredictionFromInvestigation: (target: string, relevantColumns?: string[], evidenceIds?: string[]) => void;
  selectDimension: (dimension: string) => void;
  removeDimension: (dimension: string) => void;
  clearInvestigation: () => void;
  resetWorkspaceOnDatasetChange: (newDatasetId: string | null, newDatasetName: string | null) => void;
  setActiveInsightId: (insightId: string | null) => void;
}

