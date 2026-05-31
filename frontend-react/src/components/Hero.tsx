import { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, Clock } from 'lucide-react';
import './Hero.css';

interface HeroProps {
  activeDataset?: any;
}

export function Hero({ activeDataset }: HeroProps) {
  const [timeStr, setTimeStr] = useState('22:18:08 UTC');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      const s = d.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSystemStateMessage = () => {
    if (!activeDataset) return 'OPERATIONAL PIPELINE READY';
    const state = activeDataset.engineState || 'IDLE';
    switch (state) {
      case 'IDLE': return 'AWAITING DATASET INITIALIZATION';
      case 'INITIALIZING': return 'INITIALIZING DATA INGESTION';
      case 'VALIDATING': return 'VALIDATING DATA SCHEMA';
      case 'PROCESSING': return 'PROCESSING FEATURE SELECTION';
      case 'ANALYZING': return 'MAPPING STATISTICAL CORRELATION';
      case 'RUNNING INFERENCE': return 'ML RUNTIME ACTIVE';
      case 'SYNTHESIZING INSIGHTS': return 'AI SYNTHESIS LAYER CONNECTED';
      case 'COMPLETE': return 'INFERENCE PIPELINE COMPLETE';
      default: return 'OPERATIONAL STATE ACTIVE';
    }
  };

  return (
    <div className="system-top-bar-wrapper">
      <div className="system-brand-group">
        <h1 className="system-brand-title">INSIGHTGRID</h1>
        <div className="system-subtitle-row">
          <span className="brand-dot"></span>
          <span className="system-brand-subtitle">AI Analytics & Observability System</span>
        </div>
      </div>

      <div className="system-center-status">
        <span className="status-label">SYSTEM STATE</span>
        <span className="status-divider">::</span>
        <span className="status-value">{getSystemStateMessage()}</span>
      </div>

      <div className="system-status-indicator-group">
        <div className="status-pill active-cyan">
          <Shield size={12} className="icon-glow" />
          <span>API ACTIVE</span>
        </div>
        <div className="status-pill active-cyan">
          <Cpu size={12} className="icon-glow" />
          <span>ML ENGINE</span>
        </div>
        <div className="status-pill active-cyan">
          <RefreshCw size={12} className="icon-glow spin" />
          <span>SYNCED</span>
        </div>
        <div className="system-clock-display">
          <Clock size={12} />
          <span className="time-value">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}

