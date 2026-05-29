import { useState } from 'react';
import { Cpu, ShieldAlert, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import './PipelineTabs.css';

interface MachineLearningProps {
  activeDataset: any;
  onModelTrained: (id: string, mlResult: any) => void;
  onAnomalyDetected: (id: string, anomalyResult: any) => void;
}

export function MachineLearning({ activeDataset, onModelTrained, onAnomalyDetected }: MachineLearningProps) {
  const [targetCol, setTargetCol] = useState('');
  const [isLoadingML, setIsLoadingML] = useState(false);
  const [contamination, setContamination] = useState(5);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);

  const mlResult = activeDataset?.mlResult || null;
  const anomalyResult = activeDataset?.anomalyResult || null;

  const trainModel = async () => {
    if (!targetCol.trim()) {
      alert('Please enter a target column.');
      return;
    }
    if (!activeDataset) return;
    
    setIsLoadingML(true);

    const fileObj = (activeDataset as any).rawFile;
    if (!fileObj) {
      alert("No raw file reference available.");
      setIsLoadingML(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('target_column', targetCol);

    try {
      const response = await api.post('/predict-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onModelTrained(activeDataset.id, response.data);
    } catch (error) {
      console.error('ML training failed', error);
      alert('ML training failed. Ensure the target column is spelled correctly and exists.');
    } finally {
      setIsLoadingML(false);
    }
  };

  const detectAnomalies = async () => {
    if (!activeDataset) return;
    setIsLoadingAnomaly(true);

    const fileObj = (activeDataset as any).rawFile;
    if (!fileObj) {
      alert("No raw file reference available.");
      setIsLoadingAnomaly(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', fileObj);
    formData.append('contamination', (contamination / 100).toString());

    try {
      const response = await api.post('/detect-anomalies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onAnomalyDetected(activeDataset.id, response.data);
    } catch (error) {
      console.error('Anomaly detection failed', error);
      alert('Anomaly detection failed.');
    } finally {
      setIsLoadingAnomaly(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="tab-pane placeholder-tab card">
        <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <h3>No active dataset selected</h3>
        <p>Go to the Data Manager and upload or select a dataset first.</p>
      </div>
    );
  }

  return (
    <div className="tab-pane animate-fade-in">
      <div className="view-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Auto-ML Inference & Outlier Engine</h2>
        <p>Train baseline machine learning classifiers, compute metrics, and run Isolation Forest anomaly detection pipelines.</p>
      </div>

      {!activeDataset.status.isProcessed ? (
        <div className="warning-banner card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '4px solid var(--warning)' }}>
          <AlertCircle className="text-warning" size={20} />
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Preprocessing Required</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>Please go to the Data Manager and run the preprocessing pipeline before using the ML workbench.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Predictive Modeling section */}
          <div className="ml-section">
            <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', padding: 0 }}>SUPERVISED — PREDICTIVE MODELING</div>
            <p className="helper-text" style={{ marginBottom: '1rem' }}>Enter the column name you want the model to predict. The engine automatically detects Classification vs Regression based on cardinality.</p>
            
            <div className="ml-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '600px' }}>
              <input 
                className="pane-input"
                placeholder="e.g. price, churn, dropout_risk"
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                className="btn-primary"
                onClick={trainModel}
                disabled={isLoadingML}
                style={{ padding: '0.65rem 1.5rem', whiteSpace: 'nowrap' }}
              >
                {isLoadingML ? 'Training...' : '🤖 Train Baseline Model'}
              </button>
            </div>

            {mlResult && mlResult.status !== 'error' && (
              <div className="ml-results card animate-fade-in" style={{ marginTop: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <Cpu size={16} className="text-cyan" /> MODEL TYPE: {mlResult.model_type}
                </h4>
                <div className="metrics-grid">
                  {Object.entries(mlResult.metrics).map(([k, v]: [string, any]) => (
                    <div key={k} className="metric-box">
                      <span className="metric-v">{(v * 100).toFixed(1)}%</span>
                      <span className="metric-k">{k.replace('_', ' ')}</span>
                    </div>
                  ))}
                  <div className="metric-box" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                     <span className="metric-v" style={{ color: 'var(--accent-color)' }}>High</span>
                     <span className="metric-k" style={{ color: 'var(--text-secondary)' }}>PREDICTION CONFIDENCE</span>
                  </div>
                </div>

                {mlResult.feature_importance && Object.keys(mlResult.feature_importance).length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Top Feature Weights</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {Object.entries(mlResult.feature_importance).map(([feature, weight]: [string, any]) => (
                        <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                          <span style={{ width: '120px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{feature}</span>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${weight * 100}%`, height: '100%', background: 'var(--accent-color)' }}></div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{(weight * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

          {/* Anomaly Detection section */}
          <div className="ml-section">
            <div className="section-title" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', padding: 0 }}>UNSUPERVISED — ANOMALY DETECTION</div>
            <p className="helper-text" style={{ marginBottom: '1rem' }}>Leverages Isolation Forest multi-dimensional partitioning to tag statistical outliers. Select an estimated anomaly contamination percentage.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
              <div className="slider-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', minWidth: '180px' }}>Contamination Rate: {contamination}%</span>
                <input 
                  type="range" 
                  min="1" max="20" 
                  value={contamination} 
                  onChange={(e) => setContamination(parseInt(e.target.value))} 
                  style={{ flex: 1, accentColor: 'var(--accent-color)' }}
                />
              </div>

              <button 
                className="btn-secondary"
                onClick={detectAnomalies}
                disabled={isLoadingAnomaly}
                style={{ width: 'fit-content', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isLoadingAnomaly ? 'Detecting...' : '🔍 Detect Outliers & Anomalies'}
              </button>
            </div>

            {anomalyResult && (
              <div className="anomaly-results animate-fade-in" style={{ marginTop: '1.5rem' }}>
                <div className="metrics-grid">
                  <div className="metric-box">
                    <span className="metric-v">{anomalyResult.total_records.toLocaleString()}</span>
                    <span className="metric-k">Total Records</span>
                  </div>
                  <div className="metric-box" style={{ borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                    <span className="metric-v" style={{ color: 'var(--danger)' }}>{anomalyResult.anomalies_detected.toLocaleString()}</span>
                    <span className="metric-k">Anomalies Found</span>
                  </div>
                  <div className="metric-box" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    <span className="metric-v" style={{ color: 'var(--warning)' }}>{anomalyResult.anomaly_percentage}%</span>
                    <span className="metric-k">Anomaly Rate</span>
                  </div>
                </div>

                {anomalyResult.anomalies_preview && anomalyResult.anomalies_preview.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldAlert size={14} className="text-danger" /> Outlier Records Sample (First 5)
                    </h5>
                    <div className="preview-table-container">
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(anomalyResult.anomalies_preview[0]).slice(0, 5).map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {anomalyResult.anomalies_preview.slice(0, 5).map((row: any, i: number) => (
                            <tr key={i}>
                              {Object.keys(row).slice(0, 5).map((col) => (
                                <td key={col}>{row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NaN'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
