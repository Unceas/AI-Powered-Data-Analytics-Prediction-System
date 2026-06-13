export interface DatasetLog {
  timestamp: string;
  message: string;
}

export interface Insight {
  category: 'Correlation' | 'Prediction' | 'Anomaly' | 'Trend' | 'Recommendation';
  finding: string;
  impact: string;
  confidence: number;
  source: string;
  driver: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
  evidence: {
    feature_importance?: number;
    correlation?: number;
    metric_value?: number;
  };
  linked_visualization: 'weights' | 'correlation' | 'anomalies' | 'confidence' | 'distribution';
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
  processedData: any;
  analyticsData: any;
  mlResult?: any;
  anomalyResult?: any;
  logs: DatasetLog[];
  insights?: Insight[];
  engineState?: 'IDLE' | 'INITIALIZING' | 'VALIDATING' | 'PROCESSING' | 'ANALYZING' | 'RUNNING INFERENCE' | 'SYNTHESIZING INSIGHTS' | 'COMPLETE' | 'ERROR';
}
