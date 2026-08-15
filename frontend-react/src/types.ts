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
  category: 'correlation' | 'anomaly' | 'distribution' | 'metric' | 'driver' | 'quality';
  title: string;
  description: string;
  metric_name: string;
  metric_value: any;
  strength: 'High' | 'Medium' | 'Low';
  related_columns: string[];
  source: string;
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
  source: string;
  driver?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation?: string;
  recommended_next_step?: string;
  evidence_ids?: string[];
  evidence_items?: EvidenceItem[];
  evidence?: {
    feature_importance?: number;
    correlation?: number;
    metric_value?: number;
  };
  related_columns?: string[];
  linked_visualization?: 'weights' | 'correlation' | 'anomalies' | 'confidence' | 'distribution';
  linked_feature?: string;
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
  engineState?: 'IDLE' | 'INITIALIZING' | 'VALIDATING' | 'PROCESSING' | 'ANALYZING' | 'RUNNING INFERENCE' | 'SYNTHESIZING INSIGHTS' | 'COMPLETE' | 'ERROR';
}

export interface ReportPayload {
  dataset_id: string;
  dataset_name: string;
  understanding?: DataUnderstanding;
  analysis?: any;
  insights: Insight[];
  prediction?: any;
  evidence: EvidenceItem[];
  executive_summary: string;
  created_at: string;
}
