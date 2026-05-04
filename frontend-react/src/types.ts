export interface Dataset {
  id: string;
  name: string;
  file: File;
  stats: any;
  status: {
    isLoaded: boolean;
    isProcessed: boolean;
    isAnalyzed: boolean;
  };
  processedData: any;
  analyticsData: any;
}
