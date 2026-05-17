import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Hero } from './components/Hero';
import { UploadSection } from './components/UploadSection';
import { DataProcessing } from './components/PipelineTabs/DataProcessing';
import { Analytics } from './components/PipelineTabs/Analytics';
import { MachineLearning } from './components/PipelineTabs/MachineLearning';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { AIInsightsBubble } from './components/AIInsightsBubble';
import api from './utils/api';
import './App.css';

import type { Dataset } from './types';

const getTimestamp = () => {
  const now = new Date();
  return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
};

function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('processing');
  const [currentView, setCurrentView] = useState('pipeline');

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const handleFileUpload = async (file: File, autoProcess: boolean) => {
    const validExt = ['.csv', '.xls', '.xlsx'];
    const isValid = validExt.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      alert('Please upload a valid CSV or Excel file.');
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      alert('Please upload a file smaller than 10 MB.');
      return;
    }

    const id = crypto.randomUUID();
    const formData = new FormData();
    formData.append('file', file);

    try {
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

      const newDataset: Dataset = {
        id,
        name: file.name,
        file,
        stats,
        status: { isLoaded: true, isProcessed: false, isAnalyzed: false, isModelTrained: false, isInsightsGenerated: false },
        processedData: null,
        analyticsData: null,
        logs: [{ timestamp: getTimestamp(), message: `Dataset uploaded: ${file.name}` }]
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDatasetId(id);

      if (autoProcess) {
        await triggerAutoProcess(id, file);
      }
    } catch (error) {
      console.error('Dataset upload failed', error);
      alert('Dataset upload failed. Please check the file and try again.');
    }
  };

  const triggerAutoProcess = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify({
      handle_missing: 'mean',
      scale_features: true,
      encode_categorical: true,
      scaling_method: 'standard',
      encoding_method: 'onehot'
    }));

    try {
      const response = await api.post('/process-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setDatasets(prev => prev.map(ds => 
        ds.id === id 
          ? { 
              ...ds, 
              processedData: response.data, 
              status: { ...ds.status, isProcessed: true },
              logs: [...ds.logs, { timestamp: getTimestamp(), message: 'Cleaning complete (Auto-processed)' }]
            }
          : ds
      ));
    } catch (error) {
      console.error('Auto-processing failed', error);
    }
  };

  const updateDatasetStatus = useCallback((id: string, statusKey: keyof Dataset['status'], value: boolean, data?: any) => {
    setDatasets(prev => prev.map(ds => {
      if (ds.id === id) {
        const newStatus = { ...ds.status, [statusKey]: value };
        const updates: Partial<Dataset> = { status: newStatus };
        if (statusKey === 'isProcessed') updates.processedData = data;
        if (statusKey === 'isAnalyzed') updates.analyticsData = data;
        
        if (value && !ds.status[statusKey]) {
          const logMsgs: Record<string, string> = {
            'isProcessed': 'Cleaning complete',
            'isAnalyzed': 'Analytics generated',
            'isModelTrained': 'Model inference executed',
            'isInsightsGenerated': 'AI insights generated'
          };
          const msg = logMsgs[statusKey as string];
          if (msg) {
            updates.logs = [...ds.logs, { timestamp: getTimestamp(), message: msg }];
          }
        }
        
        return { ...ds, ...updates };
      }
      return ds;
    }));
  }, []);

  const tabs = [
    { id: 'processing', label: '🧹 Data Processing' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'ml', label: '🤖 Machine Learning' }
  ];

  const pipelineStatus = activeDataset?.status || { isLoaded: false, isProcessed: false, isAnalyzed: false, isModelTrained: false, isInsightsGenerated: false };

  return (
    <div className="app-container">
      <Sidebar 
        status={pipelineStatus} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      
      <main className="main-content">
        <Hero />
        
        {currentView === 'pipeline' && (
          <>
            <UploadSection 
              onFileUpload={handleFileUpload} 
              datasets={datasets}
              activeDatasetId={activeDatasetId}
              onSelectDataset={setActiveDatasetId}
            />

            {activeDataset && (
              <div className="pipeline-workspace animate-fade-in">
                <div className="tabs-header">
                  {tabs.map(tab => (
                    <button 
                      key={tab.id}
                      className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="tab-content card">
                  {activeTab === 'processing' && (
                    <DataProcessing 
                      file={activeDataset.file} 
                      onProcessed={(data) => updateDatasetStatus(activeDataset.id, 'isProcessed', true, data)} 
                      cachedResult={activeDataset.processedData}
                    />
                  )}
                  {activeTab === 'analytics' && (
                    <Analytics 
                      file={activeDataset.file} 
                      cachedData={activeDataset.analyticsData}
                      onAnalyzed={(data) => updateDatasetStatus(activeDataset.id, 'isAnalyzed', true, data)} 
                    />
                  )}
                  {activeTab === 'ml' && (
                    <MachineLearning 
                      file={activeDataset.file} 
                      onModelTrained={() => updateDatasetStatus(activeDataset.id, 'isModelTrained', true)}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'dashboard' && (
          <Dashboard 
            dataStats={activeDataset?.stats}
            pipelineStatus={pipelineStatus}
            analyticsData={activeDataset?.analyticsData}
            logs={activeDataset?.logs || []}
          />
        )}

        {currentView === 'settings' && <Settings />}
      </main>

      <AIInsightsBubble 
        datasets={datasets} 
        onInsightsGenerated={(id) => updateDatasetStatus(id, 'isInsightsGenerated', true)} 
      />
    </div>
  );
}

export default App;
