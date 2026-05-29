export interface DatasetLog {
  timestamp: string;
  message: string;
}

export interface Dataset {
  id: string;
  name: string;
  file: File;
  rawFile?: File;
  stats: any;
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
  engineState?: 'IDLE' | 'INITIALIZING' | 'VALIDATING' | 'PROCESSING' | 'ANALYZING' | 'RUNNING INFERENCE' | 'SYNTHESIZING INSIGHTS' | 'COMPLETE' | 'ERROR';
}
