import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  CheckCircle, 
  Search, 
  Activity, 
  HardDrive, 
  Wifi
} from 'lucide-react';
import './Diagnostics.css';

interface DiagnosticsProps {
  activeDataset: any;
  datasets: any[];
  onSelectDataset: (id: string) => void;
}

export function Diagnostics({ activeDataset, datasets, onSelectDataset }: DiagnosticsProps) {
  const [logFilter, setLogFilter] = useState('');
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const engineState = activeDataset?.engineState || 'IDLE';

  // Infrastructure telemetry simulation
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(4.2);
  const [ioThroughput, setIoThroughput] = useState(14.8);
  const [gatewayPing, setGatewayPing] = useState(24);

  useEffect(() => {
    // Generate simulated dynamic changes in telemetry
    const interval = setInterval(() => {
      if (engineState !== 'IDLE' && engineState !== 'COMPLETE' && engineState !== 'ERROR') {
        // High resource utilization when processing
        setCpuUsage(Math.floor(Math.random() * 35) + 55);
        setMemUsage(Number((5.8 + Math.random() * 1.5).toFixed(1)));
        setIoThroughput(Number((120.4 + Math.random() * 45).toFixed(1)));
        setGatewayPing(Math.floor(Math.random() * 15) + 12);
      } else {
        // Idle resource utilization
        setCpuUsage(Math.floor(Math.random() * 6) + 8);
        setMemUsage(Number((4.1 + Math.random() * 0.3).toFixed(1)));
        setIoThroughput(Number((8.2 + Math.random() * 4.5).toFixed(1)));
        setGatewayPing(Math.floor(Math.random() * 12) + 20);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [engineState]);

  // Handle auto-scrolling for logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDataset?.logs]);

  // Fallback default logs if dataset has none
  const defaultLogs = [
    { timestamp: '[12:00:00]', message: '[SYSTEM] Observability pipeline initialized. Listening on port 8000.' },
    { timestamp: '[12:00:01]', message: '[SYSTEM] ML Runtime standard context loaded (RandomForestClassifier, IsolationForest).' },
    { timestamp: '[12:00:02]', message: '[SYSTEM] AI Synthesis interface connection online.' },
    { timestamp: '[12:00:03]', message: '[SYSTEM] Standby state. Awaiting dataset load commands.' }
  ];

  const logs = activeDataset?.logs || defaultLogs;
  const filteredLogs = logs.filter((l: any) => 
    l.message.toLowerCase().includes(logFilter.toLowerCase()) || 
    l.timestamp.toLowerCase().includes(logFilter.toLowerCase())
  );

  // Stepper calculations
  const pipelineStatus = activeDataset?.status || {
    isLoaded: false,
    isProcessed: false,
    isAnalyzed: false,
    isModelTrained: false,
    isInsightsGenerated: false
  };

  const steps = [
    { id: 'load', name: 'File Ingestion', status: pipelineStatus.isLoaded ? 'complete' : engineState === 'INITIALIZING' ? 'active' : 'pending', desc: 'Read raw CSV stream' },
    { id: 'validate', name: 'Validation Scan', status: pipelineStatus.isLoaded && engineState !== 'INITIALIZING' && engineState !== 'VALIDATING' ? 'complete' : engineState === 'VALIDATING' ? 'active' : 'pending', desc: 'Identify missing schema features' },
    { id: 'process', name: 'Feature Preprocessing', status: pipelineStatus.isProcessed ? 'complete' : engineState === 'PROCESSING' ? 'active' : 'pending', desc: 'Impute missing values & scale features' },
    { id: 'analyze', name: 'Descriptive Analytics', status: pipelineStatus.isAnalyzed ? 'complete' : engineState === 'ANALYZING' ? 'active' : 'pending', desc: 'Generate distribution & correlation vectors' },
    { id: 'train', name: 'Baseline Inference', status: pipelineStatus.isModelTrained ? 'complete' : engineState === 'RUNNING INFERENCE' ? 'active' : 'pending', desc: 'Fit Random Forest & Isolation Forest' },
    { id: 'synthesis', name: 'Contextual Synthesis', status: pipelineStatus.isInsightsGenerated ? 'complete' : engineState === 'SYNTHESIZING INSIGHTS' ? 'active' : 'pending', desc: 'LLM natural language grounding' }
  ];

  let progressPercentage = 0;
  const completedCount = steps.filter(s => s.status === 'complete').length;
  if (engineState === 'COMPLETE') {
    progressPercentage = 100;
  } else {
    progressPercentage = Math.round((completedCount / steps.length) * 100);
    if (engineState !== 'IDLE' && progressPercentage < 10) progressPercentage = 10;
  }

  return (
    <div className="diagnostics-view animate-fade-in">
      {/* Top Banner and Full Width Progress Bar */}
      <div className="diagnostics-header-block card">
        <div className="diagnostics-header">
          <div className="view-header">
            <h2>Pipeline Diagnostics & Telemetry</h2>
            <p>Real-time system telemetry, service container status, and progressive execution logs.</p>
          </div>

          {/* Dataset Quick Switcher */}
          <div className="diagnostics-dataset-picker">
            <label htmlFor="diag-dataset-select">Active Context: </label>
            <select 
              id="diag-dataset-select"
              value={activeDataset?.id || ''} 
              onChange={(e) => onSelectDataset(e.target.value)}
            >
              <option value="" disabled>-- Select active dataset --</option>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stepper-progress-container">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="progress-value">{progressPercentage}% Complete</span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="diagnostics-split-workspace">
        
        {/* Left Column: Steps and Telemetry */}
        <div className="diagnostics-left-panel">
          
          {/* Pipeline Steps Card */}
          <div className="diagnostics-main-card card">
            <div className="panel-header-row">
              <Activity size={16} className="text-accent" />
              <h3>ORCHESTRATION PIPELINE STEPS</h3>
              <span className={`engine-state-badge ${engineState.toLowerCase()}`}>
                {engineState}
              </span>
            </div>

            <div className="pipeline-stepper-list">
              {steps.map((st, i) => (
                <div key={st.id} className={`pipeline-step-item ${st.status}`}>
                  <div className="step-dot-wrapper">
                    <div className="step-dot">
                      {st.status === 'complete' && <CheckCircle size={14} />}
                      {st.status === 'active' && <span className="step-pulse"></span>}
                    </div>
                    {i < steps.length - 1 && <div className="step-connector"></div>}
                  </div>
                  <div className="step-info">
                    <span className="step-name">{st.name}</span>
                    <span className="step-desc">{st.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="diagnostics-sidebar-grid">
            <div className="telemetry-card card">
              <div className="card-header">
                <Cpu size={14} className="text-secondary" />
                <h4>CPU CORE COMPUTE</h4>
              </div>
              <div className="telemetry-body">
                <div className="value-row">
                  <span className="big-value">{cpuUsage}%</span>
                  <span className="unit-label">Utilization</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${cpuUsage}%`, backgroundColor: cpuUsage > 80 ? 'var(--danger)' : cpuUsage > 50 ? 'var(--warning)' : 'var(--success)' }}></div>
                </div>
              </div>
            </div>

            <div className="telemetry-card card">
              <div className="card-header">
                <HardDrive size={14} className="text-secondary" />
                <h4>MEMORY ALLOCATION</h4>
              </div>
              <div className="telemetry-body">
                <div className="value-row">
                  <span className="big-value">{memUsage} GB</span>
                  <span className="unit-label">of 16 GB</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${(memUsage / 16) * 100}%`, backgroundColor: 'var(--accent-color)' }}></div>
                </div>
              </div>
            </div>

            <div className="telemetry-card card">
              <div className="card-header">
                <Activity size={14} className="text-secondary" />
                <h4>I/O OPERATIONS</h4>
              </div>
              <div className="telemetry-body">
                <div className="value-row">
                  <span className="big-value">{ioThroughput} MB/s</span>
                  <span className="unit-label">Read/Write</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${Math.min(100, (ioThroughput / 200) * 100)}%`, backgroundColor: 'var(--success)' }}></div>
                </div>
              </div>
            </div>

            <div className="telemetry-card card">
              <div className="card-header">
                <Wifi size={14} className="text-secondary" />
                <h4>ROUTER LATENCY</h4>
              </div>
              <div className="telemetry-body">
                <div className="value-row">
                  <span className="big-value">{gatewayPing}ms</span>
                  <span className="unit-label">RTT API Ping</span>
                </div>
                <div className="meter-bar">
                  <div className="meter-fill" style={{ width: `${Math.min(100, (gatewayPing / 100) * 100)}%`, backgroundColor: 'var(--success)' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Execution Trace Console */}
        <div className="diagnostics-right-panel">
          <div className="execution-trace-card card">
            <div className="trace-header">
              <div className="header-title">
                <Terminal size={16} className="text-accent" />
                <h3>Execution Trace Console</h3>
              </div>
              <div className="trace-search">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search trace parameters..." 
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="console-output-area">
              {filteredLogs.length === 0 ? (
                <div className="console-empty">No trace output matches search criteria.</div>
              ) : (
                filteredLogs.map((l: any, index: number) => (
                  <div key={index} className="console-line">
                    <span className="line-time">{l.timestamp}</span>
                    <span className={`line-msg ${l.message.includes('[ERROR]') ? 'text-danger' : l.message.includes('[WARNING]') ? 'text-warning' : ''}`}>
                      {l.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
