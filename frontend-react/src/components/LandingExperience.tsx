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

// 6-Section Relatable & Relentless Developer Story Script
const NARRATIVE_STEPS = [
  // Section 1 — The Problem
  {
    id: 0,
    nodeId: 't-0',
    title: 'The Problem',
    text: 'Most datasets tell a story. But finding that story isn\'t easy.',
    placement: 'center-root',
    watermark: 'PROBLEM'
  },
  {
    id: 1,
    nodeId: 't-1',
    title: 'Where It Started',
    text: 'Rows. Columns. Charts. Still no answers.',
    placement: 'left',
    watermark: 'PROBLEM'
  },
  {
    id: 2,
    nodeId: 't-2',
    title: 'The Question I Asked',
    text: 'I got tired of looking at datasets and only seeing numbers. I wanted a system that could explain what was happening.',
    placement: 'left',
    watermark: 'PROBLEM'
  },
  // Section 2 — The Idea
  {
    id: 3,
    nodeId: 't-3',
    title: 'The Idea',
    text: 'What if data could explain itself?',
    placement: 'left',
    watermark: 'THE IDEA'
  },
  {
    id: 4,
    nodeId: 't-4',
    title: 'A New Approach',
    text: 'Not another dashboard. Not another chart. A system that helps uncover meaning.',
    placement: 'left',
    watermark: 'THE IDEA'
  },
  {
    id: 5,
    nodeId: 'p-0',
    title: 'InsightGrid',
    text: 'Built to explore data differently. That became InsightGrid.',
    placement: 'left',
    watermark: 'THE IDEA'
  },
  // Section 3 — The Process
  {
    id: 6,
    nodeId: 'p-1',
    title: 'Upload Data',
    text: 'Start the process by pointing the engine to your data file.',
    placement: 'left',
    watermark: 'THE PROCESS'
  },
  {
    id: 7,
    nodeId: 'p-2',
    title: 'Find Patterns',
    text: 'Impute missing values, scale variables, and run correlation profiles.',
    placement: 'left',
    watermark: 'THE PROCESS'
  },
  {
    id: 8,
    nodeId: 'p-3',
    title: 'Train Models',
    text: 'Fit predictive estimators to calculate relative column influence.',
    placement: 'left',
    watermark: 'THE PROCESS'
  },
  {
    id: 9,
    nodeId: 'p-4',
    title: 'Generate Insights',
    text: 'Extract anomaly score deviations and trace parameter weight mappings.',
    placement: 'left',
    watermark: 'THE PROCESS'
  },
  {
    id: 10,
    nodeId: 'p-5',
    title: 'Create Reports',
    text: 'Deliver structured explanations explaining what is happening under the hood.',
    placement: 'left',
    watermark: 'THE PROCESS'
  },
  // Section 4 — The Intelligence
  {
    id: 11,
    nodeId: 'c-0',
    title: 'What It Can Do',
    text: 'Ask questions about your dataset directly using plain English.',
    placement: 'right',
    watermark: 'INTELLIGENCE'
  },
  {
    id: 12,
    nodeId: 'c-1',
    title: 'Identify Behavior',
    text: 'Detect unusual anomalies and outlier spikes inside your telemetry streams.',
    placement: 'right',
    watermark: 'INTELLIGENCE'
  },
  {
    id: 13,
    nodeId: 'c-2',
    title: 'Generate Predictions',
    text: 'Forecast upcoming margin cycles, classes, and subscription churn drivers.',
    placement: 'right',
    watermark: 'INTELLIGENCE'
  },
  {
    id: 14,
    nodeId: 'c-3',
    title: 'Explain Outcomes',
    text: 'Understand why specific results happen through plain-English reasoning paths.',
    placement: 'right',
    watermark: 'INTELLIGENCE'
  },
  // Section 5 — The Possibilities
  {
    id: 15,
    nodeId: 't-5',
    title: 'The Possibilities',
    text: 'Select one of these branch examples to see what is possible:',
    placement: 'possibilities',
    watermark: 'POSSIBILITIES'
  },
  // Section 6 — The End
  {
    id: 16,
    nodeId: 't-5',
    title: 'Data. Patterns. Insights. Decisions.',
    text: 'Now it\'s your turn.',
    placement: 'workspace-final',
    watermark: 'WORKSPACE'
  }
];

