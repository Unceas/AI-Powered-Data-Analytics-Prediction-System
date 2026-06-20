import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandIcon } from './BrandIcon';
import { 
  ArrowRight, 
  Database, 
  TrendingUp, 
  Brain, 
  MessageSquare, 
  FileText, 
  Check, 
  UploadCloud, 
  Activity, 
  Play,
  ChevronLeft,
  ChevronRight
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
  level: number;
  parentId?: string;
  branchIndex: number;
  step?: 'upload' | 'analyze' | 'predict' | 'report';
}

interface TreeLink {
  id: string;
  from: string;
  to: string;
  d: string;
  branchIndex: number;
}

// Generate deterministic tree structures with branch index and step attributes
function generateTreeData() {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];
  let nodeIdCounter = 0;

  const rootId = 'root';
  nodes.push({ id: rootId, x: 500, y: 785, level: 0, branchIndex: -1 });

  const hubId = 'logo-hub';
  nodes.push({ id: hubId, x: 500, y: 520, level: 1, parentId: rootId, branchIndex: -1 });

  links.push({
    id: 'link-root-hub',
    from: rootId,
    to: hubId,
    d: 'M 500 785 C 500 700, 500 600, 500 520',
    branchIndex: -1
  });

  function addBranch(
    startX: number,
    startY: number,
    angleDeg: number,
    length: number,
    depth: number,
    parentId: string,
    branchIndex: number,
    stepPath?: 'upload' | 'analyze' | 'predict' | 'report'
  ) {
    const id = `node-${nodeIdCounter++}`;
    const angleRad = (angleDeg * Math.PI) / 180;
    const endX = startX + Math.cos(angleRad) * length;
    const endY = startY + Math.sin(angleRad) * length;

    nodes.push({
      id,
      x: endX,
      y: endY,
      level: depth,
      parentId,
      branchIndex,
      step: stepPath
    });

    const ctrlX1 = startX + Math.cos(angleRad) * (length * 0.45);
    const ctrlY1 = startY + Math.sin(angleRad) * (length * 0.1);
    const ctrlX2 = endX - Math.cos(angleRad) * (length * 0.1);
    const ctrlY2 = endY - Math.sin(angleRad) * (length * 0.45);

    links.push({
      id: `link-${parentId}-${id}`,
      from: parentId,
      to: id,
      d: `M ${startX} ${startY} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${endX} ${endY}`,
      branchIndex
    });

    if (depth < 5) {
      const spread = depth === 2 ? 22 : depth === 3 ? 16 : 10;
      const nextLength = length * 0.74;

      let leftStepPath: 'upload' | 'analyze' | 'predict' | 'report' | undefined = undefined;
      if (stepPath === 'upload') leftStepPath = 'analyze';
      else if (stepPath === 'analyze') leftStepPath = 'predict';
      else if (stepPath === 'predict') leftStepPath = 'report';

      addBranch(endX, endY, angleDeg - spread, nextLength, depth + 1, id, branchIndex, leftStepPath);
      addBranch(endX, endY, angleDeg + spread, nextLength, depth + 1, id, branchIndex, undefined);
    }
  }

  // 5 main branches
  addBranch(500, 520, -135, 110, 2, hubId, 0, undefined);
  addBranch(500, 520, -112, 122, 2, hubId, 1, undefined);
  addBranch(500, 520, -90, 125, 2, hubId, 2, 'upload');
  addBranch(500, 520, -68, 122, 2, hubId, 3, undefined);
  addBranch(500, 520, -45, 110, 2, hubId, 4, undefined);

  return { nodes, links };
}

