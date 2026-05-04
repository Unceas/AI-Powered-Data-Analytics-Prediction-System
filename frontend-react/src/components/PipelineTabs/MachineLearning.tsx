import { useState } from 'react';
import api from '../../utils/api';
import './PipelineTabs.css';

interface MachineLearningProps {
  file: File;
}

export function MachineLearning({ file }: MachineLearningProps) {
  const [targetCol, setTargetCol] = useState('');
  const [isLoadingML, setIsLoadingML] = useState(false);
  const [mlResult, setMlResult] = useState<any>(null);

  const [contamination, setContamination] = useState(5);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const trainModel = async () => {
    if (!targetCol.trim()) {
      alert('Please enter a target column.');
      return;
    }
    setIsLoadingML(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_column', targetCol);

    try {
      const response = await api.post('/predict-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMlResult(response.data);
    } catch (error) {
      console.error('ML training failed', error);
      alert('ML training failed.');
    } finally {
      setIsLoadingML(false);
    }
  };

  const detectAnomalies = async () => {
    setIsLoadingAnomaly(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contamination', (contamination / 100).toString());

    try {
      const response = await api.post('/detect-anomalies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnomalyResult(response.data);
    } catch (error) {
      console.error('Anomaly detection failed', error);
      alert('Anomaly detection failed.');
    } finally {
      setIsLoadingAnomaly(false);
    }
  };

  return (
    <div className="tab-pane">
      <div className="pane-header">
        <h2>Auto-ML Engine</h2>
      </div>

      <div className="ml-section">
        <label className="input-label">Supervised — Predictive Modeling</label>
        <p className="helper-text">Enter the column you want to predict. The engine auto-detects Classification vs Regression.</p>
        <div className="ml-controls">
          <input 
            className="pane-input"
            placeholder="e.g. price, churn, fraud_flag"
            value={targetCol}
            onChange={(e) => setTargetCol(e.target.value)}
          />
          <button 
            className="btn-primary"
            onClick={trainModel}
            disabled={isLoadingML}
          >
            {isLoadingML ? 'Training...' : '🤖 Train Baseline Model'}
          </button>
        </div>

        {mlResult && mlResult.status !== 'error' && (
          <div className="ml-results card">
            <h4 className="success-banner">✅ Model trained: {mlResult.model_type}</h4>
            <div className="metrics-grid">
              {Object.entries(mlResult.metrics).map(([k, v]: [string, any]) => (
                <div key={k} className="metric-box">
                  <span className="metric-v">{v.toFixed(4)}</span>
                  <span className="metric-k">{k.replace('_', ' ').toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="divider"></div>

      <div className="ml-section">
        <label className="input-label">Unsupervised — Anomaly Detection</label>
        <p className="helper-text">Uses Isolation Forest to flag statistical outliers without needing labels.</p>
        
        <div className="slider-container">
          <label>Estimated anomaly rate: {contamination}%</label>
          <input 
            type="range" 
            min="1" max="20" 
            value={contamination} 
            onChange={(e) => setContamination(parseInt(e.target.value))} 
          />
        </div>

        <button 
          className="btn-secondary"
          onClick={detectAnomalies}
          disabled={isLoadingAnomaly}
          style={{ width: 'fit-content' }}
        >
          {isLoadingAnomaly ? 'Detecting...' : '🔍 Detect Anomalies'}
        </button>

        {anomalyResult && (
          <div className="anomaly-results metrics-grid" style={{marginTop: '1rem'}}>
             <div className="metric-box">
               <span className="metric-v">{anomalyResult.total_records}</span>
               <span className="metric-k">Total Records</span>
             </div>
             <div className="metric-box" style={{ borderColor: 'var(--danger)' }}>
               <span className="metric-v" style={{ color: 'var(--danger)' }}>{anomalyResult.anomalies_detected}</span>
               <span className="metric-k">Anomalies Found</span>
             </div>
             <div className="metric-box" style={{ borderColor: 'var(--warning)' }}>
               <span className="metric-v" style={{ color: 'var(--warning)' }}>{anomalyResult.anomaly_percentage}%</span>
               <span className="metric-k">Anomaly Rate</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