// Narrative Node Component drawing distinct shape symbols (Diamond, Star, etc.)
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

  if (shape === 'square') {
    element = (
      <rect 
        x={-half - 1.5} 
        y={-half - 1.5} 
        width={size + 3} 
        height={size + 3} 
        rx={2.2} 
        className="node-shape shape-square" 
      />
    );
  } else if (shape === 'diamond') {
    element = (
      <polygon 
        points={`0,${-half - 2.8} ${half + 2.8},0 0,${half + 2.8} ${-half - 2.8},0`} 
        className="node-shape shape-diamond" 
      />
    );
  } else if (shape === 'circle') {
    element = (
      <circle 
        cx={0} 
        cy={0} 
        r={half + 0.8} 
        className="node-shape shape-circle" 
      />
    );
  } else if (shape === 'double-square') {
    element = (
      <g className="node-shape shape-double-square">
        <rect x={-half - 2.2} y={-half - 2.2} width={size + 4.4} height={size + 4.4} rx={2.5} className="outer-box" />
        <rect x={-half + 0.8} y={-half + 0.8} width={size - 1.6} height={size - 1.6} rx={1.2} className="inner-box" />
      </g>
    );
  } else if (shape === 'star') {
    element = (
      <path 
        d="M 0,-7.8 L 2.4,-2.4 L 7.8,0 L 2.4,2.4 L 0,7.8 L -2.4,2.4 L -7.8,0 L -2.4,-2.4 Z" 
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

// Deterministic noise helper for organic root fiber crackles
const getDeterministicNoise = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Decorative background node interface
interface DecNode {
  id: string;
  x: number;
  y: number;
  size: number;
}

// Generates structural Main and Background nodes
function generateInteractiveNarrativeTree() {
  const nodes: TreeNode[] = [];
  const links: TreeLink[] = [];
  const decNodes: DecNode[] = [];
  const decLinks: { id: string; d: string }[] = [];
  const rootLinks: { id: string; d: string }[] = [];

  // Central Vertical Trunk nodes (Symmetric column)
  const trunk = [
    { id: 't-0', x: 500, y: 680, shape: 'square' as const },
    { id: 't-1', x: 500, y: 590, shape: 'circle' as const },
    { id: 't-2', x: 500, y: 500, shape: 'circle' as const },
    { id: 't-3', x: 500, y: 410, shape: 'circle' as const },
    { id: 't-4', x: 500, y: 320, shape: 'circle' as const },
    { id: 't-5', x: 500, y: 200, shape: 'double-square' as const }
  ];

  // Pipeline branch (left) branching from root t-0 base
  const pipeline = [
    { id: 'p-0', x: 410, y: 590, shape: 'diamond' as const },
    { id: 'p-1', x: 320, y: 520, shape: 'diamond' as const },
    { id: 'p-2', x: 240, y: 460, shape: 'diamond' as const },
    { id: 'p-3', x: 170, y: 410, shape: 'diamond' as const },
    { id: 'p-4', x: 110, y: 370, shape: 'diamond' as const },
    { id: 'p-5', x: 60, y: 340, shape: 'star' as const }
  ];

  // Capabilities branch (right) branching from root t-0 base
  const capabilities = [
    { id: 'c-0', x: 590, y: 590, shape: 'star' as const },
    { id: 'c-1', x: 680, y: 520, shape: 'star' as const },
    { id: 'c-2', x: 760, y: 460, shape: 'star' as const },
    { id: 'c-3', x: 830, y: 410, shape: 'star' as const }
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

  // Link Left Branch (Starting at base t-0)
  links.push({
    id: 'l-pipe-start',
    from: 't-0',
    to: 'p-0',
    d: 'M 500 680 Q 450 635, 410 590',
    branch: 'left'
  });
  for (let i = 0; i < pipeline.length - 1; i++) {
    links.push({
      id: `l-pipe-${i}`,
      from: pipeline[i].id,
      to: pipeline[i+1].id,
      d: `M ${pipeline[i].x} ${pipeline[i].y} Q ${(pipeline[i].x + pipeline[i+1].x)/2} ${(pipeline[i].y + pipeline[i+1].y)/2 - 5}, ${pipeline[i+1].x} ${pipeline[i+1].y}`,
      branch: 'left'
    });
  }

  // Link Right Branch (Starting at base t-0)
  links.push({
    id: 'l-cap-start',
    from: 't-0',
    to: 'c-0',
    d: 'M 500 680 Q 550 635, 590 590',
    branch: 'right'
  });
  for (let i = 0; i < capabilities.length - 1; i++) {
    links.push({
      id: `l-cap-${i}`,
      from: capabilities[i].id,
      to: capabilities[i+1].id,
      d: `M ${capabilities[i].x} ${capabilities[i].y} Q ${(capabilities[i].x + capabilities[i+1].x)/2} ${(capabilities[i].y + capabilities[i+1].y)/2 - 5}, ${capabilities[i+1].x} ${capabilities[i+1].y}`,
      branch: 'right'
    });
  }

  // Generate recursive ground root fibers horizontally left/right (Horizontal Flat Spread)
  let rootCount = 0;
  function addOrganicRootBranch(sx: number, sy: number, angleDeg: number, len: number, depth: number) {
    if (depth > 4) return;
    const seed = rootCount;
    const rad = (angleDeg * Math.PI) / 180;
    
    const nX = (getDeterministicNoise(seed * 13) - 0.5) * 4;
    const nY = (getDeterministicNoise(seed * 19) - 0.5) * 2;

    const ex = sx + Math.cos(rad) * len;
    const ey = sy + Math.sin(rad) * len + (depth * 1.5);

    rootLinks.push({
      id: `root-l-${rootCount++}`,
      d: `M ${sx} ${sy} Q ${sx + (ex - sx)*0.5 + nX} ${sy + (ey - sy)*0.5 + nY}, ${ex} ${ey}`
    });

    const splitLen = len * 0.82;
    const angleOffset1 = 8 + getDeterministicNoise(seed * 7) * 8;
    const angleOffset2 = 8 + getDeterministicNoise(seed * 11) * 8;

    addOrganicRootBranch(ex, ey, angleDeg - angleOffset1, splitLen, depth + 1);
    addOrganicRootBranch(ex, ey, angleDeg + angleOffset2, splitLen, depth + 1);
  }

  // Left root horizontal system
  addOrganicRootBranch(500, 680, 172, 36, 1);
  addOrganicRootBranch(500, 680, 155, 40, 1);

  // Right root horizontal system
  addOrganicRootBranch(500, 680, 8, 36, 1);
  addOrganicRootBranch(500, 680, 25, 40, 1);

  // Center down root
  addOrganicRootBranch(500, 680, 90, 24, 1);

  // Dense recursive canopy generator fanning outwards in long sweeping paths
  let decCount = 0;
  function addDecorativeCanopy(x: number, y: number, angleDeg: number, len: number, depth: number) {
    if (depth > 4) return;
    const rad = (angleDeg * Math.PI) / 180;
    const ex = x + Math.cos(rad) * len;
    const ey = y + Math.sin(rad) * len;

    const nid = `dec-n-${decCount++}`;
    decNodes.push({
      id: nid,
      x: ex,
      y: ey,
      size: Math.max(8 - depth * 1.2, 4)
    });

    decLinks.push({
      id: `dec-l-${decCount++}`,
      d: `M ${x} ${y} Q ${x + (ex - x)*0.5} ${y + (ey - y)*0.5 - 2}, ${ex} ${ey}`
    });

    addDecorativeCanopy(ex, ey, angleDeg - 13, len * 0.76, depth + 1);
    addDecorativeCanopy(ex, ey, angleDeg + 13, len * 0.76, depth + 1);
  }

  // Generate continuous canopy branching from natural points along trunk and main branches
  addDecorativeCanopy(500, 500, 220, 45, 1);
  addDecorativeCanopy(500, 500, 320, 45, 1);
  addDecorativeCanopy(500, 320, 230, 40, 1);
  addDecorativeCanopy(500, 320, 310, 40, 1);

  addDecorativeCanopy(320, 520, 190, 38, 1);
  addDecorativeCanopy(170, 410, 240, 38, 1);
  addDecorativeCanopy(680, 520, 350, 38, 1);
  addDecorativeCanopy(760, 460, 300, 38, 1);

  return { nodes, links, decNodes, decLinks, rootLinks };
}

export function LandingExperience({ 
  onOpenWorkspace, 
  onLoadSampleDataset, 
  onFileUpload 
}: LandingExperienceProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { nodes, links, decNodes, decLinks, rootLinks } = generateInteractiveNarrativeTree();

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
        setActiveSlide(prev => Math.min(prev + 1, 16));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wheel navigation
  useEffect(() => {
    let lastTime = Date.now();
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastTime < 700) return;

      if (e.deltaY > 15) {
        setActiveSlide(prev => Math.min(prev + 1, 16));
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
        setActiveSlide(prev => Math.min(prev + 1, 16));
      } else {
        setActiveSlide(prev => Math.max(prev - 1, 0));
      }
      setTouchStart(null);
    }
  };

  // Traversal path illumination calculations
  const isLinkActive = (link: TreeLink) => {
    if (activeSlide >= 15) return true;
    if (link.branch === 'decorative') return false;

    const currentStepNodeId = NARRATIVE_STEPS[activeSlide]?.nodeId;

    if (link.id.startsWith('l-trunk-')) {
      const idx = parseInt(link.id.split('-')[2]);
      if (currentStepNodeId?.startsWith('t-')) {
        const targetIdx = parseInt(currentStepNodeId.split('-')[1]);
        return idx < targetIdx;
      }
      if (currentStepNodeId?.startsWith('p-') || currentStepNodeId?.startsWith('c-')) {
        return idx < 1; // trunk links active from base
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
    if (activeSlide >= 15) return true;
    
    const currentStepNodeId = NARRATIVE_STEPS[activeSlide]?.nodeId;
    if (node.id === currentStepNodeId) return true;

    if (node.id.startsWith('t-')) {
      const idx = parseInt(node.id.split('-')[1]);
      if (currentStepNodeId?.startsWith('t-')) {
        return idx <= parseInt(currentStepNodeId.split('-')[1]);
      }
      return idx <= 1;
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

  // Traversal Camera positions mapped to the 17 narrative steps
  const cameraTransforms = [
    { scale: 1.1, x: 500, y: 680 },   // 0: Root (t-0)
    { scale: 1.5, x: 500, y: 590 },   // 1: t-1
    { scale: 1.6, x: 500, y: 500 },   // 2: t-2
    { scale: 1.6, x: 500, y: 410 },   // 3: t-3
    { scale: 1.7, x: 500, y: 320 },   // 4: t-4
    { scale: 1.6, x: 410, y: 590 },   // 5: p-0
    { scale: 1.7, x: 320, y: 520 },   // 6: p-1
    { scale: 1.8, x: 240, y: 460 },   // 7: p-2
    { scale: 1.8, x: 170, y: 410 },   // 8: p-3
    { scale: 1.8, x: 110, y: 370 },   // 9: p-4
    { scale: 1.8, x: 60, y: 340 },    // 10: p-5
    { scale: 1.6, x: 590, y: 590 },   // 11: c-0
    { scale: 1.7, x: 680, y: 520 },   // 12: c-1
    { scale: 1.8, x: 760, y: 460 },   // 13: c-2
    { scale: 1.8, x: 830, y: 410 },   // 14: c-3
    { scale: 1.0, x: 500, y: 450 },   // 15: Possibilities overview
    { scale: 0.9, x: 500, y: 440 }    // 16: Final Workspace pull back
  ];

  const currentCamera = cameraTransforms[activeSlide] || cameraTransforms[0];
  
  const treeTransformStyle = {
    transform: `translate(50vw, 50vh) scale(${currentCamera.scale}) translate(-${currentCamera.x}px, -${currentCamera.y}px)`,
    transition: 'transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
  };

  const possibilitiesList = [
    { filename: 'healthcare_risk.csv', name: 'Healthcare Risk', desc: 'Identify critical clinical parameters and outlier risk profiles.', tag: 'Healthcare' },
    { filename: 'customer_churn.csv', name: 'Customer Churn', desc: 'Find predictive indicators contributing to customer churn.', tag: 'Churn' },
    { filename: 'retail_sales.csv', name: 'Business Forecasting', desc: 'Model store revenues and trend variables across quarters.', tag: 'Forecasting' },
    { filename: 'sports_performance.csv', name: 'Sports Analytics', desc: 'Model physical fatigue indexes and injury likelihood weights.', tag: 'Sports' }
  ];

  const currentStep = NARRATIVE_STEPS[activeSlide] || NARRATIVE_STEPS[0];

  const progressDashesCount = 6;
  const currentCategoryIdx = activeSlide <= 2 ? 0 : activeSlide <= 5 ? 1 : activeSlide <= 10 ? 2 : activeSlide <= 14 ? 3 : activeSlide === 15 ? 4 : 5;

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
              className={idx <= currentCategoryIdx || (activeSlide >= 15) ? 'active' : ''} 
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

      {/* Fixed Viewport Text Overlay */}
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
        ) : currentStep.id === 15 ? (
          <div className="emergent-possibilities-content exact-panels-spec">
            <h2 className="spec-card-title">{currentStep.title}</h2>
            <p className="spec-card-description">{currentStep.text}</p>
            
            <div className="presets-horizontal-row">
              {possibilitiesList.map(p => (
                <div 
                  key={p.filename} 
                  className="preset-mini-card"
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
        ) : currentStep.id === 16 ? (
          <div className="emergent-workspace-content exact-panels-spec">
            <span className="workspace-ready-prefix">Built to explore data differently</span>
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
              
              <button className="btn-primary" onClick={onOpenWorkspace}>
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
            
            {/* Crackling Organic Ground Roots */}
            {rootLinks.map(rl => (
              <path 
                key={rl.id} 
                d={rl.d} 
                className="tree-root-fiber"
              />
            ))}

            {/* Symmetrical Background Canopy Links */}
            {decLinks.map((dl, idx) => (
              <path 
                key={dl.id} 
                d={dl.d} 
                className="tree-path-fg decor"
              />
            ))}

            {/* Main Tree Active/Inactive Paths */}
            {links.map(l => {
              const active = isLinkActive(l);
              return (
                <path 
                  key={l.id} 
                  d={l.d} 
                  className={`tree-path-fg ${active ? 'active' : ''} ${activeSlide >= 15 ? 'complete-glow' : ''}`}
                />
              );
            })}

            {/* Background Canopy Small Nodes */}
            {decNodes.map(dn => (
              <rect 
                key={dn.id}
                x={dn.x - dn.size/2}
                y={dn.y - dn.size/2}
                width={dn.size}
                height={dn.size}
                rx={Math.max(1.2, dn.size * 0.25)}
                className="dec-node-shape"
              />
            ))}

            {/* Main Narrative Coordinates Node Components */}
            {nodes.map(n => {
              const active = isNodeActive(n);
              return (
                <NarrativeNodeComponent 
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  shape={n.shape}
                  active={active}
                  isComplete={activeSlide >= 15}
                />
              );
            })}
          </g>
        </svg>
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
          disabled={activeSlide === 16}
          onClick={() => setActiveSlide(prev => Math.min(prev + 1, 16))}
        >
          NEXT <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
