import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Settings, UploadCloud } from 'lucide-react';
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform
} from 'framer-motion';
import './LandingExperience.css';

interface LandingExperienceProps {
  onOpenWorkspace: () => void;
  onLoadSampleDataset: (filename: string, datasetName: string) => void;
  onFileUpload: (file: File, autoProcess: boolean) => void;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  size: number;
  depth: number;
  kind: 'ambient' | 'journey';
}

interface NetworkLink {
  id: string;
  from: string;
  to: string;
  strength: number;
  route?: boolean;
}

interface JourneyStep {
  id: string;
  indexLabel: string;
  eyebrow: string;
  title: string;
  copy?: string;
  nodeId: string;
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  side: 'left' | 'right';
  route: string[];
  final?: boolean;
}

const VIEWBOX_WIDTH = 1800;
const VIEWBOX_HEIGHT = 1100;
const VIEWBOX_CENTER_X = VIEWBOX_WIDTH / 2;
const VIEWBOX_CENTER_Y = VIEWBOX_HEIGHT / 2;

const JOURNEY_POINTS: NetworkNode[] = [
  { id: 'root-answer', x: 900, y: 840, size: 8, depth: 0.8, kind: 'journey' },
  { id: 'hidden-work', x: 735, y: 728, size: 7, depth: 0.78, kind: 'journey' },
  { id: 'insightgrid-origin', x: 1045, y: 632, size: 8, depth: 0.82, kind: 'journey' },
  { id: 'upload-data', x: 890, y: 528, size: 7, depth: 0.76, kind: 'journey' },
  { id: 'analyze-patterns', x: 652, y: 462, size: 7, depth: 0.75, kind: 'journey' },
  { id: 'generate-predictions', x: 925, y: 356, size: 8, depth: 0.82, kind: 'journey' },
  { id: 'create-reports', x: 1186, y: 434, size: 7, depth: 0.76, kind: 'journey' },
  { id: 'healthcare', x: 1308, y: 278, size: 7, depth: 0.72, kind: 'journey' },
  { id: 'customer-churn', x: 1030, y: 208, size: 7, depth: 0.72, kind: 'journey' },
  { id: 'forecasting', x: 754, y: 260, size: 7, depth: 0.72, kind: 'journey' },
  { id: 'network-awake', x: 900, y: 520, size: 10, depth: 0.88, kind: 'journey' }
];

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'root',
    indexLabel: '01',
    eyebrow: 'ROOT',
    title: 'Most datasets contain answers.',
    nodeId: 'root-answer',
    camera: { x: 900, y: 760, scale: 1.62 },
    side: 'left',
    route: ['root-answer']
  },
  {
    id: 'difficulty',
    indexLabel: '02',
    eyebrow: 'SIGNAL',
    title: "Finding them isn't easy.",
    nodeId: 'hidden-work',
    camera: { x: 770, y: 690, scale: 1.74 },
    side: 'right',
    route: ['root-answer', 'hidden-work']
  },
  {
    id: 'origin',
    indexLabel: '03',
    eyebrow: 'ORIGIN',
    title: 'That question led to InsightGrid.',
    nodeId: 'insightgrid-origin',
    camera: { x: 1010, y: 608, scale: 1.68 },
    side: 'left',
    route: ['root-answer', 'hidden-work', 'insightgrid-origin']
  },
  {
    id: 'upload',
    indexLabel: '04',
    eyebrow: 'BRANCH',
    title: 'Upload data.',
    nodeId: 'upload-data',
    camera: { x: 884, y: 528, scale: 1.86 },
    side: 'right',
    route: ['root-answer', 'hidden-work', 'insightgrid-origin', 'upload-data']
  },
  {
    id: 'analyze',
    indexLabel: '05',
    eyebrow: 'BRANCH',
    title: 'Analyze patterns.',
    nodeId: 'analyze-patterns',
    camera: { x: 678, y: 468, scale: 1.84 },
    side: 'right',
    route: ['root-answer', 'hidden-work', 'insightgrid-origin', 'upload-data', 'analyze-patterns']
  },
  {
    id: 'predict',
    indexLabel: '06',
    eyebrow: 'BRANCH',
    title: 'Generate predictions.',
    nodeId: 'generate-predictions',
    camera: { x: 916, y: 378, scale: 1.94 },
    side: 'left',
    route: [
      'root-answer',
      'hidden-work',
      'insightgrid-origin',
      'upload-data',
      'analyze-patterns',
      'generate-predictions'
    ]
  },
  {
    id: 'report',
    indexLabel: '07',
    eyebrow: 'BRANCH',
    title: 'Create reports.',
    nodeId: 'create-reports',
    camera: { x: 1168, y: 422, scale: 1.78 },
    side: 'left',
    route: [
      'root-answer',
      'hidden-work',
      'insightgrid-origin',
      'upload-data',
      'analyze-patterns',
      'generate-predictions',
      'create-reports'
    ]
  },
  {
    id: 'healthcare',
    indexLabel: '08',
    eyebrow: 'DISCOVERY',
    title: 'Healthcare',
    copy: 'Risk signals, patient cohorts, operational patterns.',
    nodeId: 'healthcare',
    camera: { x: 1266, y: 306, scale: 1.82 },
    side: 'left',
    route: ['insightgrid-origin', 'create-reports', 'healthcare']
  },
  {
    id: 'churn',
    indexLabel: '09',
    eyebrow: 'DISCOVERY',
    title: 'Customer Churn',
    copy: 'Retention drivers hidden across behavior and history.',
    nodeId: 'customer-churn',
    camera: { x: 1030, y: 238, scale: 1.88 },
    side: 'right',
    route: ['insightgrid-origin', 'generate-predictions', 'customer-churn']
  },
  {
    id: 'forecasting',
    indexLabel: '10',
    eyebrow: 'DISCOVERY',
    title: 'Forecasting',
    copy: 'Demand, revenue, load, and future movement.',
    nodeId: 'forecasting',
    camera: { x: 770, y: 286, scale: 1.78 },
    side: 'right',
    route: ['insightgrid-origin', 'analyze-patterns', 'forecasting']
  },
  {
    id: 'final',
    indexLabel: '11',
    eyebrow: 'FULL NETWORK',
    title: 'Data. Patterns. Insights. Decisions.',
    copy: "Now it's your turn.",
    nodeId: 'network-awake',
    camera: { x: 900, y: 520, scale: 0.78 },
    side: 'right',
    route: JOURNEY_POINTS.map(node => node.id),
    final: true
  }
];

