import React, { useState } from 'react';
import {
  Server,
  Laptop,
  Database,
  Globe,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Info,
  ShieldCheck,
  X,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { DnsNode, DnsPacketStep, ResolutionTrace } from '../types/network';

interface DnsTopologyCanvasProps {
  nodes: DnsNode[];
  trace: ResolutionTrace | null;
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  onSetStepIndex: (idx: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

export const DnsTopologyCanvas: React.FC<DnsTopologyCanvasProps> = ({
  nodes,
  trace,
  currentStepIndex,
  isPlaying,
  speed,
  onSetStepIndex,
  onTogglePlay,
  onSetSpeed,
  onReset,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const currentStep: DnsPacketStep | undefined = trace?.steps[currentStepIndex];

  const getNode = (id: string) => nodes.find((n) => n.id === id);
  const fromNode = currentStep ? getNode(currentStep.fromNodeId) : null;
  const toNode = currentStep ? getNode(currentStep.toNodeId) : null;
  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;

  // Node Icon Mapping
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Laptop className="w-5 h-5 text-sky-400" />;
      case 'browser_cache':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'os_cache':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'local_resolver':
        return <Server className="w-5 h-5 text-amber-400" />;
      case 'root_server':
        return <Globe className="w-5 h-5 text-rose-400" />;
      case 'tld_server':
        return <Globe className="w-5 h-5 text-purple-400" />;
      case 'auth_server':
        return <Server className="w-5 h-5 text-cyan-400" />;
      case 'destination_host':
        return <Globe className="w-5 h-5 text-emerald-400" />;
      default:
        return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  const isNodeActive = (id: string) => {
    if (!currentStep) return false;
    return currentStep.fromNodeId === id || currentStep.toNodeId === id;
  };

  const isNodeHit = (id: string) => {
    if (!currentStep) return false;
    return currentStep.isCacheHit && currentStep.fromNodeId === id;
  };

  // Compute curved SVG path between two nodes
  const getFlightPath = (from: DnsNode, to: DnsNode) => {
    const startX = from.x + 80;
    const startY = from.y;
    const endX = to.x + 80;
    const endY = to.y;
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 - 30;
    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto">
      {/* Top Playback & Step Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-800 bg-slate-900/70 shrink-0">
        <div className="flex items-center gap-3">
          {/* Step Navigation Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onSetStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex <= 0}
              title="Previous Step"
              className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause Animation' : 'Auto Play'}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
            <button
              onClick={() =>
                onSetStepIndex(
                  trace ? Math.min(trace.steps.length - 1, currentStepIndex + 1) : 0
                )
              }
              disabled={!trace || currentStepIndex >= trace.steps.length - 1}
              title="Next Step"
              className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onReset}
              title="Reset to Step 1"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            <span className="text-[11px] text-slate-500 mr-1">Speed:</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                  speed === s
                    ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Step Progress */}
          <div className="text-xs font-mono text-slate-400">
            Step{' '}
            <span className="text-sky-400 font-bold tabular-nums">
              {trace ? currentStepIndex + 1 : 0}
            </span>{' '}
            of{' '}
            <span className="text-slate-300 tabular-nums">
              {trace ? trace.steps.length : 0}
            </span>
          </div>
        </div>

        {/* Live Trace Badge & Result */}
        {trace && (
          <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Domain:</span>
            <span className="font-mono text-sky-300 font-bold">{trace.domain}</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Result:</span>
            <span
              className={`font-mono font-bold ${
                trace.cacheHitAt === 'nxdomain' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {trace.cacheHitAt === 'nxdomain' ? 'NXDOMAIN' : trace.resolvedIp || 'Resolving...'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Total Latency:</span>
            <span className="font-mono text-amber-300 font-bold tabular-nums">
              {trace.totalDelayMs} ms
            </span>
          </div>
        )}
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="p-5 flex flex-col gap-4">
        {/* Visual Topology Diagram Card */}
        <div className="relative w-full h-[480px] border border-slate-800/90 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950 p-4 shadow-xl overflow-hidden select-none">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Connection Links and Flying Packets */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="linkDefault" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="activeFlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Static Topology Links */}
            {/* Client -> Browser Cache */}
            <path
              d="M 170 230 C 180 150, 200 120, 240 120"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Client -> OS Cache */}
            <path
              d="M 170 250 C 180 330, 200 360, 240 360"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Client -> Local Resolver */}
            <path
              d="M 170 240 L 480 240"
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* Local Resolver -> Root */}
            <path
              d="M 570 230 C 620 150, 680 90, 740 90"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Local Resolver -> TLD */}
            <path
              d="M 570 240 L 740 240"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Local Resolver -> Authoritative */}
            <path
              d="M 570 250 C 620 330, 680 390, 740 390"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Authoritative -> Destination Host */}
            <path
              d="M 830 390 C 880 350, 910 280, 950 240"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Dynamic Active Packet Arc */}
            {fromNode && toNode && (
              <g>
                <path
                  d={getFlightPath(fromNode, toNode)}
                  fill="none"
                  stroke="url(#activeFlight)"
                  strokeWidth="4"
                  filter="url(#glowEffect)"
                />
                {/* Ping Marker at Destination */}
                <circle
                  cx={toNode.x + 80}
                  cy={toNode.y}
                  r="7"
                  fill="#38bdf8"
                  className="animate-ping"
                />
              </g>
            )}
          </svg>

          {/* Render Topology Node Cards */}
          {nodes.map((node) => {
            const active = isNodeActive(node.id);
            const isHit = isNodeHit(node.id);
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y - 42}px`,
                }}
                className={`absolute w-44 p-3 rounded-xl border transition-all duration-300 cursor-pointer z-10 select-none shadow-md ${
                  isHit
                    ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-emerald-500/20'
                    : active
                    ? 'bg-slate-900 border-sky-400 ring-2 ring-sky-400/40 shadow-sky-500/20 scale-105'
                    : isSelected
                    ? 'bg-slate-900 border-indigo-400 ring-2 ring-indigo-400/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/80 shrink-0">
                    {getNodeIcon(node.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {node.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {node.ip}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-1 flex items-center justify-between">
                  <span className="truncate text-[10px]">{node.label}</span>
                  {isHit ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 inline" /> HIT
                    </span>
                  ) : active ? (
                    <span className="text-[10px] text-sky-400 font-mono font-bold animate-pulse">
                      ACTIVE
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Node Inspector Drawer on Selection */}
          {selectedNode && (
            <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getNodeIcon(selectedNode.type)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">
                        {selectedNode.name}
                      </h4>
                      <p className="text-[10px] font-mono text-sky-400">
                        {selectedNode.ip}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Role / Tier
                    </span>
                    <p className="text-slate-300 font-medium">{selectedNode.label}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Physical Location
                    </span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {selectedNode.location || 'Local Subnet'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Software Daemon
                    </span>
                    <p className="text-slate-300 font-mono text-[11px]">
                      {selectedNode.software || 'RFC 1035 Standard'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Functional Description
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {selectedNode.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
                <span>Click outside or X to close</span>
                <span className="text-sky-400 font-mono">Status: {selectedNode.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step Explanation & Delay Decomposition Card */}
        {currentStep ? (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentStep.isCacheHit
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-sky-400'
                  }`}
                />
                <span className="text-sm font-bold text-slate-100">
                  Step {currentStep.stepIndex}: {currentStep.label}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                  {currentStep.protocol}
                </span>
              </div>

              {/* Hop Latency Metric */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">
                  Distance:{' '}
                  <span className="text-slate-200 font-bold">
                    {currentStep.hopDelays.distanceKm.toLocaleString()} km
                  </span>
                </span>
                <span className="text-slate-400">
                  Hop Latency:{' '}
                  <span className="text-amber-400 font-bold">
                    {currentStep.hopDelays.totalHopDelayMs} ms
                  </span>
                </span>
              </div>
            </div>

            {/* Step Description */}
            <p className="text-xs text-slate-300 leading-relaxed mt-3">
              {currentStep.description}
            </p>

            {/* 4-Delay Math Deconstruction Strip */}
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  Trans (L / R)
                </div>
                <div className="text-xs font-bold text-sky-400 font-mono mt-0.5">
                  {currentStep.hopDelays.transDelayMs} ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Packet: {currentStep.hopDelays.packetSizeBytes}B
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  Prop (d / s)
                </div>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  {currentStep.hopDelays.propDelayMs} ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Dist: {currentStep.hopDelays.distanceKm.toLocaleString()} km
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  Proc (d_proc)
                </div>
                <div className="text-xs font-bold text-purple-400 font-mono mt-0.5">
                  {currentStep.hopDelays.procDelayMs} ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Header inspect
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  Queue (d_queue)
                </div>
                <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                  {currentStep.hopDelays.queueDelayMs} ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Intensity: {currentStep.hopDelays.trafficIntensity ?? '0.00'}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
