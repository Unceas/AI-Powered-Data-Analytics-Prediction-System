import { useState, useRef, useEffect } from 'react';
import { BrandIcon } from './BrandIcon';
import { 
  ArrowRight, 
  Database, 
  Brain, 
  UploadCloud, 
  Activity, 
  Play,
  ChevronLeft,
  ChevronRight,
  Award
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
  step?: number;
}

interface TreeLink {
  id: string;
  from: string;
  to: string;
  d: string;
  branchIndex: number;
}

// Generate organic branching tree structured around the 6 narrative points
function generateTreeData() {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];

  // 6 Narrative Steps (Trunk joints)
  const narrative = [
    { id: 'n-root', x: 500, y: 700, level: 0, branchIndex: -1, step: 0 },
    { id: 'n-why', x: 380, y: 560, level: 1, branchIndex: 0, step: 1 },
    { id: 'n-ingest', x: 520, y: 440, level: 2, branchIndex: 2, step: 2 },
    { id: 'n-analyze', x: 380, y: 320, level: 3, branchIndex: 0, step: 3 },
    { id: 'n-predict', x: 620, y: 220, level: 4, branchIndex: 4, step: 4 },
    { id: 'n-workspace', x: 500, y: 100, level: 5, branchIndex: -1, step: 5 },
  ];

  nodes.push(...narrative);

  // Main Trunk Connections
  links.push({
    id: 'l-trunk-0',
    from: 'n-root',
    to: 'n-why',
    d: 'M 500 700 C 500 630, 380 630, 380 560',
    branchIndex: 0
  });
  links.push({
    id: 'l-trunk-1',
    from: 'n-why',
    to: 'n-ingest',
    d: 'M 380 560 C 380 500, 520 500, 520 440',
    branchIndex: 2
  });
  links.push({
    id: 'l-trunk-2',
    from: 'n-ingest',
    to: 'n-analyze',
    d: 'M 520 440 C 520 380, 380 380, 380 320',
    branchIndex: 0
  });
  links.push({
    id: 'l-trunk-3',
    from: 'n-analyze',
    to: 'n-predict',
    d: 'M 380 320 C 380 270, 620 270, 620 220',
    branchIndex: 4
  });
  links.push({
    id: 'l-trunk-4',
    from: 'n-predict',
    to: 'n-workspace',
    d: 'M 620 220 C 620 160, 500 160, 500 100',
    branchIndex: -1
  });

  // Root anchor base
  nodes.push({ id: 'base-root', x: 500, y: 770, level: 0, branchIndex: -1 });
  links.push({
    id: 'l-base-root',
    from: 'base-root',
    to: 'n-root',
    d: 'M 500 770 L 500 700',
    branchIndex: -1
  });

  // Helper for adding decorative offshoots
  const addOffshoot = (fromId: string, toId: string, toX: number, toY: number, d: string, branchIndex: number) => {
    nodes.push({ id: toId, x: toX, y: toY, level: 6, branchIndex });
    links.push({ id: `l-${fromId}-${toId}`, from: fromId, to: toId, d, branchIndex });
  };

  // Why node offshoots (Left side)
  addOffshoot('n-why', 'why-l1', 260, 580, 'M 380 560 C 340 570, 300 580, 260 580', 0);
  addOffshoot('why-l1', 'why-l2', 200, 560, 'M 260 580 C 240 570, 220 560, 200 560', 0);
  addOffshoot('why-l1', 'why-l3', 210, 620, 'M 260 580 C 240 595, 230 610, 210 620', 0);
  // Why node offshoots (Right side)
  addOffshoot('n-why', 'why-r1', 440, 600, 'M 380 560 C 400 580, 420 590, 440 600', 1);

  // Ingest node offshoots (Right side)
  addOffshoot('n-ingest', 'ing-r1', 640, 450, 'M 520 440 C 560 445, 600 450, 640 450', 2);
  addOffshoot('ing-r1', 'ing-r2', 700, 430, 'M 640 450 C 660 440, 680 435, 700 430', 2);
  addOffshoot('ing-r1', 'ing-r3', 690, 490, 'M 640 450 C 660 465, 675 480, 690 490', 2);
  // Ingest node offshoots (Left side)
  addOffshoot('n-ingest', 'ing-l1', 440, 480, 'M 520 440 C 500 460, 470 470, 440 480', 3);

  // Analyze node offshoots (Left side)
  addOffshoot('n-analyze', 'ana-l1', 250, 310, 'M 380 320 C 330 315, 290 310, 250 310', 0);
  addOffshoot('ana-l1', 'ana-l2', 190, 290, 'M 250 310 C 230 300, 210 295, 190 290', 0);
  addOffshoot('ana-l1', 'ana-l3', 180, 340, 'M 250 310 C 220 320, 200 330, 180 340', 0);
  // Analyze node offshoots (Right side)
  addOffshoot('n-analyze', 'ana-r1', 440, 280, 'M 380 320 C 400 300, 420 290, 440 280', 3);

  // Predict node offshoots (Right side)
  addOffshoot('n-predict', 'pre-r1', 740, 200, 'M 620 220 C 660 210, 700 200, 740 200', 4);
  addOffshoot('pre-r1', 'pre-r2', 800, 180, 'M 740 200 C 760 190, 780 185, 800 180', 4);
  addOffshoot('pre-r1', 'pre-r3', 790, 240, 'M 740 200 C 760 215, 775 230, 790 240', 4);
  // Predict node offshoots (Left side)
  addOffshoot('n-predict', 'pre-l1', 560, 250, 'M 620 220 C 600 230, 580 240, 560 250', 3);

  // Canopy offshoots from Workspace top node
  addOffshoot('n-workspace', 'can-l1', 400, 75, 'M 500 100 C 460 90, 430 80, 400 75', 5);
  addOffshoot('can-l1', 'can-l2', 340, 65, 'M 400 75 C 380 70, 360 65, 340 65', 5);
  addOffshoot('can-l1', 'can-l3', 380, 40, 'M 400 75 C 390 60, 385 50, 380 40', 5);

  addOffshoot('n-workspace', 'can-r1', 600, 75, 'M 500 100 C 540 90, 570 80, 600 75', 5);
  addOffshoot('can-r1', 'can-r2', 660, 65, 'M 600 75 C 620 70, 640 65, 660 65', 5);
  addOffshoot('can-r1', 'can-r3', 620, 40, 'M 600 75 C 610 60, 615 50, 620 40', 5);

  addOffshoot('n-workspace', 'can-c1', 500, 35, 'M 500 100 C 500 75, 500 55, 500 35', 5);

  return { nodes, links };
}