const STEP_COUNT = JOURNEY_STEPS.length;
const SCROLL_INPUT = JOURNEY_STEPS.map((_, index) => index / (STEP_COUNT - 1));

function hash(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function createNetwork() {
  const nodes: NetworkNode[] = [...JOURNEY_POINTS];

  JOURNEY_POINTS.forEach((point, pointIndex) => {
    const satelliteCount = pointIndex === JOURNEY_POINTS.length - 1 ? 14 : 18;

    for (let index = 0; index < satelliteCount; index += 1) {
      const seed = pointIndex * 53 + index * 11 + 3;
      const angle = hash(seed) * Math.PI * 2;
      const distance = 44 + hash(seed + 4) * 172;
      const spreadX = Math.cos(angle) * distance * (0.72 + hash(seed + 9) * 0.7);
      const spreadY = Math.sin(angle) * distance * (0.62 + hash(seed + 13) * 0.54);

      nodes.push({
        id: `ambient-${pointIndex}-${index}`,
        x: Math.min(VIEWBOX_WIDTH - 46, Math.max(46, point.x + spreadX)),
        y: Math.min(VIEWBOX_HEIGHT - 46, Math.max(46, point.y + spreadY)),
        size: 1.8 + hash(seed + 1) * 3.2,
        depth: 0.18 + hash(seed + 2) * 0.42,
        kind: 'ambient'
      });
    }
  });

  for (let index = 0; index < 72; index += 1) {
    const seed = index * 29 + 101;

    nodes.push({
      id: `field-${index}`,
      x: 70 + hash(seed) * (VIEWBOX_WIDTH - 140),
      y: 70 + hash(seed + 7) * (VIEWBOX_HEIGHT - 140),
      size: 1.5 + hash(seed + 2) * 2.8,
      depth: 0.12 + hash(seed + 5) * 0.34,
      kind: 'ambient'
    });
  }

  const links: NetworkLink[] = [];
  const linkKey = new Set<string>();

  const addLink = (from: string, to: string, strength: number, route = false) => {
    const key = [from, to].sort().join(':');

    if (from === to || linkKey.has(key)) {
      return;
    }

    linkKey.add(key);
    links.push({ id: key, from, to, strength, route });
  };

  for (let index = 0; index < JOURNEY_POINTS.length - 1; index += 1) {
    addLink(JOURNEY_POINTS[index].id, JOURNEY_POINTS[index + 1].id, 1, true);
  }

  addLink('insightgrid-origin', 'healthcare', 0.9, true);
  addLink('insightgrid-origin', 'customer-churn', 0.9, true);
  addLink('insightgrid-origin', 'forecasting', 0.9, true);
  addLink('create-reports', 'healthcare', 0.8, true);
  addLink('generate-predictions', 'customer-churn', 0.8, true);
  addLink('analyze-patterns', 'forecasting', 0.8, true);
  addLink('upload-data', 'network-awake', 0.74, true);
  addLink('generate-predictions', 'network-awake', 0.74, true);
  addLink('create-reports', 'network-awake', 0.74, true);

  nodes.forEach((node, index) => {
    const nearest = nodes
      .map((candidate, candidateIndex) => ({
        candidate,
        candidateIndex,
        distance: Math.hypot(node.x - candidate.x, node.y - candidate.y)
      }))
      .filter(item => item.candidateIndex !== index && item.distance < 182)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, node.kind === 'journey' ? 5 : 2);

    nearest.forEach((item, nearestIndex) => {
      const strength = Math.max(0.16, 1 - item.distance / 210) * (nearestIndex === 0 ? 0.7 : 0.45);
      addLink(node.id, item.candidate.id, strength);
    });
  });

  return {
    nodes,
    links,
    nodeById: new Map(nodes.map(node => [node.id, node]))
  };
}

