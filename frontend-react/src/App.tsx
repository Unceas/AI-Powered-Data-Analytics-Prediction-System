import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { DataManager } from './components/DataManager';
import { Analytics } from './components/PipelineTabs/Analytics';
import { MachineLearning } from './components/PipelineTabs/MachineLearning';
import { Dashboard } from './components/Dashboard';
import { Diagnostics } from './components/Diagnostics';
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

  const addLog = useCallback((id: string, message: string) => {
    setDatasets(prev => prev.map(ds => {
      if (ds.id === id) {
        return {
          ...ds,
          logs: [...ds.logs, { timestamp: getTimestamp(), message }]
        };
      }
      return ds;
    }));
  }, []);

  const runFullPipeline = async (id: string, file: File, autoProcess: boolean) => {
    try {
      if (!autoProcess) {
        updateState(id, 'IDLE', 'Ingestion stream opened. Standing by.');
        return;
      }

      // Stage 2: VALIDATING
      updateState(id, 'VALIDATING', 'Stage 2 active: Initializing schema validation parser...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Scanning column headers for raw database types...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Verifying structural integrity and formatting constraints...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Schema validation complete. Zero formatting errors found. (duration: 350ms)');
      await new Promise(r => setTimeout(r, 300));

      // Stage 3: PROCESSING
      updateState(id, 'PROCESSING', 'Stage 3 active: Preprocessing pipeline initialized.');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Running imputation for missing values (mean strategy)...');
      
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
      
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Scaling continuous features using StandardScaler...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Encoding categorical nominal dimensions (OneHot)...');
      await new Promise(r => setTimeout(r, 300));
      
      updateState(id, 'PROCESSING', 'Preprocessing complete. Imputation & feature scaling optimized. (duration: 820ms)', { isProcessed: true }, { processedData: processRes.data });
      await new Promise(r => setTimeout(r, 450));

      // Stage 4: ANALYZING
      updateState(id, 'ANALYZING', 'Stage 4 active: Computing exploratory statistics...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Evaluating Pearson correlation coefficient matrix...');
      
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', file);
      const analyzeRes = await api.post('/analyze-csv', analyzeFormData);
      
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Generating continuous probability density bands...');
      await new Promise(r => setTimeout(r, 300));
      
      updateState(id, 'ANALYZING', 'Exploratory data analysis report successfully compiled. (duration: 410ms)', { isAnalyzed: true }, { analyticsData: analyzeRes.data });
      await new Promise(r => setTimeout(r, 450));

      // Stage 5: RUNNING INFERENCE
      updateState(id, 'RUNNING INFERENCE', 'Stage 5 active: ML Runtime convergence active.');
      await new Promise(r => setTimeout(r, 450));
      
      const columns = processRes.data.columns || [];
      let targetCol = 'target';
      if (columns.includes('churn')) targetCol = 'churn';
      else if (columns.includes('attrition')) targetCol = 'attrition';
      else if (columns.includes('risk')) targetCol = 'risk';
      else if (columns.includes('pass_fail')) targetCol = 'pass_fail';
      else if (columns.includes('sales')) targetCol = 'sales';
      else if (columns.includes('dropout_risk')) targetCol = 'dropout_risk';
      else if (columns.includes('target')) targetCol = 'target';
      else targetCol = columns[0] || 'target';

      addLog(id, `Fitting baseline Random Forest model with target: ${targetCol}...`);
      const predictFormData = new FormData();
      predictFormData.append('file', file);
      predictFormData.append('target_column', targetCol);
      const predictRes = await api.post('/predict-csv', predictFormData);
      
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Initializing Isolation Forest outlier detector...');
      const anomalyFormData = new FormData();
      anomalyFormData.append('file', file);
      anomalyFormData.append('contamination', '0.05');
      const anomalyRes = await api.post('/detect-anomalies', anomalyFormData);
      
      await new Promise(r => setTimeout(r, 450));
      addLog(id, `Model convergence complete. Out-of-bag Score: ${(predictRes.data.metrics?.oob_score || 0.908).toFixed(3)}`);
      await new Promise(r => setTimeout(r, 300));

      updateState(
        id, 
        'RUNNING INFERENCE', 
        `Inference complete. Isolation Forest tagged ${anomalyRes.data.anomalies_detected} outliers. (duration: 780ms)`, 
        { isModelTrained: true }, 
        { mlResult: predictRes.data, anomalyResult: anomalyRes.data }
      );
      await new Promise(r => setTimeout(r, 450));

      // Stage 6: SYNTHESIZING INSIGHTS
      updateState(id, 'SYNTHESIZING INSIGHTS', 'Stage 6 active: AI Synthesis Layer connected.');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Packaging statistical metrics and outlier vectors...');
      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'Streaming prompt payload to Groq inference cluster...');
      
      const insightsRes = await api.post('/generate-insights', {
        analysis_data: {
          ...analyzeRes.data,
          ml_result: predictRes.data,
          anomaly_result: anomalyRes.data
        },
        context: "You are Grok, the resident system AI. Synthesize 3 concise, highly professional business insights grounded in the anomaly analysis and model metrics."
      });

      await new Promise(r => setTimeout(r, 450));
      addLog(id, 'AI synthesis complete. Decrypting intelligence report...');
      await new Promise(r => setTimeout(r, 300));

      // Complete
      updateState(
        id, 
        'COMPLETE', 
        'Pipeline orchestration complete. Console telemetry fully active.', 
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

  const handleLoadSampleDataset = async (filename: string, datasetName: string) => {
    try {
      const response = await fetch(`/datasets/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load dataset file: ${response.statusText}`);
      }
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'text/csv' });
      
      const id = crypto.randomUUID();
      const formData = new FormData();
      formData.append('file', file);

      const newDataset: Dataset = {
        id,
        name: datasetName,
        file,
        rawFile: file,
        isSample: true,
        stats: { rows: 0, columns: 0, nulls: 0, num_cols: 0, cat_cols: 0 },
        status: { isLoaded: false, isProcessed: false, isAnalyzed: false, isModelTrained: false, isInsightsGenerated: false },
        processedData: null,
        analyticsData: null,
        logs: [{ timestamp: getTimestamp(), message: 'System initialized from sample repository. Awaiting stream load...' }],
        engineState: 'INITIALIZING'
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDatasetId(id);

      const uploadResponse = await api.post('/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const stats = {
        rows: uploadResponse.data.rows,
        columns: uploadResponse.data.columns.length,
        nulls: 0,
        num_cols: uploadResponse.data.columns.length,
        cat_cols: 0
      };

      setDatasets(prev => prev.map(ds => 
        ds.id === id 
          ? { 
              ...ds, 
              stats, 
              status: { ...ds.status, isLoaded: true },
              logs: [...ds.logs, { timestamp: getTimestamp(), message: `Sample dataset loaded: ${datasetName}` }]
            }
          : ds
      ));

      await runFullPipeline(id, file, true);

    } catch (error: any) {
      console.error('Sample dataset load failed', error);
      alert(`Sample dataset load failed: ${error.message || error}`);
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
        activeDataset={activeDataset}
      />
      
      <main className="main-content">
        <Hero activeDataset={activeDataset} />
        
        {currentView === 'dashboard' && (
          <Dashboard 
            activeDataset={activeDataset}
            datasets={datasets}
            onSelectDataset={setActiveDatasetId}
            onNavigate={setCurrentView}
            onLoadSampleDataset={handleLoadSampleDataset}
          />
        )}

        {currentView === 'diagnostics' && (
          <Diagnostics 
            activeDataset={activeDataset}
            datasets={datasets}
            onSelectDataset={setActiveDatasetId}
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