export function LandingExperience({ 
  onOpenWorkspace, 
  onLoadSampleDataset, 
  onFileUpload 
}: LandingExperienceProps) {
  const slides = ['ROOT', 'WHY', 'FLOW', 'CAPABILITIES', 'EXAMPLES', 'WORKSPACE'];
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { nodes, links } = generateTreeData();

  // Handle file upload
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
        setActiveSlide(prev => Math.min(prev + 1, slides.length - 1));
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
      if (now - lastTime < 700) return;

      if (e.deltaY > 15) {
        setActiveSlide(prev => Math.min(prev + 1, slides.length - 1));
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
        setActiveSlide(prev => Math.min(prev + 1, slides.length - 1));
      } else {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
      setTouchStart(null);
    }
  };

  // Highlight rules
  const isLinkActive = (link: TreeLink) => {
    if (activeSlide === 5) return true; // Slide 06: ALL glow
    if (activeSlide === 0) return link.branchIndex === -1; 
    if (activeSlide === 1) return link.branchIndex === 0; // Slide 02
    if (activeSlide === 2) return link.branchIndex === 2; // Slide 03
    if (activeSlide === 3) return link.branchIndex === 1 || link.branchIndex === 3; // Slide 04
    if (activeSlide === 4) return link.branchIndex === 4; // Slide 05
    return false;
  };

  const isNodeActive = (node: TreeNode) => {
    if (activeSlide === 5) return true; // Slide 06: ALL glow
    if (activeSlide === 0) return node.id === 'root' || node.id === 'logo-hub';
    if (activeSlide === 1) return node.branchIndex === 0 || node.id === 'logo-hub' || node.id === 'root';
    if (activeSlide === 2) return node.branchIndex === 2 || node.id === 'logo-hub' || node.id === 'root';
    if (activeSlide === 3) return node.branchIndex === 1 || node.branchIndex === 3 || node.id === 'logo-hub' || node.id === 'root';
    if (activeSlide === 4) return node.branchIndex === 4 || node.id === 'logo-hub' || node.id === 'root';
    return false;
  };

  // Tree Camera zoom/pan mappings
  const cameraTransforms = [
    { scale: 0.82, x: 500, y: 500 }, // Slide 1 (Root)
    { scale: 1.35, x: 350, y: 440 }, // Slide 2 (Purpose)
    { scale: 1.55, x: 500, y: 430 }, // Slide 3 (Flow)
    { scale: 1.25, x: 500, y: 480 }, // Slide 4 (Backtrack)
    { scale: 1.35, x: 650, y: 440 }, // Slide 5 (Possibilities)
    { scale: 0.82, x: 500, y: 500 }  // Slide 6 (Workspace)
  ];

  const currentCamera = cameraTransforms[activeSlide] || cameraTransforms[0];
  const treeTransformStyle = {
    transform: `translate(500px, 400px) scale(${currentCamera.scale}) translate(-${currentCamera.x}px, -${currentCamera.y}px)`,
    transition: 'transform 1.25s cubic-bezier(0.25, 1, 0.28, 1)'
  };

  const presets = [
    { filename: 'customer_churn.csv', name: 'Customer Churn', desc: 'Identify churn signals.', tag: 'Classification • Retention' },
    { filename: 'retail_sales.csv', name: 'Store Revenue', desc: 'Predict retail revenue.', tag: 'Regression • Sales' },
    { filename: 'healthcare_risk.csv', name: 'Patient Risk', desc: 'Model health risk factors.', tag: 'Classification • Clinical' },
    { filename: 'employee_attrition.csv', name: 'Employee Retention', desc: 'Model attrition metrics.', tag: 'Classification • HR' },
    { filename: 'student_performance.csv', name: 'Student Success', desc: 'Model score variations.', tag: 'Classification • Education' },
    { filename: 'sports_performance.csv', name: 'Athlete Injury', desc: 'Analyze injury risks.', tag: 'Classification • Sports' }
  ];

  return (
    <div 
      className="landing-viewport slide-experience"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Premium Navbar */}
      <header className="landing-header">
        <div className="landing-logo" onClick={() => setActiveSlide(0)}>
          <div className="logo-icon-glow">
            <BrandIcon size={18} />
          </div>
          <span className="logo-text">INSIGHTGRID</span>
        </div>
        <nav className="landing-nav-pills">
          {slides.map((s, idx) => (
            <button 
              key={s} 
              className={`nav-pill ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
            >
              <span className="pill-number">0{idx + 1}</span>
              <span className="pill-label">{s}</span>
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="btn-secondary btn-sm" onClick={onOpenWorkspace}>
            Open Workspace
          </button>
        </div>
      </header>

      {/* Main Console Split Layout */}
      <div className={`console-layout slide-mode-${activeSlide}`}>
        
        {/* Left Side: Dynamic Text / Options Column */}
        <div className="console-content-column">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="content-animation-wrapper"
            >
              {activeSlide === 0 && (
                <div className="slide-content root-slide">
                  <div className="slide-meta">01 / ROOT</div>
                  <h1 className="display-title">INSIGHTGRID</h1>
                  <h2 className="display-tagline">Talk to Data</h2>
                  <p className="description-text">
                    An AI-assisted analytics and infrastructure orchestration console. We ingest raw datasets, map execution pathways, and deliver explainable predictions instantly.
                  </p>
                  <div className="actions-row">
                    <button className="btn-primary btn-lg" onClick={() => setActiveSlide(1)}>
                      Explore Journey <ArrowRight size={16} />
                    </button>
                    <button className="btn-secondary btn-lg" onClick={onOpenWorkspace}>
                      Open Workspace <Play size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              )}

              {activeSlide === 1 && (
                <div className="slide-content purpose-slide">
                  <div className="slide-meta">02 / WHY</div>
                  <h2 className="slide-title">Why InsightGrid Exists</h2>
                  <h3 className="slide-subtitle">Modern analytics workflows are fragmented.</h3>
                  <p className="description-text">
                    Traditional analytical processes force you to shuffle between disconnected platforms—spreadsheets for layout, Jupyter scripts for predictive modeling, and chat interfaces for summarization. 
                  </p>
                  <div className="unified-box card">
                    <h4>The Unified Interface Solution</h4>
                    <p>InsightGrid collapses data ingestion, statistical distributions, predictive classification, anomaly thresholds, and LLM reasoning into a single automated pipeline.</p>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveSlide(2)}>
                    Continue Journey <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {activeSlide === 2 && (
                <div className="slide-content flow-slide">
                  <div className="slide-meta">03 / FLOW</div>
                  <h2 className="slide-title">How It Works</h2>
                  <h3 className="slide-subtitle">Structured inference pipeline.</h3>
                  <div className="flow-timeline">
                    <div className="flow-step-item">
                      <div className="flow-icon-box"><Database size={16} /></div>
                      <div className="flow-text-box">
                        <h4>1. Dataset Ingestion</h4>
                        <p>Spreadsheet streams parse layout structures and headers automatically.</p>
                      </div>
                    </div>
                    <div className="flow-step-item">
                      <div className="flow-icon-box"><Activity size={16} /></div>
                      <div className="flow-text-box">
                        <h4>2. Preprocessing & Clean</h4>
                        <p>Imputes null values and scales numerical dimensions in milliseconds.</p>
                      </div>
                    </div>
                    <div className="flow-step-item">
                      <div className="flow-icon-box"><Brain size={16} /></div>
                      <div className="flow-text-box">
                        <h4>3. Prediction Studio</h4>
                        <p>Trains classification and isolation forests to tag anomalies.</p>
                      </div>
                    </div>
                    <div className="flow-step-item">
                      <div className="flow-icon-box"><FileText size={16} /></div>
                      <div className="flow-text-box">
                        <h4>4. AI Report Generation</h4>
                        <p>Synthesizes model statistics into printable PDF dossiers.</p>
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveSlide(3)}>
                    Continue Journey <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {activeSlide === 3 && (
                <div className="slide-content backtrack-slide">
                  <div className="slide-meta">04 / CAPABILITIES</div>
                  <h2 className="slide-title">Navigate with Clarity</h2>
                  <h3 className="slide-subtitle">Bi-directional trace pipelines.</h3>
                  <p className="description-text">
                    Move forward with confidence. Backtrack and explore new possibilities. Every generated finding maintains a mathematical linkage back to original variables and data sources, preventing statistical hallucination.
                  </p>
                  <ul className="clarity-bullets">
                    <li><Check size={16} className="text-gold" /> Transparent Pearson coefficient rankings.</li>
                    <li><Check size={16} className="text-gold" /> Model accuracy indicators grounded in cross-validation.</li>
                    <li><Check size={16} className="text-gold" /> Transparent imputation audit logs.</li>
                  </ul>
                  <button className="btn-primary" onClick={() => setActiveSlide(4)}>
                    Continue Journey <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {activeSlide === 4 && (
                <div className="slide-content possibilities-slide">
                  <div className="slide-meta">05 / EXAMPLES</div>
                  <h2 className="slide-title">Powerful Capabilities</h2>
                  <h3 className="slide-subtitle">Fully automated statistical engines.</h3>
                  <div className="capabilities-mini-grid">
                    <div className="mini-cap-card card">
                      <TrendingUp size={20} className="text-gold" />
                      <h4>Analytics</h4>
                      <p>Compute distributions and skewness profiles.</p>
                    </div>
                    <div className="mini-cap-card card">
                      <Brain size={20} className="text-gold" />
                      <h4>Predictions</h4>
                      <p>Train decision tree classifiers on custom targets.</p>
                    </div>
                    <div className="mini-cap-card card">
                      <MessageSquare size={20} className="text-gold" />
                      <h4>AI Insights</h4>
                      <p>Natural language breakdowns of statistics.</p>
                    </div>
                    <div className="mini-cap-card card">
                      <FileText size={20} className="text-gold" />
                      <h4>PDF Reports</h4>
                      <p>Download executive ready vector briefs.</p>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => setActiveSlide(5)}>
                    Continue Journey <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {activeSlide === 5 && (
                <div className="slide-content workspace-slide">
                  <div className="slide-meta">06 / WORKSPACE</div>
                  <h2 className="slide-title">Ready to Explore?</h2>
                  <h3 className="slide-subtitle font-mono">Your data. Your questions. Our intelligence.</h3>
                  
                  <div className="workspace-upload-zone card">
                    <input 
                      type="file" 
                      accept=".csv,.xls,.xlsx" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <UploadCloud size={28} className="text-gold animate-bounce" />
                    <h4>Ingest Spreadsheets</h4>
                    <p>CSV or Excel files (maximum 50 MB)</p>
                    <button className="btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                      Upload File
                    </button>
                  </div>

                  <div className="presets-section">
                    <h4>Launch Preset Gallery</h4>
                    <div className="presets-mini-grid">
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
                            <span className="preset-card-tag">{p.tag.split(' • ')[0]}</span>
                          </div>
                          <p>{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="direct-nav-row">
                    <button className="btn-secondary btn-full-width" onClick={onOpenWorkspace}>
                      Enter Raw Workspace <Play size={12} fill="currentColor" style={{ marginLeft: '4px' }} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Immersive SVG Graph Tree Backdrop */}
        <div className="console-visual-column">
          <div className="interactive-tree-wrapper">
            <svg 
              className="narrative-tree-svg" 
              viewBox="0 0 1000 800"
            >
              <defs>
                <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Dynamic Camera group */}
              <g style={treeTransformStyle}>
                
                {/* Curved paths */}
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

                {/* Nodes list */}
                {nodes.map(n => {
                  const active = isNodeActive(n);
                  const isCurrent = (
                    (n.id === 'root' && activeSlide === 0) ||
                    (n.id === 'logo-hub' && activeSlide === 0) ||
                    (n.step === 'upload' && activeSlide === 2) ||
                    (n.step === 'analyze' && activeSlide === 2) ||
                    (n.step === 'predict' && activeSlide === 2) ||
                    (n.step === 'report' && activeSlide === 2)
                  );

                  // Central Logo Hub
                  if (n.id === 'logo-hub') {
                    return (
                      <g key={n.id} className={`logo-hub-group ${active ? 'active' : ''}`}>
                        <rect 
                          x={n.x - 20} 
                          y={n.y - 20} 
                          width="40" 
                          height="40" 
                          rx="8" 
                          className="logo-hub-box"
                        />
                        <g transform={`translate(${n.x - 10}, ${n.y - 10})`}>
                          <BrandIcon size={20} />
                        </g>
                      </g>
                    );
                  }

                  // Flow steps nodes overlay (Slide 03)
                  if (activeSlide === 2 && n.step) {
                    return (
                      <g key={n.id} className="flow-step-node-group">
                        <circle cx={n.x} cy={n.y} r="22" className="flow-node-glow-ring" />
                        <circle cx={n.x} cy={n.y} r="16" className="flow-node-bg" />
                        <g transform={`translate(${n.x - 8}, ${n.y - 8})`} className="flow-node-icon">
                          {n.step === 'upload' && <Database size={16} />}
                          {n.step === 'analyze' && <Activity size={16} />}
                          {n.step === 'predict' && <Brain size={16} />}
                          {n.step === 'report' && <FileText size={16} />}
                        </g>
                        <text x={n.x} y={n.y + 32} className="flow-node-label" textAnchor="middle">
                          {n.step.toUpperCase()}
                        </text>
                      </g>
                    );
                  }

                  // Standard Leaf Nodes (rendered as square chips)
                  const size = n.id === 'root' ? 12 : 6;
                  return (
                    <rect 
                      key={n.id}
                      x={n.x - size / 2}
                      y={n.y - size / 2}
                      width={size}
                      height={size}
                      rx={n.id === 'root' ? 3 : 1}
                      className={`tree-chip-node ${active ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                    />
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

      </div>

      {/* Slide Navigation controls */}
      <div className="slide-controls-footer">
        <button 
          className="btn-slide-nav" 
          disabled={activeSlide === 0}
          onClick={() => setActiveSlide(prev => Math.max(prev - 1, 0))}
        >
          <ChevronLeft size={20} /> BACK
        </button>
        <div className="slide-position-indicator">
          <span>0{activeSlide + 1}</span> / <span>06</span>
        </div>
        <button 
          className="btn-slide-nav" 
          disabled={activeSlide === slides.length - 1}
          onClick={() => setActiveSlide(prev => Math.min(prev + 1, slides.length - 1))}
        >
          NEXT <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
