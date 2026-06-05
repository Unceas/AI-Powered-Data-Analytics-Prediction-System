import { useRef, useState } from 'react';
import { UploadCloud, FileText, Clock, Settings, ArrowRight } from 'lucide-react';
import './DataManager.css';
import type { Dataset } from '../types';

const SAMPLE_DATASETS_INFO = [
  { filename: "customer_churn.csv", name: "Customer Churn Prediction" },
  { filename: "employee_attrition.csv", name: "Employee Attrition Analysis" },
  { filename: "healthcare_risk.csv", name: "Healthcare Risk Assessment" },
  { filename: "student_performance.csv", name: "Student Performance Analytics" },
  { filename: "retail_sales.csv", name: "Retail Sales Forecasting" }
];

interface DataManagerProps {
  datasets: Dataset[];
  activeDatasetId: string | null;
  onFileUpload: (file: File, autoProcess: boolean) => void;
  onSelectDataset: (id: string) => void;
  onManualPipelineTrigger: (id: string, handleMissing: string, scale: boolean, encode: boolean) => void;
  onLoadSampleDataset?: (filename: string, datasetName: string) => void;
  onNavigate?: (view: string) => void;
}

export function DataManager({ 
  datasets, 
  activeDatasetId, 
  onFileUpload, 
  onSelectDataset, 
  onManualPipelineTrigger,
  onLoadSampleDataset,
  onNavigate
}: DataManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);
  const [selectedSample, setSelectedSample] = useState("customer_churn.csv");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preprocessing states
  const [handleMissing, setHandleMissing] = useState('mean');
  const [scaleFeatures, setScaleFeatures] = useState(true);
  const [encodeCategorical, setEncodeCategorical] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validExt = ['.csv', '.xls', '.xlsx'];
      const isValid = validExt.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isValid) {
        onFileUpload(file, autoProcess);
      } else {
        alert('Please upload a valid CSV or Excel file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0], autoProcess);
    }
  };

  const runPipeline = async () => {
    if (!activeDataset) return;
    setIsProcessing(true);
    try {
      await onManualPipelineTrigger(activeDataset.id, handleMissing, scaleFeatures, encodeCategorical);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="data-manager-view animate-fade-in">
      <div className="view-header">
        <h2>Data Management & Ingestion</h2>
        <p>Upload raw CSV/Excel spreadsheets, configure validation schemas, and preprocess features.</p>
      </div>

      <div className="manager-grid">
        {/* Ingestion Widget */}
        <div className="ingestion-widget card">
          <div className="widget-title">
            <UploadCloud size={16} className="text-cyan" />
            <h3>INGEST NEW DATASET</h3>
          </div>

          <div 
            className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".csv,.xls,.xlsx" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <UploadCloud className="upload-icon-large active-glow" size={36} />
            <div className="upload-instructions">
              <h4>Drag & drop spreadsheet here</h4>
              <p>Supports .csv, .xlsx, .xls formats (max 50MB)</p>
            </div>
          </div>

          <div className="auto-process-toggle-bar">
            <label className="checkbox-item">
              <input 
                type="checkbox" 
                checked={autoProcess} 
                onChange={(e) => setAutoProcess(e.target.checked)} 
              />
              <span>Auto-process pipeline on ingest</span>
            </label>
          </div>

          <div className="sample-dataset-ingest-bar">
            <span className="divider-label">OR</span>
            <div className="sample-action-row">
              <select 
                className="sample-select text-left"
                value={selectedSample}
                onChange={(e) => setSelectedSample(e.target.value)}
              >
                {SAMPLE_DATASETS_INFO.map(item => (
                  <option key={item.filename} value={item.filename}>{item.name}</option>
                ))}
              </select>
              <button 
                className="btn-secondary btn-use-sample"
                onClick={() => {
                  const item = SAMPLE_DATASETS_INFO.find(x => x.filename === selectedSample);
                  if (item && onLoadSampleDataset) {
                    onLoadSampleDataset(item.filename, item.name);
                    if (onNavigate) onNavigate('diagnostics');
                  }
                }}
              >
                Use Sample Dataset
              </button>
            </div>
          </div>
        </div>

        {/* Datasets Repository */}
        <div className="repo-widget card">
          <div className="widget-title">
            <FileText size={16} className="text-cyan" />
            <h3>DATASET REPOSITORY</h3>
          </div>

          <div className="dataset-pills-list">
            {datasets.length === 0 ? (
              <div className="empty-repo-message">
                <FileText size={24} style={{ opacity: 0.2 }} />
                <p>No datasets uploaded yet.</p>
              </div>
            ) : (
              datasets.map(ds => (
                <div 
                  key={ds.id} 
                  className={`repo-dataset-pill ${ds.id === activeDatasetId ? 'active' : ''}`}
                  onClick={() => onSelectDataset(ds.id)}
                >
                  <FileText size={16} />
                  <div className="repo-pill-meta">
                    <span className="name">{ds.name}</span>
                    <span className="size">{(ds.stats.rows || 0).toLocaleString()} rows</span>
                  </div>
                  {ds.status.isProcessed ? (
                    <span className="status-badge preprocessed">Processed</span>
                  ) : (
                    <span className="status-badge pending">Pending</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeDataset && (
        <div className="preprocessing-workspace-wrapper grid-split animate-fade-in">
          {/* Preprocessing Controls */}
          <div className="preprocessing-config-widget card">
            <div className="widget-title">
              <Settings size={16} className="text-cyan" />
              <h3>PREPROCESSING PIPELINE</h3>
            </div>

            <div className="preprocessing-form">
              <div className="form-group">
                <label className="form-label">Missing Value Strategy</label>
                <select 
                  className="form-select"
                  value={handleMissing}
                  onChange={(e) => setHandleMissing(e.target.value)}
                >
                  <option value="mean">Mean (Fill numeric with mean, categorical with mode)</option>
                  <option value="median">Median (Fill numeric with median, categorical with mode)</option>
                  <option value="mode">Mode (Fill all with most frequent)</option>
                  <option value="drop">Drop (Remove rows with any nulls)</option>
                  <option value="constant">Constant (Fill with 0 or 'Unknown')</option>
                </select>
                <span className="form-help">Recommended strategy depends on feature skewness.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Feature Scaling</label>
                <label className="form-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={scaleFeatures}
                    onChange={(e) => setScaleFeatures(e.target.checked)}
                  />
                  <span>Standardize Continuous Features (StandardScaler)</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Categorical Encoding</label>
                <label className="form-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={encodeCategorical}
                    onChange={(e) => setEncodeCategorical(e.target.checked)}
                  />
                  <span>Encode Nominal Features (OneHot Encoding)</span>
                </label>
              </div>

              <button 
                className="btn-primary run-pipeline-btn"
                onClick={runPipeline}
                disabled={isProcessing}
              >
                {isProcessing ? 'Preprocessing...' : '⚡ Run Preprocessing Pipeline'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Dataset Preview */}
          <div className="preview-widget card">
            <div className="widget-title">
              <FileText size={16} className="text-cyan" />
              <h3>DATASET PREVIEW (TOP 5 ROWS)</h3>
            </div>

            {activeDataset.processedData ? (
              <div className="preview-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      {activeDataset.processedData.columns.slice(0, 6).map((col: string) => (
                        <th key={col}>{col}</th>
                      ))}
                      {activeDataset.processedData.columns.length > 6 && <th>...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {activeDataset.processedData.preview.slice(0, 5).map((row: any, i: number) => (
                      <tr key={i}>
                        {activeDataset.processedData.columns.slice(0, 6).map((col: string) => (
                          <td key={col}>{row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NaN'}</td>
                        ))}
                        {activeDataset.processedData.columns.length > 6 && <td className="text-secondary">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-preview-message">
                <Clock size={24} style={{ opacity: 0.2 }} />
                <p>Run preprocessing pipeline to see schema and table preview.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
