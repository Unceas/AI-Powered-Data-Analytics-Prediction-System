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

function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('processing');
  const [currentView, setCurrentView] = useState('pipeline');

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const handleFileUpload = async (file: File, autoProcess: boolean) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Initial stats parsing
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const headers = lines[0]?.split(',') || [];
      
      const stats = {
        rows: lines.length - 1,
        columns: headers.length,
        nulls: 0,
        num_cols: headers.length,
        cat_cols: 0
      };

      const newDataset: Dataset = {
        id,
        name: file.name,
        file,
        stats,
        status: { isLoaded: true, isProcessed: false, isAnalyzed: false },
        processedData: null,
        analyticsData: null
      };

      setDatasets(prev => [...prev, newDataset]);
      setActiveDatasetId(id);

      if (autoProcess) {
        await triggerAutoProcess(id, file);
      }
    };
    reader.readAsText(file);
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
          ? { ...ds, processedData: response.data, status: { ...ds.status, isProcessed: true } }
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

  const pipelineStatus = activeDataset?.status || { isLoaded: false, isProcessed: false, isAnalyzed: false };

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
                    <MachineLearning file={activeDataset.file} />
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
          />
        )}

        {currentView === 'settings' && <Settings />}
      </main>

      <AIInsightsBubble datasets={datasets} />
    </div>
  );
}

export default App;
