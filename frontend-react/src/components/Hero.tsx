import './Hero.css';
import { Zap } from 'lucide-react';

export function Hero() {
  return (
    <div className="hero-container">
      <div className="hero-badge">
        <Zap size={14} />
        <span>AI-Enhanced Pipeline</span>
      </div>
      <h1 className="hero-title">Autonomous Data Intelligence Platform</h1>
      <p className="hero-subtitle">
        Upload any dataset and watch it flow through ingestion → cleaning → analytics → ML → AI insights, automatically.
      </p>
    </div>
  );
}
