import { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, Clock } from 'lucide-react';
import './Hero.css';

interface HeroProps {
  activeDataset?: any;
  isGeneratingReport?: boolean;
}

export function Hero({ activeDataset, isGeneratingReport }: HeroProps) {
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
    if (isGeneratingReport) return 'Creating Report...';
    if (!activeDataset) return 'Ready for Analysis';
    const state = activeDataset.engineState || 'IDLE';
    switch (state) {
      case 'IDLE': return 'Ready for Analysis';
      case 'INITIALIZING': return 'Uploading Dataset...';
      case 'VALIDATING': return 'Analyzing Columns...';
      case 'PROCESSING': return 'Processing Dataset...';
      case 'ANALYZING': return 'Analyzing Data...';
      case 'RUNNING INFERENCE': return 'Building Predictions...';
      case 'SYNTHESIZING INSIGHTS': return 'Generating Insights...';
      case 'COMPLETE': return 'Ready for Analysis';
      default: return 'Ready for Analysis';
    }
  };

  return (
    <div className="system-top-bar-wrapper">
      <div className="system-brand-group">
        <h1 className="system-brand-title">INSIGHTGRID</h1>
        <div className="system-subtitle-row">
          <span className="brand-dot"></span>
          <span className="system-brand-subtitle">Guided Intelligence Platform</span>
        </div>
      </div>

      <div className="system-center-status">
        <span className="status-value">{getSystemStateMessage()}</span>
      </div>

      <div className="system-status-indicator-group">
        <div className="status-pill active-cyan">
          <Shield size={12} className="icon-glow" />
          <span>AI Ready</span>
        </div>
        <div className="status-pill active-cyan">
          <Cpu size={12} className="icon-glow" />
          <span>Prediction Models</span>
        </div>
        <div className="status-pill active-cyan">
          <RefreshCw size={12} className="icon-glow spin" />
          <span>Workspace Saved</span>
        </div>
        <div className="system-clock-display">
          <Clock size={12} />
          <span className="time-value">{timeStr}</span>
        </div>
      </div>
    </div>
  );
}

