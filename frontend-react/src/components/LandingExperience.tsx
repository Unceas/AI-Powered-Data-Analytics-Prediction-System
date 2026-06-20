import { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Database, 
  Brain, 
  UploadCloud, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  FileText, 
  Settings
} from 'lucide-react';
import './LandingExperience.css';

interface LandingExperienceProps {
  onOpenWorkspace: () => void;
  onLoadSampleDataset: (filename: string, datasetName: string) => void;
  onFileUpload: (file: File, autoProcess: boolean) => void;
}

interface TreeNode {
  id: string;
  x: number;
  y: number;
  type: 'hub' | 'square' | 'decorative';
  level?: number;
  side?: 'left' | 'right';
}

interface TreeLink {
  id: string;
  from: string;
  to: string;
  d: string;
  branch: 'left' | 'right' | 'center' | 'decorative';
  level?: number;
  side?: 'left' | 'right';
}

// 3x3 Dot Grid Component matching Panel Brand Node
const GridDotsIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="4" y="4" width="3.2" height="3.2" rx="0.5" />
    <rect x="10.4" y="4" width="3.2" height="3.2" rx="0.5" />
    <rect x="16.8" y="4" width="3.2" height="3.2" rx="0.5" />
    <rect x="4" y="10.4" width="3.2" height="3.2" rx="0.5" />
    <rect x="10.4" y="10.4" width="3.2" height="3.2" rx="0.5" />
    <rect x="16.8" y="10.4" width="3.2" height="3.2" rx="0.5" />
    <rect x="4" y="16.8" width="3.2" height="3.2" rx="0.5" />
    <rect x="10.4" y="16.8" width="3.2" height="3.2" rx="0.5" />
    <rect x="16.8" y="16.8" width="3.2" height="3.2" rx="0.5" />
  </svg>
);

// Custom InsightGrid Node component containing 3x3 dot grid
interface NodeProps {
  x: number;
  y: number;
  active: boolean;
  isComplete: boolean;
}

const InsightGridSquareNode = ({ x, y, active, isComplete }: NodeProps) => {
  const size = 12;
  const half = size / 2;
  
  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      className={`tree-node-group ${active ? 'active' : ''} ${isComplete ? 'complete-glow' : ''}`}
    >
      {/* Outer rounded square box */}
      <rect 
        x={-half} 
        y={-half} 
        width={size} 
        height={size} 
        rx={2.2} 
        className="node-box"
      />
      {/* 3x3 dot grid inside the box */}
      <circle cx={-3} cy={-3} r={0.65} className="node-dot" />
      <circle cx={0} cy={-3} r={0.65} className="node-dot" />
      <circle cx={3} cy={-3} r={0.65} className="node-dot" />
      
      <circle cx={-3} cy={0} r={0.65} className="node-dot" />
      <circle cx={0} cy={0} r={0.65} className="node-dot" />
      <circle cx={3} cy={0} r={0.65} className="node-dot" />
      
      <circle cx={-3} cy={3} r={0.65} className="node-dot" />
      <circle cx={0} cy={3} r={0.65} className="node-dot" />
      <circle cx={3} cy={3} r={0.65} className="node-dot" />
    </g>
  );
};

