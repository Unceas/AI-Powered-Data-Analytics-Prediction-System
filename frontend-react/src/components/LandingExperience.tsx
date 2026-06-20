import { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  UploadCloud, 
  ChevronLeft, 
  ChevronRight, 
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
  shape: 'square' | 'diamond' | 'circle' | 'double-square' | 'star';
}

interface TreeLink {
  id: string;
  from: string;
  to: string;
  d: string;
  branch: 'left' | 'right' | 'center' | 'decorative';
}

// 3x3 Dot Grid Component
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

// Narrative step configuration representing node-by-node story points
const NARRATIVE_STEPS = [
  {
    id: 0,
    nodeId: 't-0',
    title: 'INSIGHTGRID',
    text: 'Your data already contains answers. InsightGrid helps you find them.',
    placement: 'center-root',
    watermark: ''
  },
  {
    id: 1,
    nodeId: 't-1',
    title: 'Why We Built It',
    text: 'Modern analytics workflows are fragmented. We unify data analysis, machine learning models, and explainable intelligence into one workspace.',
    placement: 'left',
    watermark: 'WHY'
  },
  {
    id: 2,
    nodeId: 't-2',
    title: 'The Narrative Shift',
    text: 'Most analytics tools stop at static charts and raw metrics.',
    placement: 'left',
    watermark: 'WHY'
  },
  {
    id: 3,
    nodeId: 't-3',
    title: 'Explainable Reasoning',
    text: 'InsightGrid focuses on deep, traceable understanding of variables and target behaviors.',
    placement: 'left',
    watermark: 'WHY'
  },
  {
    id: 4,
    nodeId: 'p-0',
    title: 'Upload → Analyze → Understand',
    text: 'Traverse the five-stage automated pipeline.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 5,
    nodeId: 'p-1',
    title: 'Dataset Ingestion',
    text: 'Upload custom spreadsheet or launch live samples instantly.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 6,
    nodeId: 'p-2',
    title: 'Preprocessing',
    text: 'Automated mean imputation, feature encoding, and standard scaling.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 7,
    nodeId: 'p-3',
    title: 'Diagnostic Profiling',
    text: 'Analyze statistical distributions, skewness, and correlation matrices.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 8,
    nodeId: 'p-4',
    title: 'Predictive Classifier',
    text: 'Train Random Forest models to calculate feature importances and predictions.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 9,
    nodeId: 'p-5',
    title: 'Explainable Intelligence',
    text: 'Synthesize natural language explanations grounded in ML weights and anomalies.',
    placement: 'left',
    watermark: 'PIPELINE'
  },
  {
    id: 10,
    nodeId: 'c-0',
    title: 'Questions You Can Ask',
    text: 'Interact directly with the Insight Engine using plain English.',
    placement: 'right',
    watermark: 'ANSWERS'
  },
  {
    id: 11,
    nodeId: 'c-1',
    title: 'Outlier Analysis',
    text: '\"Are there anomalous outlier spikes in my telemetry?\"',
    placement: 'right',
    watermark: 'ANSWERS'
  },
  {
    id: 12,
    nodeId: 'c-2',
    title: 'Churn Prediction',
    text: '\"What primary drivers contribute to customer subscription churn?\"',
    placement: 'right',
    watermark: 'ANSWERS'
  },
  {
    id: 13,
    nodeId: 'c-3',
    title: 'Revenue Trends',
    text: '\"How will store sales and profit margins trend next quarter?\"',
    placement: 'right',
    watermark: 'ANSWERS'
  },
  {
    id: 14,
    nodeId: 't-5',
    title: 'Start Exploring',
    text: 'You have seen the system. Now try it yourself.',
    placement: 'workspace',
    watermark: 'WORKSPACE'
  }
];

// Narrative Node Component drawing distinct shape symbols
interface NarrativeNodeProps {
  x: number;
  y: number;
  shape: 'square' | 'diamond' | 'circle' | 'double-square' | 'star';
  active: boolean;
  isComplete: boolean;
}