export function LandingExperience({ 
  onOpenWorkspace, 
  onLoadSampleDataset, 
  onFileUpload 
}: LandingExperienceProps) {
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

  // Check if link is active/illuminated based on current slide stage
  const isLinkActive = (link: TreeLink) => {
    if (activeSlide === 5) return true; // Final slide: ALL links glow
    
    // Highlight links along the winding narrative path up to current step
    if (link.id === 'l-base-root' || link.id === 'l-trunk-0') return true;
    if (activeSlide >= 2 && link.id === 'l-trunk-1') return true;
    if (activeSlide >= 3 && link.id === 'l-trunk-2') return true;
    if (activeSlide >= 4 && link.id === 'l-trunk-3') return true;
    return false;
  };

  const isNodeActive = (node: TreeNode) => {
    if (activeSlide === 5) return true; // Final slide: ALL nodes glow
    
    // Highlight main path nodes up to active step
    if (node.id === 'base-root' || node.id === 'n-root') return true;
    if (activeSlide >= 1 && node.id === 'n-why') return true;
    if (activeSlide >= 2 && node.id === 'n-ingest') return true;
    if (activeSlide >= 3 && node.id === 'n-analyze') return true;
    if (activeSlide >= 4 && node.id === 'n-predict') return true;
    return false;
  };

  // Dynamic Camera coordinates to focus and offset active nodes on screen
  const cameraTransforms = [
    { scale: 0.95, x: 550, y: 700 }, // ROOT
    { scale: 1.35, x: 440, y: 560 }, // WHY
    { scale: 1.45, x: 430, y: 440 }, // INGEST
    { scale: 1.50, x: 440, y: 320 }, // ANALYZE
    { scale: 1.55, x: 540, y: 220 }, // PREDICT
    { scale: 0.95, x: 500, y: 230 }  // WORKSPACE
  ];

  const currentCamera = cameraTransforms[activeSlide] || cameraTransforms[0];
  const treeTransformStyle = {
    transform: `translate(50vw, 50vh) scale(${currentCamera.scale}) translate(-${currentCamera.x}px, -${currentCamera.y}px)`,
    transition: 'transform 1.3s cubic-bezier(0.25, 1, 0.28, 1)'
  };

  const presets = [
    { filename: 'customer_churn.csv', name: 'Customer Churn', desc: 'Model subscriber churn.', tag: 'Classification' },
    { filename: 'retail_sales.csv', name: 'Store Revenue', desc: 'Forecast store sales.', tag: 'Regression' },
    { filename: 'healthcare_risk.csv', name: 'Patient Risk', desc: 'Model risk conditions.', tag: 'Classification' },
    { filename: 'employee_attrition.csv', name: 'Employee Retention', desc: 'Analyze HR attrition.', tag: 'Classification' },
    { filename: 'student_performance.csv', name: 'Student Success', desc: 'Predict grade levels.', tag: 'Classification' },
    { filename: 'sports_performance.csv', name: 'Athlete Injury', desc: 'Model fatigue limits.', tag: 'Classification' }
  ];

  return (
    <div 
      className="landing-viewport slide-experience full-narrative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Clean Minimalist Logo in Top Left */}
      <header className="minimal-landing-header">
        <div className="landing-logo" onClick={() => setActiveSlide(0)}>
          <div className="logo-icon-glow">
            <BrandIcon size={16} />
          </div>
          <span className="logo-text">INSIGHTGRID</span>
        </div>
        <button className="btn-secondary btn-sm" onClick={onOpenWorkspace}>
          Open Workspace
        </button>
      </header>

      {/* Main Full-Screen Visual Environment */}
      <div className="immersive-tree-environment">
        
        {/* SVG Path Layer */}
        <svg className="narrative-tree-svg" viewBox="0 0 1000 800">
          <defs>
            <filter id="gold-glow-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <g style={treeTransformStyle}>
            {/* Connecting Links */}
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

            {/* Standard Background Nodes (Square chips) */}
            {nodes.map(n => {
              const active = isNodeActive(n);
              const isNarrativeNode = n.id.startsWith('n-');
              
              if (isNarrativeNode) return null; // Narrative nodes are handled in HTML layer for rich animations

              const size = n.id === 'base-root' ? 12 : 5;
              return (
                <rect 
                  key={n.id}
                  x={n.x - size / 2}
                  y={n.y - size / 2}
                  width={size}
                  height={size}
                  rx={n.id === 'base-root' ? 3 : 1}
                  className={`tree-chip-node ${active ? 'active' : ''}`}
                />
              );
            })}
          </g>
        </svg>

        {/* Floating HTML Layer - transforms identically with the SVG group */}
        <div className="html-nodes-layer" style={treeTransformStyle}>
          
          {/* Node 1: ROOT */}
          <div className="floating-narrative-group" style={{ left: 500, top: 700 }}>
            <div className={`narrative-node-circle step-0 ${activeSlide === 0 ? 'active' : ''}`}>
              <BrandIcon size={20} />
            </div>
            <div className={`narrative-text-card float-right ${activeSlide === 0 ? 'active' : ''}`}>
              <h1 className="card-display-title">INSIGHTGRID</h1>
              <h2 className="card-display-subtitle">Understand. Decide. Act.</h2>
              <p className="card-description">
                An intelligence orchestration console. We ingest raw spreadsheets, execute predictive models, and deliver explainable actions in real-time.
              </p>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => setActiveSlide(1)}>
                  Explore Journey <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Node 2: WHY */}
          <div className="floating-narrative-group" style={{ left: 380, top: 560 }}>
            <div className={`narrative-node-circle step-1 ${activeSlide === 1 ? 'active' : ''}`}>
              <Award size={20} />
            </div>
            <div className={`narrative-text-card float-right ${activeSlide === 1 ? 'active' : ''}`}>
              <h2 className="card-title">Why InsightGrid Exists</h2>
              <h3 className="card-subtitle">Unifying fragmented pipelines.</h3>
              <p className="card-description">
                Analytics is currently fragmented across disconnected systems—Excel for formulas, Python notebooks for ML modeling, and slides for briefs. We unify them into a single automated execution canvas.
              </p>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => setActiveSlide(2)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Node 3: INGEST */}
          <div className="floating-narrative-group" style={{ left: 520, top: 440 }}>
            <div className={`narrative-node-circle step-2 ${activeSlide === 2 ? 'active' : ''}`}>
              <Database size={20} />
            </div>
            <div className={`narrative-text-card float-left ${activeSlide === 2 ? 'active' : ''}`}>
              <h2 className="card-title">Dataset Ingestion</h2>
              <h3 className="card-subtitle">Structured parsing.</h3>
              <p className="card-description">
                Upload raw spreadsheets without preprocessing. Our pipeline automatically identifies structures, labels target columns, and handles initial cleanup instantly.
              </p>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => setActiveSlide(3)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Node 4: ANALYZE */}
          <div className="floating-narrative-group" style={{ left: 380, top: 320 }}>
            <div className={`narrative-node-circle step-3 ${activeSlide === 3 ? 'active' : ''}`}>
              <Activity size={20} />
            </div>
            <div className={`narrative-text-card float-right ${activeSlide === 3 ? 'active' : ''}`}>
              <h2 className="card-title">Explainable Profiling</h2>
              <h3 className="card-subtitle">Immediate statistical diagnostics.</h3>
              <p className="card-description">
                Examine correlation indexes, skewness coefficients, outlier densities, and class imbalances. We compute a signature Dataset Health Score to audit your inputs.
              </p>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => setActiveSlide(4)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Node 5: PREDICT */}
          <div className="floating-narrative-group" style={{ left: 620, top: 220 }}>
            <div className={`narrative-node-circle step-4 ${activeSlide === 4 ? 'active' : ''}`}>
              <Brain size={20} />
            </div>
            <div className={`narrative-text-card float-left ${activeSlide === 4 ? 'active' : ''}`}>
              <h2 className="card-title">Prediction Studio</h2>
              <h3 className="card-subtitle">High-fidelity classification classifiers.</h3>
              <p className="card-description">
                Train classification models and isolation forests dynamically. Insights map findings back to exact variables to explain every classification recommendation.
              </p>
              <div className="card-actions">
                <button className="btn-primary" onClick={() => setActiveSlide(5)}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Node 6: WORKSPACE */}
          <div className="floating-narrative-group" style={{ left: 500, top: 100 }}>
            <div className={`narrative-node-circle step-5 ${activeSlide === 5 ? 'active' : ''}`}>
              <Play size={20} fill="currentColor" />
            </div>
            <div className={`narrative-text-card workspace-final-card float-center ${activeSlide === 5 ? 'active' : ''}`}>
              <h2 className="card-title">Ready to Explore?</h2>
              <h3 className="card-subtitle font-mono">Select a sample or upload a spreadsheet.</h3>
              
              {/* File Upload Zone */}
              <div className="workspace-upload-zone card">
                <input 
                  type="file" 
                  accept=".csv,.xls,.xlsx" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <UploadCloud size={24} className="text-gold" />
                <span>Ingest spreadsheet (CSV/XLSX)</span>
                <button className="btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                  Upload Dataset
                </button>
              </div>

              {/* Sample presets */}
              <div className="presets-section">
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
                        <span className="preset-card-tag">{p.tag}</span>
                      </div>
                      <p>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="direct-nav-row">
                <button className="btn-secondary btn-full-width" onClick={onOpenWorkspace}>
                  Enter Raw Workspace <Play size={10} fill="currentColor" style={{ marginLeft: '4px' }} />
                </button>
              </div>

            </div>
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