// Symmetrical dense canopy generator
function generateSplayedTree() {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];

  const trunkY = [650, 570, 490, 410, 330, 250];
  
  // Create vertical trunk nodes
  trunkY.forEach((y, idx) => {
    nodes.push({ id: `t-${idx}`, x: 500, y, type: 'hub' });
    if (idx > 0) {
      links.push({
        id: `l-trunk-${idx}`,
        from: `t-${idx - 1}`,
        to: `t-${idx}`,
        d: `M 500 ${trunkY[idx - 1]} L 500 ${y}`,
        branch: 'center'
      });
    }
  });

  // Base root lines fanning out downwards from the bottom hub node at (500, 650)
  for (let i = -6; i <= 6; i++) {
    const endX = 500 + i * 22;
    const endY = 780 + Math.abs(i) * 3;
    links.push({
      id: `root-line-${i}`,
      from: 't-0',
      to: `root-end-${i}`,
      d: `M 500 650 C 500 690, ${500 + i * 12} 730, ${endX} ${endY}`,
      branch: 'center'
    });
  }

  let nodeCount = 0;
  let linkCount = 0;

  // Recursive branching grow function
  function grow(
    startX: number,
    startY: number,
    angleDeg: number,
    length: number,
    depth: number,
    side: 'left' | 'right',
    level: number
  ) {
    if (depth > 3) return;

    const angleRad = (angleDeg * Math.PI) / 180;
    const endX = startX + Math.cos(angleRad) * length;
    const endY = startY + Math.sin(angleRad) * length;

    const nodeId = `b-${side}-${level}-${depth}-${nodeCount++}`;
    nodes.push({ id: nodeId, x: endX, y: endY, type: 'square', level, side });

    const cpX = startX + Math.cos(angleRad) * (length * 0.45);
    const cpY = startY + Math.sin(angleRad) * (length * 0.45);
    const controlPointY = cpY - (depth === 1 ? 12 : 4);

    const linkId = `l-grow-${side}-${level}-${depth}-${linkCount++}`;
    links.push({
      id: linkId,
      from: `start-${startX}-${startY}`,
      to: nodeId,
      d: `M ${startX} ${startY} Q ${cpX} ${controlPointY}, ${endX} ${endY}`,
      branch: side,
      level,
      side
    });

    const nextLength = length * 0.74;
    const spread = 20;

    grow(endX, endY, angleDeg - spread, nextLength, depth + 1, side, level);
    grow(endX, endY, angleDeg + spread, nextLength, depth + 1, side, level);
  }

  // Grow symmetrical branch systems from each trunk node level
  trunkY.forEach((y, idx) => {
    const angleOffset = 32 + idx * 3; // splay outwards
    // Left side
    grow(500, y, 270 - angleOffset, 90 - idx * 5, 1, 'left', idx);
    // Right side
    grow(500, y, 270 + angleOffset, 90 - idx * 5, 1, 'right', idx);
  });

  return { nodes, links };
}