const NarrativeNodeComponent = ({ x, y, shape, active, isComplete }: NarrativeNodeProps) => {
  const size = 11;
  const half = size / 2;
  let element = null;

  if (shape === 'square') { // Root
    element = (
      <rect 
        x={-half} 
        y={-half} 
        width={size} 
        height={size} 
        rx={1.5} 
        className="node-shape shape-square" 
      />
    );
  } else if (shape === 'diamond') { // Capability
    element = (
      <polygon 
        points={`0,${-half - 2} ${half + 2},0 0,${half + 2} ${-half - 2},0`} 
        className="node-shape shape-diamond" 
      />
    );
  } else if (shape === 'circle') { // Explanation
    element = (
      <circle 
        cx={0} 
        cy={0} 
        r={half} 
        className="node-shape shape-circle" 
      />
    );
  } else if (shape === 'double-square') { // Workspace
    element = (
      <g className="node-shape shape-double-square">
        <rect x={-half - 2} y={-half - 2} width={size + 4} height={size + 4} rx={2.2} className="outer-box" />
        <rect x={-half + 0.8} y={-half + 0.8} width={size - 1.6} height={size - 1.6} rx={1.2} className="inner-box" />
      </g>
    );
  } else if (shape === 'star') { // Insight
    element = (
      <path 
        d="M 0,-7 L 2.2,-2.2 L 7,0 L 2.2,2.2 L 0,7 L -2.2,2.2 L -7,0 L -2.2,-2.2 Z" 
        className="node-shape shape-star" 
      />
    );
  }

  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      className={`narrative-node-group ${active ? 'active' : ''} ${isComplete ? 'complete-glow' : ''}`}
    >
      {element}
    </g>
  );
};

