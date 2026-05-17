import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react';
import './UploadSection.css';

import type { Dataset } from '../types';

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
      const validExt = ['.csv', '.xls', '.xlsx'];
      const isValid = validExt.some(ext => file.name.toLowerCase().endsWith(ext)) || file.type.includes('spreadsheet') || file.type.includes('csv') || file.type.includes('excel');
      
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
            accept=".csv,.xls,.xlsx" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <UploadCloud className="upload-icon" size={24} />
          <div className="dropzone-text">
            <h3>Upload CSV / Excel Dataset</h3>
            <p>Supports .csv .xlsx .xls</p>
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
          
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.rows ? activeDataset.stats.rows.toLocaleString() : 0}</div>
              <div className="stat-label">Rows</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.stats.columns}</div>
              <div className="stat-label">Columns</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{((activeDataset.stats.nulls / (activeDataset.stats.rows * activeDataset.stats.columns)) * 100 || 0).toFixed(1)}%</div>
              <div className="stat-label">Missing Values</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activeDataset.status.isProcessed ? activeDataset.stats.cat_cols : 'Pending'}</div>
              <div className="stat-label">Features Encoded</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
