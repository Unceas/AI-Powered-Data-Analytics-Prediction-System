import { useState, useCallback, useEffect } from 'react';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { IntelligenceReport } from './components/IntelligenceReport';
import { LandingExperience } from './components/LandingExperience';
import { BrandIcon } from './components/BrandIcon';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { WorkspaceContextBanner } from './components/WorkspaceContextBanner';
import './App.css';

import type { Dataset } from './types';

const getTimestamp = () => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `[${h}:${m}:${s}]`;
};

function AppContent() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'product' | 'workspace'>(() => {
    return (localStorage.getItem('insightgrid-viewmode') as 'product' | 'workspace') || 'product';
  });

  const handleOpenWorkspace = () => {
    setViewMode('workspace');
    localStorage.setItem('insightgrid-viewmode', 'workspace');
  };

  const handleExitWorkspace = () => {
    setViewMode('product');
    localStorage.setItem('insightgrid-viewmode', 'product');
  };

  // Initialize custom user preferences on mount
  useState(() => {
    const savedFontSize = localStorage.getItem('app-font-size') || 'standard';
    const savedDensity = localStorage.getItem('app-density') || 'standard';
    document.documentElement.setAttribute('data-font-size', savedFontSize);
    document.documentElement.setAttribute('data-density', savedDensity);
  });

  const activeDataset = datasets.find(d => d.id === activeDatasetId);
  const { resetWorkspaceOnDatasetChange } = useWorkspace();

  // Synchronize root workspace context with dataset selection
  useEffect(() => {
    resetWorkspaceOnDatasetChange(activeDatasetId, activeDataset?.name || null);
  }, [activeDatasetId, activeDataset?.name, resetWorkspaceOnDatasetChange]);

  const generateReport = async () => {
    if (!activeDataset) return;
    setIsGeneratingReport(true);
    // Wait for the hidden component to render Recharts fully without animations
    await new Promise(r => setTimeout(r, 1200));

    try {
      const reportRoot = document.getElementById('pdf-report-render-root');
      if (!reportRoot) {
        throw new Error('Report container element not found.');
      }

      const pages = reportRoot.querySelectorAll('.report-page');
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2, // Retain high resolution/crispness
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      const filename = `InsightGrid_Intelligence_Report_${activeDataset.name.replace(/\.[^/.]+$/, "")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("An error occurred during PDF report generation.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
        updateState(id, 'IDLE', 'Dataset loaded. Ready for analysis.');
        return;
      }

      // Stage 2: UNDERSTANDING
      updateState(id, 'VALIDATING', 'Profiling dataset structure and column distributions...');
      await new Promise(r => setTimeout(r, 350));
      addLog(id, 'Evaluating column data types, missingness, and cardinality...');

      const understandFormData = new FormData();
      understandFormData.append('file', file);
      understandFormData.append('dataset_id', id);
      const understandRes = await api.post('/understand-csv', understandFormData);

      updateState(
        id, 
        'VALIDATING', 
        `Data understanding complete. Quality score: ${understandRes.data.quality_score}/100.`,
        {},
        { understanding: understandRes.data, dataset_health_score: understandRes.data.quality_score }
      );
      await new Promise(r => setTimeout(r, 300));

      // Stage 3: PROCESSING
      updateState(id, 'PROCESSING', 'Preprocessing data and cleaning values...');
      await new Promise(r => setTimeout(r, 350));
      addLog(id, 'Imputing missing values and scaling continuous features...');
      
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
      
      updateState(id, 'PROCESSING', 'Data preprocessing complete.', { isProcessed: true }, { processedData: processRes.data });
      await new Promise(r => setTimeout(r, 350));

      // Stage 4: ANALYZING
      updateState(id, 'ANALYZING', 'Analyzing patterns, correlations, and outliers...');
      await new Promise(r => setTimeout(r, 350));
      addLog(id, 'Calculating Pearson correlation matrix and distribution statistics...');
      
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', file);
      const analyzeRes = await api.post('/analyze-csv', analyzeFormData);
      
      addLog(id, 'Running multivariate outlier scan...');
      const anomalyFormData = new FormData();
      anomalyFormData.append('file', file);
      anomalyFormData.append('contamination', '0.05');
      const anomalyRes = await api.post('/detect-anomalies', anomalyFormData);

      updateState(
        id, 
        'ANALYZING', 
        `Analysis complete. Flagged ${anomalyRes.data.anomalies_detected} outlier records.`, 
        { isAnalyzed: true }, 
        { 
          analyticsData: analyzeRes.data,
          anomalyResult: anomalyRes.data,
          dataset_health_score: analyzeRes.data.dataset_health_score,
          dataset_health_details: analyzeRes.data.dataset_health_details
        }
      );
      await new Promise(r => setTimeout(r, 350));

      // Stage 5: PREDICTIONS (Prediction Engine V1.1)
      updateState(id, 'RUNNING INFERENCE', 'Selecting and training candidate predictive models...');
      await new Promise(r => setTimeout(r, 350));
      
      const candidateTargets = understandRes.data.candidate_targets || [];
      const columns = processRes.data.columns || [];
      let targetCol = candidateTargets.length > 0 ? candidateTargets[0] : (columns[0] || 'target');

      addLog(id, `Training candidate models on target: ${targetCol}...`);
      const predictFormData = new FormData();
      predictFormData.append('file', file);
      predictFormData.append('target_column', targetCol);
      const predictRes = await api.post('/predict-csv', predictFormData);
      
      addLog(id, `Best candidate model selected: ${predictRes.data.model_type} (Reliability: ${predictRes.data.reliability || 'High'})`);
      updateState(
        id, 
        'RUNNING INFERENCE', 
        `Prediction model selection converged.`, 
        { isModelTrained: true }, 
        { 
          mlResult: predictRes.data, 
          reliability_score: predictRes.data.reliability_score,
          reliability_details: predictRes.data.reliability_details
        }
      );
      await new Promise(r => setTimeout(r, 350));

      // Stage 6: EVIDENCE & INSIGHTS
      updateState(id, 'SYNTHESIZING INSIGHTS', 'Extracting deterministic evidence and synthesizing findings...');
      await new Promise(r => setTimeout(r, 350));
      addLog(id, 'Extracting structured analytical evidence items...');

      const evidenceRes = await api.post('/extract-evidence', {
        dataset_id: id,
        analysis_id: `an-${id.slice(0, 8)}`,
        understanding: understandRes.data,
        analytics_data: analyzeRes.data,
        anomaly_result: anomalyRes.data,
        ml_result: predictRes.data
      });

      const evidenceItems = evidenceRes.data.evidence || [];
      addLog(id, `Extracted ${evidenceItems.length} verified evidence items.`);

      const insightsRes = await api.post('/generate-insights', {
        analysis_data: {
          ...analyzeRes.data,
          ml_result: predictRes.data,
          anomaly_result: anomalyRes.data
        },
        context: "Synthesize concise, grounded findings directly from the verified analytical evidence.",
        dataset_name: file.name
      });

      const insightList = Array.isArray(insightsRes.data.insights) ? insightsRes.data.insights : [];

      // Stage 7: INVESTIGATION & DECISION BRIEF
      addLog(id, 'Deriving contextual investigation paths and synthesizing Decision Brief...');
      const invRes = await api.post('/investigate-insight', {
        dataset_id: id,
        analysis_id: `an-${id.slice(0, 8)}`,
        understanding: understandRes.data,
        insight: insightList[0] || null,
        evidence_items: evidenceItems,
        target_column: targetCol
      });

      const invContext = invRes.data.investigation;

      const briefRes = await api.post('/generate-decision-brief', {
        dataset_id: id,
        analysis_id: `an-${id.slice(0, 8)}`,
        insights: insightList,
        evidence_items: evidenceItems,
        ml_result: predictRes.data,
        investigation: invContext
      });

      const decisionBrief = briefRes.data.decision_brief;

      // Complete
      updateState(
        id, 
        'COMPLETE', 
        'Analytics pipeline complete. Ready for exploration.', 
        { isInsightsGenerated: true },
        { 
          evidence: evidenceItems,
          insights: insightList,
          decisionBrief: decisionBrief,
          investigations: invContext ? [invContext] : [],
          activeInvestigation: invContext,
          analyticsData: {
            ...analyzeRes.data,
            aiInsightsText: Array.isArray(insightsRes.data.insights) ? "" : (insightsRes.data.insights || "")
          }
        }
      );

    } catch (err: any) {
      console.error(err);
      updateState(id, 'ERROR', `Analysis stopped: ${err.message || 'Server error'}`);
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

  if (viewMode === 'product') {
    return (
      <LandingExperience 
        onOpenWorkspace={handleOpenWorkspace}
        onLoadSampleDataset={handleLoadSampleDataset}
        onFileUpload={handleFileUpload}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        status={pipelineStatus} 
        currentView={currentView}
        onNavigate={setCurrentView}
        activeDataset={activeDataset}
        onExitWorkspace={handleExitWorkspace}
      />
      
      <main className="main-content">
        <Hero activeDataset={activeDataset} isGeneratingReport={isGeneratingReport} />
        <WorkspaceContextBanner onNavigate={setCurrentView} />
        
        {currentView === 'dashboard' && (
          <Dashboard 
            activeDataset={activeDataset}
            datasets={datasets}
            onSelectDataset={setActiveDatasetId}
            onNavigate={setCurrentView}
            onLoadSampleDataset={handleLoadSampleDataset}
            onGenerateReport={generateReport}
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
            onLoadSampleDataset={handleLoadSampleDataset}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'analytics' && (
          <Analytics 
            activeDataset={activeDataset}
            onAnalyzed={handleAnalyzed}
            onGenerateReport={generateReport}
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
            onGenerateReport={generateReport}
          />
        )}

        {currentView === 'settings' && <Settings />}
      </main>

      {/* Hidden container for PDF generation rendering */}
      {activeDataset && isGeneratingReport && (
        <div id="pdf-report-render-root" style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', zIndex: -1000 }}>
          <IntelligenceReport activeDataset={activeDataset} />
        </div>
      )}

      {/* Premium Loader Overlay for PDF Generation */}
      {isGeneratingReport && (
        <div className="pdf-generation-overlay">
          <div className="pdf-generation-spinner-box">
            <BrandIcon size={44} className="logo-loading-pulse" />
            <h4>Generating Intelligence Report</h4>
            <p>Compiling statistics, rendering vector charts, and synthesizing recommendations...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
}
