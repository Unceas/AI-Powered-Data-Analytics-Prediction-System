import { useState, useEffect } from 'react';
import { Shield, Cpu, RefreshCw, Clock } from 'lucide-react';
import './Hero.css';

export function Hero() {
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

  return (
    <div className="system-top-bar-wrapper">
      <div className="system-brand-group">
        <h1 className="system-brand-title">INSIGHTGRID</h1>
        <div className="system-subtitle-row">
          <span className="brand-dot"></span>
          <span className="system-brand-subtitle">AC ANALYTICS + OBSERVABILITY SYSTEM</span>
        </div>
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
