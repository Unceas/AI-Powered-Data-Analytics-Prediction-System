import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { DataManager } from './components/DataManager';
import { Analytics } from './components/PipelineTabs/Analytics';
import { MachineLearning } from './components/PipelineTabs/MachineLearning';
import { Dashboard } from './components/Dashboard';
import { AIChatPage } from './components/AIChatPage';
import { Settings } from './components/Settings';
import api from './utils/api';
import './App.css';

import type { Dataset } from './types';

const getTimestamp = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `[${h}:${m}:${s}]`;
};

function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const updateState = useCallback((id: string, state: Dataset['engineState'], logMsg?: string, statusUpdates?: any, extraData?: any) => {
    setDatasets(prev => prev.map(ds => {
      if (ds.id === id) {
        const updatedLogs = logMsg 
          ? [...ds.logs, { timestamp: getTimestamp(), message: logMsg }] 
          : ds.logs;
        return {
          ...ds,
          engineState: state,
          status: statusUpdates ? { ...ds.status, ...statusUpdates } : ds.status,
          logs: updatedLogs,
          ...extraData
        };
      }
      return ds;
    }));
  }, []);

  const runFullPipeline = async (id: string, file: File, autoProcess: boolean) => {
    try {
      if (!autoProcess) {
        updateState(id, 'IDLE', 'Ingestion completed. System standing by.');
        return;
      }

      // Stage 2: VALIDATING
      updateState(id, 'VALIDATING', 'Validating schema structure and checking types...');
      await new Promise(r => setTimeout(r, 1200));

      // Stage 3: PROCESSING
      updateState(id, 'PROCESSING', 'Executing imputation (Mean) & feature scaling...');
      const processFormData = new FormData();
      processFormData.append('file', file);
      processFormData.append('config', JSON.stringify({
        handle_missing: 'mean',
        scale_features: true,
        encode_categorical: true,
        scaling_method: 'standard',
        encoding_method: 'onehot'
      }));
      const processRes = await api.post('/process-csv', processFormData);
      updateState(id, 'PROCESSING', 'Preprocessing complete. Null columns resolved.', { isProcessed: true }, { processedData: processRes.data });
      await new Promise(r => setTimeout(r, 1200));

      // Stage 4: ANALYZING
      updateState(id, 'ANALYZING', 'Analyzing correlation maps and summary metrics...');
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', file);
      const analyzeRes = await api.post('/analyze-csv', analyzeFormData);
      updateState(id, 'ANALYZING', 'Deep analytics report compiled.', { isAnalyzed: true }, { analyticsData: analyzeRes.data });
      await new Promise(r => setTimeout(r, 1200));

      // Stage 5: RUNNING INFERENCE
      updateState(id, 'RUNNING INFERENCE', 'Auto-ML baseline fitting in progress...');
      const columns = processRes.data.columns || [];
      const targetCol = columns.includes('dropout_risk') 
        ? 'dropout_risk' 
        : columns.includes('target')
          ? 'target'
          : columns[0] || 'target';

      const predictFormData = new FormData();
      predictFormData.append('file', file);
      predictFormData.append('target_column', targetCol);
      const predictRes = await api.post('/predict-csv', predictFormData);

      updateState(id, 'RUNNING INFERENCE', 'Running Isolation Forest outlier model...');
      const anomalyFormData = new FormData();
      anomalyFormData.append('file', file);
      anomalyFormData.append('contamination', '0.05');
      const anomalyRes = await api.post('/detect-anomalies', anomalyFormData);

      updateState(
        id, 
        'RUNNING INFERENCE', 
        `Inference completed. Random Forest metrics optimized. Outliers identified.`, 
        { isModelTrained: true }, 
        { mlResult: predictRes.data, anomalyResult: anomalyRes.data }
      );
      await new Promise(r => setTimeout(r, 1500));

      // Stage 6: SYNTHESIZING INSIGHTS
      updateState(id, 'SYNTHESIZING INSIGHTS', 'Synthesizing report via Groq LLM...');
      const insightsRes = await api.post('/generate-insights', {
        analysis_data: {
          ...analyzeRes.data,
          ml_result: predictRes.data,
          anomaly_result: anomalyRes.data
        },
        context: "You are Grok, the resident system AI. Synthesize 3 concise, highly professional business insights grounded in the anomaly analysis and model metrics."
      });

      // Complete
      updateState(
        id, 
        'COMPLETE', 
        'Orchestration complete. System dashboard ready.', 
        { isInsightsGenerated: true },
        { 
          analyticsData: {
            ...analyzeRes.data,
            aiInsightsText: insightsRes.data.insights
          }
        }
      );

    } catch (err: any) {
      console.error(err);
      updateState(id, 'ERROR', `Orchestration halted: ${err.message || 'Server error'}`);
    }
  };

  const handleFileUpload = async (file: File, autoProcess: boolean) => {
    const validExt = ['.csv', '.xls', '.xlsx'];
    const isValid = validExt.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      alert('Please upload a valid CSV or Excel file.');
      return;
    }

    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      alert('Please upload a file smaller than 50 MB.');
      return;
    }

    const id = crypto.randomUUID();
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Stage 1: INITIALIZING
      const newDataset: Dataset = {
        id,
        name: file.name,
        file,
        rawFile: file,
        stats: { rows: 0, columns: 0, nulls: 0, num_cols: 0, cat_cols: 0 },
        status: { isLoaded: false, isProcessed: false, isAnalyzed: false, isModelTrained: false, isInsightsGenerated: false },
        processedData: null,
        analyticsData: null,
        logs: [{ timestamp: getTimestamp(), message: 'System initialized. Awaiting upload completion...' }],
        engineState: 'INITIALIZING'
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDatasetId(id);

      const response = await api.post('/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const stats = {
        rows: response.data.rows,
        columns: response.data.columns.length,
        nulls: 0,
        num_cols: response.data.columns.length,
        cat_cols: 0
      };

      // Set Loaded to true
      setDatasets(prev => prev.map(ds => 
        ds.id === id 
          ? { 
              ...ds, 
              stats, 
              status: { ...ds.status, isLoaded: true },
              logs: [...ds.logs, { timestamp: getTimestamp(), message: `Dataset parsed: ${file.name}` }]
            }
          : ds
      ));

      // Trigger sequential orchestration
      await runFullPipeline(id, file, autoProcess);

    } catch (error) {
      console.error('Dataset upload failed', error);
      alert('Dataset upload failed. Please verify connection and try again.');
    }
  };

  const handleManualPipelineTrigger = async (id: string, handleMissing: string, scale: boolean, encode: boolean) => {
    const ds = datasets.find(d => d.id === id);
    if (!ds || !ds.rawFile) return;

    try {
      updateState(id, 'PROCESSING', 'Executing manual preprocessing strategies...');
      const processFormData = new FormData();
      processFormData.append('file', ds.rawFile);
      processFormData.append('config', JSON.stringify({
        handle_missing: handleMissing,
        scale_features: scale,
        encode_categorical: encode,
        scaling_method: 'standard',
        encoding_method: 'onehot'
      }));
      const processRes = await api.post('/process-csv', processFormData);
      updateState(id, 'PROCESSING', 'Manual Preprocessing successfully completed.', { isProcessed: true }, { processedData: processRes.data });
      await new Promise(r => setTimeout(r, 1000));

      // Proceed through rest of stages sequentially
      await runFullPipeline(id, ds.rawFile, true);

    } catch (err: any) {
      console.error(err);
      updateState(id, 'ERROR', `Manual preprocessing failed: ${err.message || 'Server error'}`);
    }
  };


  const handleAnalyzed = useCallback((id: string, data: any) => {
    setDatasets(prev => prev.map(ds => 
      ds.id === id 
        ? { 
            ...ds, 
            analyticsData: data, 
            status: { ...ds.status, isAnalyzed: true },
            logs: [...ds.logs, { timestamp: getTimestamp(), message: 'Exploratory data analysis report successfully compiled.' }]
          }
        : ds
    ));
  }, []);

  const handleModelTrained = useCallback((id: string, mlResult: any) => {
    setDatasets(prev => prev.map(ds => 
      ds.id === id 
        ? { 
            ...ds, 
            mlResult, 
            status: { ...ds.status, isModelTrained: true },
            logs: [...ds.logs, { timestamp: getTimestamp(), message: `Auto-ML model successfully converged (${mlResult.model_type}).` }]
          }
        : ds
    ));
  }, []);

  const handleAnomalyDetected = useCallback((id: string, anomalyResult: any) => {
    setDatasets(prev => prev.map(ds => 
      ds.id === id 
        ? { 
            ...ds, 
            anomalyResult, 
            status: { ...ds.status, isInsightsGenerated: true },
            logs: [...ds.logs, { timestamp: getTimestamp(), message: `Isolation Forest outlier analysis complete (${anomalyResult.anomaly_percentage}% anomalies detected).` }]
          }
        : ds
    ));
  }, []);

  const pipelineStatus = activeDataset?.status || { 
    isLoaded: false, 
    isProcessed: false, 
    isAnalyzed: false, 
    isModelTrained: false, 
    isInsightsGenerated: false 
  };

  return (
    <div className="app-container">
      <Sidebar 
        status={pipelineStatus} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      
      <main className="main-content">
        <Hero />
        
        {currentView === 'dashboard' && (
          <Dashboard 
            activeDataset={activeDataset}
            datasets={datasets}
            onSelectDataset={setActiveDatasetId}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'data-manager' && (
          <DataManager 
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            onFileUpload={handleFileUpload}
            onSelectDataset={setActiveDatasetId}
            onManualPipelineTrigger={handleManualPipelineTrigger}
          />
        )}

        {currentView === 'analytics' && (
          <Analytics 
            activeDataset={activeDataset}
            onAnalyzed={handleAnalyzed}
          />
        )}

        {currentView === 'ml-workbench' && (
          <MachineLearning 
            activeDataset={activeDataset}
            onModelTrained={handleModelTrained}
            onAnomalyDetected={handleAnomalyDetected}
          />
        )}

        {currentView === 'ai-chat' && (
          <AIChatPage 
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            onSelectDataset={setActiveDatasetId}
          />
        )}

        {currentView === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
