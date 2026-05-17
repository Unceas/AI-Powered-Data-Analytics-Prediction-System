export interface DatasetLog {
  timestamp: string;
  message: string;
}

export interface Dataset {
  id: string;
  name: string;
  file: File;
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
  logs: DatasetLog[];
}
