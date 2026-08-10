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
                {/* User-facing Prediction Overview */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        PREDICTION
                      </span>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', marginBottom: '0.3rem' }}>
                        {mlResult.prediction?.summary || `Expected prediction value: ${mlResult.prediction?.value}`}
                      </h3>
                      {mlResult.prediction?.value !== undefined && (
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          Predicted value: <strong style={{ color: 'var(--text-primary)' }}>{String(mlResult.prediction.value)}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {mlResult.prediction?.change && (
                          <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '99px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, color: mlResult.prediction?.direction === 'increase' ? 'var(--success)' : (mlResult.prediction?.direction === 'decrease' ? 'var(--danger)' : 'var(--text-secondary)') }}>
                            {mlResult.prediction?.direction === 'increase' ? '▲ ' : (mlResult.prediction?.direction === 'decrease' ? '▼ ' : '• ')}
                            {mlResult.prediction?.change}
                          </div>
                        )}
                        <div style={{
                          borderRadius: '99px',
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          border: '1px solid',
                          borderColor: (mlResult.reliability === 'High' ? 'rgba(34,197,94,0.4)' : (mlResult.reliability === 'Medium' ? 'rgba(245,158,11,0.4)' : 'rgba(244,63,94,0.4)')),
                          background: (mlResult.reliability === 'High' ? 'rgba(34,197,94,0.1)' : (mlResult.reliability === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)')),
                          color: (mlResult.reliability === 'High' ? 'var(--success)' : (mlResult.reliability === 'Medium' ? 'var(--warning)' : 'var(--danger)'))
                        }}>
                          Reliability: {mlResult.reliability || (mlResult.reliability_score > 75 ? 'High' : 'Medium')}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'right', maxWidth: '280px' }}>
                        {mlResult.reliability_description || "Based on validation quality and available data."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Warnings Banner */}
                {mlResult.warnings && mlResult.warnings.length > 0 && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} /> Data Quality & Validation Warnings
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {mlResult.warnings.map((warn: string, idx: number) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Influencing Factors */}
                {((mlResult.drivers && mlResult.drivers.length > 0) || (mlResult.feature_importance && Object.keys(mlResult.feature_importance).length > 0)) && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Key Influencing Factors
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(mlResult.drivers || Object.entries(mlResult.feature_importance || {}).map(([f, imp], idx) => ({ feature: f, influence: idx === 0 ? 'High influence' : (imp > 0.2 ? 'Moderate influence' : 'Low influence'), importance: imp }))).slice(0, 5).map((driver: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.85rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {driver.feature}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: driver.influence?.includes('High') ? 'var(--accent-color)' : (driver.influence?.includes('Moderate') ? 'var(--text-primary)' : 'var(--text-secondary)'),
                            background: driver.influence?.includes('High') ? 'var(--accent-light)' : 'transparent',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: driver.influence?.includes('High') ? '1px solid var(--accent-border)' : '1px solid transparent'
                          }}>
                            {driver.influence || 'Moderate influence'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible Advanced / Developer Details Section */}
                <details style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', cursor: 'pointer' }}>
                  <summary style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', outline: 'none', userSelect: 'none' }}>
                    ⚙️ Advanced details
                  </summary>
                  
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <Cpu size={16} className="text-accent" />
                      <span>Selected Model Algorithm: <strong>{mlResult.technical?.model || mlResult.model_type}</strong></span>
                    </div>

                    {/* Metrics Grid */}
                    {mlResult.metrics && Object.keys(mlResult.metrics).length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Validation Performance Metrics
                        </div>
                        <div className="metrics-grid" style={{ marginTop: 0 }}>
                          {Object.entries(mlResult.metrics).map(([k, v]: [string, any]) => (
                            <div key={k} className="metric-box">
                              <span className="metric-v">
                                {['accuracy', 'precision', 'recall', 'f1_score', 'r2_score'].includes(k) ? `${(v * 100).toFixed(1)}%` : v}
                              </span>
                              <span className="metric-k">{k.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Candidate Evaluations */}
                    {mlResult.technical?.candidate_evaluations && mlResult.technical.candidate_evaluations.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          Candidate Model Selection Results
                        </div>
                        <div className="preview-table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Candidate Model</th>
                                <th>Status</th>
                                <th>Validation Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mlResult.technical.candidate_evaluations.map((cand: any, i: number) => (
                                <tr key={i}>
                                  <td>{cand.model}</td>
                                  <td>
                                    <span style={{ color: cand.status === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                      {cand.status}
                                    </span>
                                  </td>
                                  <td>{cand.selection_score !== undefined ? cand.selection_score : (cand.reason || 'N/A')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Preprocessing & Training Specs */}
                    {mlResult.technical?.training && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', background: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                        <div><strong>Total Samples:</strong> {mlResult.technical.training.total_samples}</div>
                        <div><strong>Train Split:</strong> {mlResult.technical.training.train_samples}</div>
                        <div><strong>Validation Split:</strong> {mlResult.technical.training.val_samples}</div>
                        <div><strong>Feature Count:</strong> {mlResult.technical.features}</div>
                      </div>
                    )}
                  </div>
                </details>
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
