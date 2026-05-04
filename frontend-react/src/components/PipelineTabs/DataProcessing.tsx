import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './PipelineTabs.css';

interface DataProcessingProps {
  file: File;
  onProcessed: (data: any) => void;
  cachedResult?: any;
}

export function DataProcessing({ file, onProcessed, cachedResult }: DataProcessingProps) {
  const [handleMissing, setHandleMissing] = useState('mean');
  const [scaleFeatures, setScaleFeatures] = useState(true);
  const [encodeCategorical, setEncodeCategorical] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(cachedResult || null);

  // Sync result when switching datasets
  useEffect(() => {
    setResult(cachedResult || null);
  }, [cachedResult]);

  const runPipeline = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify({
      handle_missing: handleMissing,
      scale_features: scaleFeatures,
      encode_categorical: encodeCategorical,
      scaling_method: 'standard',
      encoding_method: 'onehot'
    }));

    try {
      const response = await api.post('/process-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      onProcessed(response.data);
    } catch (error) {
      console.error('Processing failed', error);
      alert('Processing failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="pane-header">
        <h2>Clean & Preprocess</h2>
        <p>Configure how the pipeline handles missing values, encoding, and feature scaling.</p>
      </div>

      <div className="pane-grid">
        <div className="pane-col">
          <label className="input-label">Missing Value Strategy</label>
          <select 
            className="pane-select"
            value={handleMissing}
            onChange={(e) => setHandleMissing(e.target.value)}
          >
            <option value="mean">Mean (Fill numeric with mean, categorical with mode)</option>
            <option value="median">Median (Fill numeric with median, categorical with mode)</option>
            <option value="mode">Mode (Fill all with most frequent)</option>
            <option value="drop">Drop (Remove rows with any nulls)</option>
            <option value="constant">Constant (Fill with 0 or 'Unknown')</option>
          </select>
          <p className="helper-text">
            {handleMissing === 'mean' && '🔵 Recommended for normally distributed numeric data.'}
            {handleMissing === 'median' && '🟣 Better for data with significant outliers.'}
            {handleMissing === 'drop' && '🔴 Use only if you have plenty of data.'}
          </p>
        </div>

        <div className="pane-col">
          <label className="input-label">Feature Engineering</label>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input 
                type="checkbox" 
                checked={scaleFeatures} 
                onChange={(e) => setScaleFeatures(e.target.checked)} 
              />
              <span>Scale numeric features (StandardScaler)</span>
            </label>
            <label className="checkbox-item">
              <input 
                type="checkbox" 
                checked={encodeCategorical} 
                onChange={(e) => setEncodeCategorical(e.target.checked)} 
              />
              <span>Encode categoricals (OneHot encoding)</span>
            </label>
          </div>
        </div>
      </div>

      <button 
        className="btn-primary run-btn" 
        onClick={runPipeline}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : '🚀 Run Processing Pipeline'}
      </button>

      {result && (
        <div className="result-preview">
          <div className="success-banner">
            ✅ Processed {result.rows} rows × {result.columns.length} columns successfully!
          </div>
          <div className="preview-table-container">
             <table>
               <thead>
                 <tr>
                   {result.columns.slice(0, 5).map((col: string) => <th key={col}>{col}</th>)}
                   {result.columns.length > 5 && <th>...</th>}
                 </tr>
               </thead>
               <tbody>
                 {result.preview.slice(0, 5).map((row: any, i: number) => (
                   <tr key={i}>
                     {result.columns.slice(0, 5).map((col: string) => <td key={col}>{row[col]}</td>)}
                     {result.columns.length > 5 && <td>...</td>}
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
