import { useRef, useState } from 'react';
import { UploadCloud, FileText, Clock, Settings, ArrowRight, Database } from 'lucide-react';
import './DataManager.css';
import type { Dataset } from '../types';

const SAMPLE_DATASETS_INFO = [
  { 
    filename: "customer_churn.csv", 
    name: "Customer Churn Prediction",
    industry: "Telecom",
    rows: 7043,
    cols: 21,
    type: "Classification (Binary)",
    capabilities: "Identify high-risk accounts, isolate behavioral drivers, determine retention actions"
  },
  { 
    filename: "healthcare_risk.csv", 
    name: "Healthcare Risk Assessment",
    industry: "Healthcare",
    rows: 10000,
    cols: 15,
    type: "Classification / Risk Analysis",
    capabilities: "Model re-admission probability, identify critical outliers, score diagnostic alerts"
  },
  {
    filename: "employee_attrition.csv",
    name: "Employee Attrition Analysis",
    industry: "Human Resources",
    rows: 1470,
    cols: 35,
    type: "Classification (Binary)",
    capabilities: "Analyze flight-risk probability, test compensation sensitivity, isolate satisfaction indices"
  },
  { 
    filename: "student_performance.csv", 
    name: "Student Performance Analytics",
    industry: "Education",
    rows: 1000,
    cols: 17,
    type: "Classification / Regression",
    capabilities: "Map academic risk thresholds, forecast final exam outcomes, optimize study programs"
  },
  { 
    filename: "retail_sales.csv", 
    name: "Retail Sales Forecasting",
    industry: "Retail / E-Commerce",
    rows: 8523,
    cols: 12,
    type: "Regression (Numerical)",
    capabilities: "Predict weekly store sales, analyze seasonal holiday peaks, allocate store inventory"
  }
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

      {/* Explore Sample Datasets Presets Grid */}
      <div className="sample-presets-container card">
        <div className="widget-title">
          <Database size={16} className="text-cyan" />
          <h3>EXPLORE SAMPLE DATASETS PRESETS</h3>
        </div>
        <div className="sample-presets-grid">
          {SAMPLE_DATASETS_INFO.map(item => (
            <div key={item.filename} className="sample-preset-card card interactive">
              <div className="sample-card-header">
                <span className="sample-industry-badge">{item.industry}</span>
                <h4>{item.name}</h4>
              </div>
              <div className="sample-card-meta-grid">
                <div className="meta-item">
                  <span className="lbl">Dimensions</span>
                  <span className="val">{item.rows.toLocaleString()} Rows × {item.cols} Columns</span>
                </div>
                <div className="meta-item">
                  <span className="lbl">Analysis Type</span>
                  <span className="val">{item.type}</span>
                </div>
              </div>
              <div className="sample-card-capabilities">
                <span className="lbl">Target Capabilities:</span>
                <p>{item.capabilities}</p>
              </div>
              <button 
                className="btn-primary btn-sm btn-load-sample"
                onClick={() => {
                  if (onLoadSampleDataset) {
                    onLoadSampleDataset(item.filename, item.name);
                    if (onNavigate) onNavigate('dashboard');
                  }
                }}
              >
                Launch Preset Session →
              </button>
            </div>
          ))}
        </div>
      </div>

      {activeDataset && (
        <div className="data-understanding-section animate-fade-in" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Data Understanding Card */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  DATA UNDERSTANDING PROFILE
                </span>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Structural Health: {activeDataset.understanding ? `${activeDataset.understanding.quality_score}/100` : `${activeDataset.dataset_health_score || 95}/100`}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn-secondary btn-sm"
                  onClick={() => onNavigate && onNavigate('analytics')}
                >
                  Explore Analysis & Patterns →
                </button>
                <button 
                  className="btn-primary btn-sm"
                  onClick={() => onNavigate && onNavigate('ml-workbench')}
                >
                  Open Predictions →
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Rows</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(activeDataset.understanding?.row_count || activeDataset.stats.rows || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Columns</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeDataset.understanding?.column_count || activeDataset.stats.columns || 0}
                </div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Duplicate Rows</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: (activeDataset.understanding?.duplicate_rows_count || 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {activeDataset.understanding?.duplicate_rows_count || 0}
                </div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate Targets</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                  {activeDataset.understanding?.candidate_targets?.length || 1}
                </div>
              </div>
            </div>

            {/* Column Profiles Table */}
            {activeDataset.understanding?.column_profiles && (
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>Column</th>
                      <th style={{ padding: '0.5rem' }}>Inferred Type</th>
                      <th style={{ padding: '0.5rem' }}>Missingness</th>
                      <th style={{ padding: '0.5rem' }}>Cardinality</th>
                      <th style={{ padding: '0.5rem' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDataset.understanding.column_profiles.map((prof: any) => (
                      <tr key={prof.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{prof.name}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ 
                            textTransform: 'uppercase', 
                            fontSize: '0.7rem', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            background: prof.inferred_type === 'numeric' ? 'rgba(59,130,246,0.1)' : (prof.inferred_type === 'categorical' ? 'rgba(168,85,247,0.1)' : 'rgba(34,197,94,0.1)'),
                            color: prof.inferred_type === 'numeric' ? '#3b82f6' : (prof.inferred_type === 'categorical' ? '#a855f7' : '#22c55e')
                          }}>
                            {prof.inferred_type}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', color: prof.missing_percentage > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {prof.missing_percentage}% ({prof.missing_count})
                        </td>
                        <td style={{ padding: '0.5rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                          {prof.cardinality} ({prof.unique_count} distinct)
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          {prof.is_candidate_target ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-color)', background: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px' }}>
                              Candidate Target
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Feature</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Limitations Notice */}
            {activeDataset.understanding?.limitations && activeDataset.understanding.limitations.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Analytical Considerations & Limitations
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeDataset.understanding.limitations.map((lim: string, i: number) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Preprocessing Workspace */}
          <div className="preprocessing-workspace-wrapper grid-split">
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
        </div>
      )}
    </div>
  );
}
