import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react';
import './UploadSection.css';

interface Dataset {
  id: string;
  name: string;
  status: { isLoaded: boolean; isProcessed: boolean; isAnalyzed: boolean };
  stats: any;
}

interface UploadSectionProps {
  onFileUpload: (file: File, autoProcess: boolean) => void;
  datasets: Dataset[];
  activeDatasetId: string | null;
  onSelectDataset: (id: string) => void;
}

export function UploadSection({ onFileUpload, datasets, activeDatasetId, onSelectDataset }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileUpload(file, autoProcess);
      } else {
        alert('Please upload a valid CSV file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0], autoProcess);
    }
  };

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  return (
    <div className="upload-container">
      <div className="upload-header-row">
        <h2 className="section-header">Data Management</h2>
        <div className="auto-process-toggle">
          <label className="checkbox-item">
            <input 
              type="checkbox" 
              checked={autoProcess} 
              onChange={(e) => setAutoProcess(e.target.checked)} 
            />
            <span>Auto-process on upload</span>
          </label>
        </div>
      </div>

      <div className="management-grid">
        <div 
          className={`upload-dropzone compact ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <UploadCloud className="upload-icon" size={24} />
          <div className="dropzone-text">
            <h3>Add New Dataset</h3>
            <p>Click or drag CSV here</p>
          </div>
        </div>

        {datasets.length > 0 && (
          <div className="datasets-list-container">
            <h3>Active Datasets</h3>
            <div className="datasets-list">
              {datasets.map(ds => (
                <div 
                  key={ds.id} 
                  className={`dataset-pill ${ds.id === activeDatasetId ? 'active' : ''}`}
                  onClick={() => onSelectDataset(ds.id)}
                >
                  <FileText size={14} />
                  <span className="dataset-name">{ds.name}</span>
                  {ds.status.isProcessed ? <CheckCircle size={12} className="status-icon success" /> : <Clock size={12} className="status-icon" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeDataset && activeDataset.stats && (
        <div className="active-dataset-details animate-fade-in">
          <div className="status-pill">
            <div className="status-dot"></div>
            Currently Analyzing: {activeDataset.name}
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.rows}</div>
              <div className="stat-label">Rows</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.columns}</div>
              <div className="stat-label">Columns</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.nulls}</div>
              <div className="stat-label">Missing</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.num_cols}</div>
              <div className="stat-label">Numeric</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.cat_cols}</div>
              <div className="stat-label">Categorical</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