// Generates structural Main and Background nodes
function generateInteractiveNarrativeTree() {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];

  // Narrative Trunk nodes
  const trunk = [
    { id: 't-0', x: 500, y: 680, shape: 'square' as const },
    { id: 't-1', x: 500, y: 590, shape: 'circle' as const },
    { id: 't-2', x: 500, y: 500, shape: 'circle' as const },
    { id: 't-3', x: 500, y: 410, shape: 'circle' as const },
    { id: 't-4', x: 500, y: 300, shape: 'circle' as const },
    { id: 't-5', x: 500, y: 200, shape: 'double-square' as const }
  ];

  // Pipeline branch (left) fanning out from t-3
  const pipeline = [
    { id: 'p-0', x: 420, y: 360, shape: 'diamond' as const },
    { id: 'p-1', x: 340, y: 330, shape: 'diamond' as const },
    { id: 'p-2', x: 270, y: 310, shape: 'diamond' as const },
    { id: 'p-3', x: 200, y: 300, shape: 'diamond' as const },
    { id: 'p-4', x: 130, y: 300, shape: 'diamond' as const },
    { id: 'p-5', x: 70, y: 310, shape: 'star' as const }
  ];

  // Capabilities branch (right) fanning out from t-3
  const capabilities = [
    { id: 'c-0', x: 580, y: 360, shape: 'star' as const },
    { id: 'c-1', x: 660, y: 330, shape: 'star' as const },
    { id: 'c-2', x: 730, y: 310, shape: 'star' as const },
    { id: 'c-3', x: 800, y: 300, shape: 'star' as const }
  ];

  nodes.push(...trunk, ...pipeline, ...capabilities);

  // Link Trunk
  for (let i = 0; i < trunk.length - 1; i++) {
    links.push({
      id: `l-trunk-${i}`,
      from: trunk[i].id,
      to: trunk[i+1].id,
      d: `M ${trunk[i].x} ${trunk[i].y} L ${trunk[i+1].x} ${trunk[i+1].y}`,
      branch: 'center'
    });
  }

  // Link Left Branch
  links.push({
    id: 'l-pipe-start',
    from: 't-3',
    to: 'p-0',
    d: 'M 500 410 Q 450 395, 420 360',
    branch: 'left'
  });
  for (let i = 0; i < pipeline.length - 1; i++) {
    links.push({
      id: `l-pipe-${i}`,
      from: pipeline[i].id,
      to: pipeline[i+1].id,
      d: `M ${pipeline[i].x} ${pipeline[i].y} Q ${pipeline[i].x - 30} ${pipeline[i].y - 5}, ${pipeline[i+1].x} ${pipeline[i+1].y}`,
      branch: 'left'
    });
  }

  // Link Right Branch
  links.push({
    id: 'l-cap-start',
    from: 't-3',
    to: 'c-0',
    d: 'M 500 410 Q 550 395, 580 360',
    branch: 'right'
  });
  for (let i = 0; i < capabilities.length - 1; i++) {
    links.push({
      id: `l-cap-${i}`,
      from: capabilities[i].id,
      to: capabilities[i+1].id,
      d: `M ${capabilities[i].x} ${capabilities[i].y} Q ${capabilities[i].x + 30} ${capabilities[i].y - 5}, ${capabilities[i+1].x} ${capabilities[i+1].y}`,
      branch: 'right'
    });
  }

  // Golden root base fanning downwards
  for (let i = -7; i <= 7; i++) {
    const endX = 500 + i * 22;
    const endY = 800 + Math.abs(i) * 3;
    links.push({
      id: `root-line-${i}`,
      from: 't-0',
      to: `root-end-${i}`,
      d: `M 500 680 C 500 715, ${500 + i * 10} 750, ${endX} ${endY}`,
      branch: 'center'
    });
  }

  // Symmetrical faint decorative canopy branches fanning out
  let decCount = 0;
  function addDecorativeCanopy(x: number, y: number, angleDeg: number, len: number, depth: number) {
    if (depth > 3) return;
    const rad = (angleDeg * Math.PI) / 180;
    const ex = x + Math.cos(rad) * len;
    const ey = y + Math.sin(rad) * len;

    const nid = `dec-${decCount++}`;
    nodes.push({ id: nid, x: ex, y: ey, shape: 'circle' as const });

    links.push({
      id: `l-dec-${decCount++}`,
      from: `dec-parent-${x}-${y}`,
      to: nid,
      d: `M ${x} ${y} Q ${x + (ex - x)*0.5} ${y + (ey - y)*0.5 - 5}, ${ex} ${ey}`,
      branch: 'decorative'
    });

    addDecorativeCanopy(ex, ey, angleDeg - 25, len * 0.72, depth + 1);
    addDecorativeCanopy(ex, ey, angleDeg + 25, len * 0.72, depth + 1);
  }

  pipeline.forEach((p, idx) => {
    addDecorativeCanopy(p.x, p.y, 250 - idx * 10, 45, 1);
  });
  capabilities.forEach((c, idx) => {
    addDecorativeCanopy(c.x, c.y, 290 + idx * 10, 45, 1);
  });
  addDecorativeCanopy(500, 200, 270, 50, 1);

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
  const { nodes, links } = generateInteractiveNarrativeTree();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0], true);
      onOpenWorkspace();
    }
  };

  // Keyboard navigation step-by-step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setActiveSlide(prev => Math.min(prev + 1, 14));
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
        setActiveSlide(prev => Math.min(prev + 1, 14));
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
        setActiveSlide(prev => Math.min(prev + 1, 14));
      } else {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
      setTouchStart(null);
    }
  };

  // Traversal path illumination calculations
  const isLinkActive = (link: TreeLink) => {
    if (activeSlide === 14) return true; // Full tree illuminated at workspace
    if (link.branch === 'decorative') return false;
    
    // Root lines always highlight active
    if (link.id.startsWith('root-line-')) return true;

    const currentStepNodeId = NARRATIVE_STEPS[activeSlide]?.nodeId;

    if (link.id.startsWith('l-trunk-')) {
      const idx = parseInt(link.id.split('-')[2]);
      if (currentStepNodeId?.startsWith('t-')) {
        const targetIdx = parseInt(currentStepNodeId.split('-')[1]);
        return idx < targetIdx;
      }
      if (currentStepNodeId?.startsWith('p-') || currentStepNodeId?.startsWith('c-')) {
        return idx < 3; // trunk links up to t-3
      }
    }

    if (link.id === 'l-pipe-start' && currentStepNodeId?.startsWith('p-')) return true;
    if (link.id.startsWith('l-pipe-') && currentStepNodeId?.startsWith('p-')) {
      const idx = parseInt(link.id.split('-')[2]);
      const targetIdx = parseInt(currentStepNodeId.split('-')[1]);
      return idx < targetIdx;
    }

    if (link.id === 'l-cap-start' && currentStepNodeId?.startsWith('c-')) return true;
    if (link.id.startsWith('l-cap-') && currentStepNodeId?.startsWith('c-')) {
      const idx = parseInt(link.id.split('-')[2]);
      const targetIdx = parseInt(currentStepNodeId.split('-')[1]);
      return idx < targetIdx;
    }

    return false;
  };

  const isNodeActive = (node: TreeNode) => {
    if (activeSlide === 14) return true;
    
    const currentStepNodeId = NARRATIVE_STEPS[activeSlide]?.nodeId;
    if (node.id === currentStepNodeId) return true;

    // Retain previous path node activation
    if (node.id.startsWith('t-')) {
      const idx = parseInt(node.id.split('-')[1]);
      if (currentStepNodeId?.startsWith('t-')) {
        return idx <= parseInt(currentStepNodeId.split('-')[1]);
      }
      return idx <= 3;
    }
    if (node.id.startsWith('p-') && currentStepNodeId?.startsWith('p-')) {
      const idx = parseInt(node.id.split('-')[1]);
      return idx <= parseInt(currentStepNodeId.split('-')[1]);
    }
    if (node.id.startsWith('c-') && currentStepNodeId?.startsWith('c-')) {
      const idx = parseInt(node.id.split('-')[1]);
      return idx <= parseInt(currentStepNodeId.split('-')[1]);
    }

    return false;
  };

  // Traversal Camera positions for all 15 stages
  const cameraTransforms = [
    { scale: 0.95, x: 500, y: 480 },  // 0: Root (entire tree visible)
    { scale: 1.5, x: 500, y: 590 },  // 1: Why We Built It
    { scale: 1.6, x: 500, y: 500 },  // 2: Most tools stop at charts
    { scale: 1.6, x: 500, y: 410 },  // 3: InsightGrid focuses on understanding
    { scale: 1.6, x: 420, y: 360 },  // 4: Upload -> Analyze -> Understand
    { scale: 1.7, x: 340, y: 330 },  // 5: Dataset Ingestion
    { scale: 1.8, x: 270, y: 310 },  // 6: Preprocessing
    { scale: 1.8, x: 200, y: 300 },  // 7: Diagnostic Profiling
    { scale: 1.8, x: 130, y: 300 },  // 8: Predictive Classifier
    { scale: 1.8, x: 70, y: 310 },   // 9: Explainable AI
    { scale: 1.6, x: 580, y: 360 },  // 10: Questions You Can Ask
    { scale: 1.7, x: 660, y: 330 },  // 11: Outlier Analysis
    { scale: 1.8, x: 730, y: 310 },  // 12: Churn Prediction
    { scale: 1.8, x: 800, y: 300 },  // 13: Revenue Trends
    { scale: 0.92, x: 500, y: 430 }  // 14: Start Exploring / Workspace
  ];

  const currentCamera = cameraTransforms[activeSlide] || cameraTransforms[0];
  
  // Custom narrative experience camera translation
  const treeTransformStyle = {
    transform: `translate(50vw, 50vh) scale(${currentCamera.scale}) translate(-${currentCamera.x}px, -${currentCamera.y}px)`,
    transition: 'transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
  };

  const presets = [
    { filename: 'customer_churn.csv', name: 'Customer Churn', desc: 'Identify churn triggers.', tag: 'Classification' },
    { filename: 'retail_sales.csv', name: 'Store Revenue', desc: 'Forecast store sales.', tag: 'Regression' },
    { filename: 'healthcare_risk.csv', name: 'Patient Risk', desc: 'Identify risk parameters.', tag: 'Classification' },
    { filename: 'employee_attrition.csv', name: 'Employee Retention', desc: 'Model attrition metrics.', tag: 'Classification' },
    { filename: 'student_performance.csv', name: 'Student Success', desc: 'Predict grade brackets.', tag: 'Classification' },
    { filename: 'sports_performance.csv', name: 'Athlete Injury', desc: 'Forecast fatigue limits.', tag: 'Classification' }
  ];

  const currentStep = NARRATIVE_STEPS[activeSlide] || NARRATIVE_STEPS[0];
  const activeNode = nodes.find(n => n.id === currentStep.nodeId);

  // Dash bar counts
  const progressDashesCount = 5;
  const currentCategoryIdx = activeSlide < 4 ? 0 : activeSlide < 10 ? 1 : activeSlide < 14 ? 2 : 3;

  return (
    <div 
      className="landing-viewport slide-experience full-narrative exact-panels-spec"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Giant Faint Background Watermark */}
      {currentStep.watermark && (
        <div className="giant-faint-watermark">{currentStep.watermark}</div>
      )}

      {/* Top Left Slide Indicator with Category progress bar */}
      <div className="slide-top-left-indicator">
        <span className="slide-num-prefix">{String(activeSlide + 1).padStart(2, '0')}</span>
        <span className="slide-title-label">STAGE</span>
        <div className="slide-dash-bar">
          {Array.from({ length: progressDashesCount }).map((_, idx) => (
            <span 
              key={idx} 
              className={idx <= currentCategoryIdx || (activeSlide === 14) ? 'active' : ''} 
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

      {/* Fixed Viewport Text Overlay (Heading & Description emerge on the side, not overlapping the tree) */}
      <div className={`narrative-viewport-overlay placement-${currentStep.placement}`}>
        {currentStep.id === 0 ? (
          <div className="emergent-root-content">
            <h1 className="root-main-title">INSIGHTGRID</h1>
            <p className="root-main-tagline">{currentStep.text}</p>
            
            <div className="root-scroll-indicator">
              <span>Scroll to begin journey</span>
              <div className="scroll-arrow-down">↓</div>
            </div>
          </div>
        ) : currentStep.id === 14 ? (
          <div className="emergent-workspace-content exact-panels-spec">
            <span className="workspace-ready-prefix">You're Ready</span>
            <h2 className="spec-card-title">{currentStep.title}</h2>
            <p className="spec-card-description">{currentStep.text}</p>
            
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
        ) : (
          <div className="emergent-side-content">
            <h2 className="emergent-side-title">{currentStep.title}</h2>
            <p className="emergent-side-text">{currentStep.text}</p>
          </div>
        )}
      </div>

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
                  className={`tree-path-fg ${active ? 'active' : ''} ${l.branch === 'decorative' ? 'decor' : ''} ${activeSlide === 14 ? 'complete-glow' : ''}`}
                />
              );
            })}

            {/* Custom Narrative Nodes Component */}
            {nodes.map(n => {
              // Decorative nodes are styled differently or omitted if unnecessary
              const isDecorative = n.id.startsWith('dec-');
              if (isDecorative) return null;

              const active = isNodeActive(n);
              return (
                <NarrativeNodeComponent 
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  shape={n.shape}
                  active={active}
                  isComplete={activeSlide === 14}
                />
              );
            })}
          </g>
        </svg>
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
          {NARRATIVE_STEPS.map((_, idx) => (
            <button 
              key={idx} 
              className={`indicator-dot-btn ${activeSlide === idx ? 'active' : ''}`}
              onClick={() => setActiveSlide(idx)}
              title={`Step ${idx + 1}`}
            />
          ))}
        </div>
        <button 
          className="btn-slide-nav" 
          disabled={activeSlide === 14}
          onClick={() => setActiveSlide(prev => Math.min(prev + 1, 14))}
        >
          NEXT <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