export function LandingExperience({ 
  onOpenWorkspace, 
  onLoadSampleDataset, 
  onFileUpload 
}: LandingExperienceProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { nodes, links } = generateSplayedTree();
  const trunkY = [650, 570, 490, 410, 330, 250];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0], true);
      onOpenWorkspace();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setActiveSlide(prev => Math.min(prev + 1, 5));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wheel navigation (debounced)
  useEffect(() => {
    let lastTime = Date.now();
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastTime < 800) return;

      if (e.deltaY > 15) {
        setActiveSlide(prev => Math.min(prev + 1, 5));
        lastTime = now;
      } else if (e.deltaY < -15) {
        setActiveSlide(prev => Math.max(prev - 1, 0));
        lastTime = now;
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Mobile swipes
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.touches[0].clientY;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setActiveSlide(prev => Math.min(prev + 1, 5));
      } else {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
      setTouchStart(null);
    }
  };

  const isLinkActive = (link: TreeLink) => {
    if (activeSlide === 5) return true; // Slide 06: FULL tree glow
    
    // Highlight trunk paths and roots on all slides
    if (link.branch === 'center') return true;

    // Highlight specific active branches depending on slide
    if (activeSlide === 1 && link.side === 'right' && link.level === 1) return true;
    if (activeSlide === 2 && link.side === 'left' && link.level === 2) return true;
    if (activeSlide === 3 && link.side === 'right' && link.level === 3) return true;
    if (activeSlide === 4 && link.side === 'left' && link.level === 4) return true;
    
    return false;
  };

  const isNodeActive = (node: TreeNode) => {
    if (activeSlide === 5) return true;
    if (node.type === 'hub') return true;

    // Highlight active branch nodes depending on slide
    if (activeSlide === 1 && node.side === 'right' && node.level === 1) return true;
    if (activeSlide === 2 && node.side === 'left' && node.level === 2) return true;
    if (activeSlide === 3 && node.side === 'right' && node.level === 3) return true;
    if (activeSlide === 4 && node.side === 'left' && node.level === 4) return true;
    return false;
  };

  // Symmetrical camera offsets matching side-floating text card layouts
  const cameraTransforms = [
    { scale: 1.0, x: 500, y: 450 }, // 01 ROOT
    { scale: 1.05, x: 580, y: 460 }, // 02 PURPOSE (Card on the right -> camera shifts left)
    { scale: 1.15, x: 400, y: 420 }, // 03 FLOW (Card on the left -> camera shifts right)
    { scale: 1.05, x: 580, y: 380 }, // 04 BACKTRACK (Card on the right -> camera shifts left)
    { scale: 0.9, x: 330, y: 350 }, // 05 POSSIBILITIES (Card on the left -> camera shifts right)
    { scale: 0.95, x: 420, y: 450 }  // 06 EXPLORE
  ];

  const currentCamera = cameraTransforms[activeSlide] || cameraTransforms[0];
  const treeTransformStyle = {
    transform: `translate(50vw, 50vh) scale(${currentCamera.scale}) translate(-${currentCamera.x}px, -${currentCamera.y}px)`,
    transition: 'transform 1.3s cubic-bezier(0.25, 1, 0.28, 1)'
  };

  const slideLabels = [
    { num: '01', title: 'ROOT', watermark: '' },
    { num: '02', title: 'WHY', watermark: 'WHY' },
    { num: '03', title: 'FLOW', watermark: 'FLOW' },
    { num: '04', title: 'BACKTRACK', watermark: 'BACKTRACK' },
    { num: '05', title: 'POSSIBILITIES', watermark: 'POSSIBILITIES' },
    { num: '06', title: 'WORKSPACE', watermark: 'WORKSPACE' }
  ];

  const presets = [
    { filename: 'customer_churn.csv', name: 'Customer Churn', desc: 'Identify churn triggers.', tag: 'Classification' },
    { filename: 'retail_sales.csv', name: 'Store Revenue', desc: 'Forecast store sales.', tag: 'Regression' },
    { filename: 'healthcare_risk.csv', name: 'Patient Risk', desc: 'Identify risk parameters.', tag: 'Classification' },
    { filename: 'employee_attrition.csv', name: 'Employee Retention', desc: 'Model attrition metrics.', tag: 'Classification' },
    { filename: 'student_performance.csv', name: 'Student Success', desc: 'Predict grade brackets.', tag: 'Classification' },
    { filename: 'sports_performance.csv', name: 'Athlete Injury', desc: 'Forecast fatigue limits.', tag: 'Classification' }
  ];

  const currentLabel = slideLabels[activeSlide] || slideLabels[0];

  const trunkIcons = [
    <GridDotsIcon size={16} />,
    <Brain size={16} />,
    <GridDotsIcon size={16} />,
    <Database size={16} />,
    <Activity size={16} />,
    <UploadCloud size={16} />
  ];

  return (
    <div 
      className="landing-viewport slide-experience full-narrative exact-panels-spec"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Giant Faint Background Watermark Text */}
      {currentLabel.watermark && (
        <div className="giant-faint-watermark">{currentLabel.watermark}</div>
      )}

      {/* Top Left Slide Indicator with Dashboard Dash Bar */}
      <div className="slide-top-left-indicator">
        <span className="slide-num-prefix">{currentLabel.num}</span>
        <span className="slide-title-label">{currentLabel.title}</span>
        <div className="slide-dash-bar">
          {Array.from({ length: 5 }).map((_, idx) => (
            <span 
              key={idx} 
              className={idx < activeSlide || (activeSlide === 5) ? 'active' : ''} 
            />
          ))}
        </div>
      </div>

      {/* Minimal Header */}
      <header className="minimal-landing-header">
        <button className="btn-secondary btn-sm" onClick={onOpenWorkspace}>
          Open Workspace <Settings size={12} />
        </button>
      </header>

      {/* Interactive Visual Canvas */}
      <div className="immersive-tree-environment">
        
        {/* SVG Drawing Layer */}
        <svg className="narrative-tree-svg" viewBox="0 0 1000 800">
          <g style={treeTransformStyle}>
            
            {/* Tree Symmetrical Paths */}
            {links.map(l => {
              const active = isLinkActive(l);
              return (
                <path 
                  key={l.id} 
                  d={l.d} 
                  className={`tree-path-fg ${active ? 'active' : ''} ${activeSlide === 5 ? 'complete-glow' : ''}`}
                />
              );
            })}

            {/* Custom Splayed Square Node chips with dot grids */}
            {nodes.map(n => {
              const active = isNodeActive(n);
              if (n.type === 'hub') return null; // Rendered in HTML overlay
              
              return (
                <InsightGridSquareNode 
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  active={active}
                  isComplete={activeSlide === 5}
                />
              );
            })}
          </g>
        </svg>

        {/* HTML Overlay Layer */}
        <div className="html-nodes-layer" style={treeTransformStyle}>
          
          {/* Vertical Stacked Trunk Icons */}
          {trunkY.map((y, idx) => {
            const active = idx === activeSlide || activeSlide === 5;
            return (
              <div key={idx} className="floating-narrative-group" style={{ left: 500, top: y }}>
                <div 
                  className={`narrative-hub-node-square ${active ? 'active' : ''}`}
                  onClick={() => setActiveSlide(idx)}
                >
                  {trunkIcons[idx]}
                </div>
              </div>
            );
          })}

          {/* Panel 01: ROOT Content Card */}
          <div className="floating-narrative-group" style={{ left: 500, top: 400 }}>
            <div className={`card-root-layout ${activeSlide === 0 ? 'active' : ''}`}>
              <h1 className="root-main-title">INSIGHTGRID</h1>
              <span className="root-main-tagline">Talk to Data</span>
              
              <div className="root-action-buttons">
                <button className="btn-primary" onClick={() => setActiveSlide(1)}>
                  Explore Journey <ArrowRight size={14} />
                </button>
                <button className="btn-secondary" onClick={onOpenWorkspace}>
                  Open Workspace <Settings size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Panel 02: WHY Content Card */}
          <div className="floating-narrative-group" style={{ left: 500, top: 570 }}>
            <div className={`narrative-spec-card right-side ${activeSlide === 1 ? 'active' : ''}`}>
              <h2 className="spec-card-title">Why InsightGrid Exists</h2>
              <p className="spec-card-description">
                Modern analytics workflows are fragmented. We unify data analysis, machine learning models, and explainable intelligence into one workspace.
              </p>
              <button className="btn-text-link" onClick={() => setActiveSlide(2)}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Panel 03: FLOW List Card */}
          <div className="floating-narrative-group" style={{ left: 500, top: 490 }}>
            <div className={`narrative-spec-card left-side flow-layout-card ${activeSlide === 2 ? 'active' : ''}`}>
              <h2 className="spec-card-title">How It Works</h2>
              
              <ul className="flow-vertical-steps">
                <li>
                  <div className="flow-step-square"><GridDotsIcon size={10} /></div>
                  <span>Dataset Ingestion</span>
                </li>
                <li>
                  <div className="flow-step-square"><GridDotsIcon size={10} /></div>
                  <span>Diagnostic Profiling</span>
                </li>
                <li>
                  <div className="flow-step-square"><GridDotsIcon size={10} /></div>
                  <span>Machine Learning Classifier</span>
                </li>
                <li>
                  <div className="flow-step-square"><GridDotsIcon size={10} /></div>
                  <span>Explainable Intelligence</span>
                </li>
                <li>
                  <div className="flow-step-square"><GridDotsIcon size={10} /></div>
                  <span>Decision Support Layer</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Panel 04: BACKTRACK Content Card */}
          <div className="floating-narrative-group" style={{ left: 500, top: 410 }}>
            <div className={`narrative-spec-card right-side ${activeSlide === 3 ? 'active' : ''}`}>
              <h2 className="spec-card-title">Navigate with Clarity</h2>
              <p className="spec-card-description">
                Move forward with confidence. Backtrack and explore new possibilities. Switch model variables and see live impact metrics dynamically.
              </p>
              <button className="btn-text-link" onClick={() => setActiveSlide(4)}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Panel 05: POSSIBILITIES Horizontal Card Row */}
          <div className="floating-narrative-group" style={{ left: 500, top: 330 }}>
            <div className={`narrative-spec-card left-side possibilities-layout-card ${activeSlide === 4 ? 'active' : ''}`}>
              <h2 className="spec-card-title">Powerful Capabilities</h2>
              
              <div className="possibilities-horizontal-row">
                <div className="possibility-small-card">
                  <Activity size={18} className="text-gold" />
                  <h4>Analytics</h4>
                  <p>Uncover patterns and trends.</p>
                </div>
                <div className="possibility-small-card">
                  <Brain size={18} className="text-gold" />
                  <h4>Predictions</h4>
                  <p>Forecast outcomes with confidence.</p>
                </div>
                <div className="possibility-small-card">
                  <Award size={18} className="text-gold" />
                  <h4>AI Insights</h4>
                  <p>AI-assisted insights that explain why.</p>
                </div>
                <div className="possibility-small-card">
                  <FileText size={18} className="text-gold" />
                  <h4>Professional Reports</h4>
                  <p>Executive-ready reports in minutes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 06: WORKSPACE Stack Panel */}
          <div className="floating-narrative-group" style={{ left: 500, top: 250 }}>
            <div className={`narrative-spec-card left-side workspace-layout-card ${activeSlide === 5 ? 'active' : ''}`}>
              <span className="workspace-ready-prefix">You're Ready</span>
              <h2 className="spec-card-title">Explore with InsightGrid</h2>
              <p className="spec-card-description">
                Your data. Your questions. Our intelligence.
              </p>

              <div className="workspace-action-row">
                <input 
                  type="file" 
                  accept=".csv,.xls,.xlsx" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                <button className="btn-primary" onClick={() => setShowPresets(true)}>
                  Enter Workspace <ArrowRight size={16} />
                </button>
                
                <button 
                  className="btn-square-action" 
                  title="Upload Custom Spreadsheet" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={18} />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Preset Datasets Modal Drawer Overlay */}
      {showPresets && (
        <div className="presets-drawer-backdrop" onClick={() => setShowPresets(false)}>
          <div className="presets-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="presets-drawer-header">
              <h3>Select Sample Dataset</h3>
              <button className="btn-close-drawer" onClick={() => setShowPresets(false)}>×</button>
            </div>
            
            <div className="presets-drawer-grid">
              {presets.map(p => (
                <div 
                  key={p.filename} 
                  className="preset-pill-card"
                  onClick={() => {
                    onLoadSampleDataset(p.filename, p.name);
                    onOpenWorkspace();
                  }}
                >
                  <div className="preset-card-header">
                    <h5>{p.name}</h5>
                    <span className="preset-card-tag">{p.tag}</span>
                  </div>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide Navigation Dots and Buttons */}
      <div className="slide-controls-footer">
        <button 
          className="btn-slide-nav" 
          disabled={activeSlide === 0}
          onClick={() => setActiveSlide(prev => Math.max(prev - 1, 0))}
        >
          <ChevronLeft size={20} /> BACK
        </button>
        <div className="slide-position-indicator">
          {Array.from({ length: 6 }).map((_, idx) => (
            <button 
              key={idx} 
              className={`indicator-dot-btn ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
        <button 
          className="btn-slide-nav" 
          disabled={activeSlide === 5}
          onClick={() => setActiveSlide(prev => Math.min(prev + 1, 5))}
        >
          NEXT <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