function getNode(nodeById: Map<string, NetworkNode>, id: string) {
  const node = nodeById.get(id);

  if (!node) {
    throw new Error(`Network node "${id}" is missing from the scene.`);
  }

  return node;
}

function linkPath(link: NetworkLink, nodeById: Map<string, NetworkNode>) {
  const from = getNode(nodeById, link.from);
  const to = getNode(nodeById, link.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const normalX = -dy / length;
  const normalY = dx / length;
  const bendSeed = hash(link.id.length + from.x * 0.13 + to.y * 0.17) - 0.5;
  const bend = bendSeed * Math.min(length * 0.18, 34);
  const cx = (from.x + to.x) / 2 + normalX * bend;
  const cy = (from.y + to.y) / 2 + normalY * bend;

  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function LandingExperience({
  onOpenWorkspace,
  onLoadSampleDataset,
  onFileUpload
}: LandingExperienceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wheelLockRef = useRef(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const network = useMemo(() => createNetwork(), []);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ['start start', 'end end']
  });

  const rawCameraX = useTransform(
    scrollYProgress,
    SCROLL_INPUT,
    JOURNEY_STEPS.map(step => step.camera.x)
  );
  const rawCameraY = useTransform(
    scrollYProgress,
    SCROLL_INPUT,
    JOURNEY_STEPS.map(step => step.camera.y)
  );
  const rawCameraScale = useTransform(
    scrollYProgress,
    SCROLL_INPUT,
    JOURNEY_STEPS.map(step => step.camera.scale)
  );
  const cameraX = useSpring(rawCameraX, { stiffness: 72, damping: 24, mass: 0.55 });
  const cameraY = useSpring(rawCameraY, { stiffness: 72, damping: 24, mass: 0.55 });
  const cameraScale = useSpring(rawCameraScale, { stiffness: 72, damping: 24, mass: 0.55 });
  const graphTransform = useMotionTemplate`translate(${VIEWBOX_CENTER_X}px, ${VIEWBOX_CENTER_Y}px) scale(${cameraScale}) translate(-${cameraX}px, -${cameraY}px)`;

  useMotionValueEvent(scrollYProgress, 'change', latest => {
    const nextIndex = Math.min(STEP_COUNT - 1, Math.max(0, Math.round(latest * (STEP_COUNT - 1))));
    setActiveStepIndex(nextIndex);
  });

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return undefined;
    }

    const goToStep = (nextIndex: number) => {
      const rootTop = scrollRef.current?.offsetTop ?? 0;

      wheelLockRef.current = true;
      window.scrollTo({
        top: rootTop + nextIndex * window.innerHeight,
        behavior: 'smooth'
      });

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 720);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 18 || wheelLockRef.current) {
        return;
      }

      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = clamp(activeStepIndex + direction, 0, STEP_COUNT - 1);

      if (nextIndex !== activeStepIndex) {
        goToStep(nextIndex);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key) || wheelLockRef.current) {
        return;
      }

      event.preventDefault();
      const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1;
      const nextIndex = clamp(activeStepIndex + direction, 0, STEP_COUNT - 1);

      if (nextIndex !== activeStepIndex) {
        goToStep(nextIndex);
      }
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      stage.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStepIndex]);

  const activeStep = JOURNEY_STEPS[activeStepIndex];
  const activeNode = getNode(network.nodeById, activeStep.nodeId);
  const activeRoute = new Set(activeStep.route);
  const previousRoute = activeStepIndex > 0 ? new Set(JOURNEY_STEPS[activeStepIndex - 1].route) : new Set<string>();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onFileUpload(file, true);
      onOpenWorkspace();
    }
  };

  const handleSampleLoad = () => {
    onLoadSampleDataset('customer_churn.csv', 'Customer Churn');
    onOpenWorkspace();
  };

  return (
    <div className="ig-scroll-experience" ref={scrollRef}>
      <section className="ig-sticky-stage" ref={stageRef}>
        <div className="ig-background-field" />

        <div className="ig-stage-index" aria-label={`Current stage ${activeStep.indexLabel} ${activeStep.eyebrow}`}>
          <span>{activeStep.indexLabel}</span>
          <strong>{activeStep.eyebrow}</strong>
          <i />
        </div>

        <header className="ig-landing-header">
          <div className="ig-wordmark" aria-label="InsightGrid">
            Insight<span>Grid</span>
          </div>
          <button className="ig-secondary-action" type="button" onClick={onOpenWorkspace}>
            Workspace
            <Settings size={13} strokeWidth={1.7} />
          </button>
        </header>

        <svg className="ig-persistent-graph" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} role="img">
          <title>InsightGrid knowledge network journey</title>
          <defs>
            <radialGradient id="ig-node-active-gradient" cx="50%" cy="50%" r="58%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.98)" />
              <stop offset="48%" stopColor="rgba(245, 205, 123, 0.96)" />
              <stop offset="100%" stopColor="rgba(212, 175, 55, 0.12)" />
            </radialGradient>
          </defs>

          <motion.g className={activeStep.final ? 'ig-camera is-final' : 'ig-camera'} style={{ transform: graphTransform }}>
            <g className="ig-links">
              {network.links.map(link => {
                const from = getNode(network.nodeById, link.from);
                const to = getNode(network.nodeById, link.to);
                const active = activeRoute.has(link.from) && activeRoute.has(link.to);
                const wasPrevious = previousRoute.has(link.from) && previousRoute.has(link.to);
                const near =
                  Math.hypot(from.x - activeNode.x, from.y - activeNode.y) < 190 ||
                  Math.hypot(to.x - activeNode.x, to.y - activeNode.y) < 190;

                return (
                  <path
                    key={link.id}
                    className={[
                      'ig-link',
                      link.route ? 'is-route' : '',
                      active ? 'is-active' : '',
                      wasPrevious ? 'was-previous' : '',
                      near ? 'is-near' : '',
                      activeStep.final ? 'is-final' : ''
                    ].join(' ')}
                    style={{ '--link-strength': link.strength } as React.CSSProperties}
                    d={linkPath(link, network.nodeById)}
                  />
                );
              })}
            </g>

            <g className="ig-node-layer">
              {network.nodes.map(node => {
                const active = node.id === activeStep.nodeId;
                const visited = activeRoute.has(node.id);
                const wasPrevious = previousRoute.has(node.id);
                const near = Math.hypot(node.x - activeNode.x, node.y - activeNode.y) < 172;

                return (
                  <g
                    key={node.id}
                    className={[
                      'ig-graph-node',
                      node.kind === 'journey' ? 'is-journey' : 'is-ambient',
                      active ? 'is-active' : '',
                      visited ? 'is-visited' : '',
                      wasPrevious ? 'was-previous' : '',
                      near ? 'is-near' : '',
                      activeStep.final ? 'is-final' : ''
                    ].join(' ')}
                    transform={`translate(${node.x} ${node.y})`}
                    style={{ '--node-depth': node.depth } as React.CSSProperties}
                  >
                    {active && <circle className="ig-active-node-aura" r={node.size + 24} />}
                    {active ? (
                      <g className="ig-active-cube-node" aria-hidden="true">
                        {[-1, 0, 1].flatMap(row =>
                          [-1, 0, 1].map(column => (
                            <rect
                              key={`${row}-${column}`}
                              x={column * 6.4 - 2.4}
                              y={row * 6.4 - 2.4}
                              width="4.8"
                              height="4.8"
                              rx="1.1"
                            />
                          ))
                        )}
                      </g>
                    ) : (
                      <circle className="ig-node-dot" r={node.size} />
                    )}
                  </g>
                );
              })}
            </g>
          </motion.g>
        </svg>

        <motion.aside
          key={activeStep.id}
          className={`ig-node-copy lane-${activeStep.side} ${activeStep.final ? 'is-final' : ''}`}
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
        >
          <small>{activeStep.eyebrow}</small>
          <h1>{activeStep.title}</h1>
          {activeStep.copy && <p>{activeStep.copy}</p>}

          {activeStep.final ? (
            <>
              <div className="ig-final-rule" />
              <div className="ig-final-actions">
                <button className="ig-primary-action" type="button" onClick={onOpenWorkspace}>
                  Enter Workspace
                  <ArrowRight size={17} strokeWidth={1.7} />
                </button>
                <button
                  className="ig-icon-action"
                  type="button"
                  aria-label="Upload a spreadsheet"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={18} strokeWidth={1.7} />
                </button>
              </div>
              <button className="ig-sample-link" type="button" onClick={handleSampleLoad}>
                Open customer churn path
              </button>
            </>
          ) : (
            <span className="ig-continue-word">Continue</span>
          )}
        </motion.aside>

        <input
          ref={fileInputRef}
          className="ig-hidden-input"
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={handleFileChange}
        />
      </section>
    </div>
  );
}
