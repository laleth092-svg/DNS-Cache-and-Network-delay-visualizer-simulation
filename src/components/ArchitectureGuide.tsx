import React, { useState } from 'react';
import {
  Code2,
  Cpu,
  Layers,
  Server,
  Terminal,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Shield,
  FileCode,
  CheckCircle2,
  FolderTree,
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto">
      {/* Title Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-400" />
            <span>NetScope Architecture &amp; Setup Requirements</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Detailed engineering overview of the multi-tier DNS cache state machine, physical delay calculation engine, RFC 1035 packet dissector, and local deployment guide.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span>Target Runtime:</span>
          <span className="text-emerald-400 font-bold">Node.js / Bun / Browser SPA</span>
        </div>
      </div>

      {/* 1. System Architecture Diagram */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>1. High-Level Modular Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/30">
            <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>UI &amp; Presentation</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              React 19 SPA powered by Vite and Tailwind CSS. Renders interactive SVG topologies, real-time TTL gauges, and Wireshark dissectors.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              src/components/*.tsx
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
              <Layers className="w-4 h-4" />
              <span>Multi-Tier Cache State</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Manages three isolated cache tiers (L1 Browser memory, L2 OS stub resolver, L3 ISP Recursive Resolver) with active 1Hz TTL decay tickers.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              src/data/defaultDnsDatabase.ts
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs">
              <Server className="w-4 h-4" />
              <span>DNS Simulation Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Executes Recursive &amp; Iterative walk logic. Emulates Root (.), TLD (.com/.org), Authoritative servers, CNAME aliasing, and NXDOMAIN.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              src/utils/dnsSimulator.ts
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2 text-purple-400 font-bold text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Delay Physics Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Computes Kurose &amp; Ross fundamental delays: transmission (L/R), propagation (d/s), nodal processing, and queue buffer overflow.
            </p>
            <div className="text-[10px] font-mono text-slate-500">
              src/utils/dnsSimulator.ts
            </div>
          </div>
        </div>
      </div>

      {/* 2. Setup & Deployment Requirements */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>2. Setup &amp; Deployment Requirements</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Local Development Commands */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">
              Local Development Installation
            </h4>
            <p className="text-xs text-slate-400">
              NetScope runs seamlessly on modern Node.js (v18+) or Bun.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 relative group">
              <button
                onClick={() =>
                  handleCopy(
                    `# 1. Clone repository
git clone https://github.com/laleth092-svg/DNS-Cache-and-Network-delay-visualizer.git
cd DNS-Cache-and-Network-delay-visualizer

# 2. Install dependencies
npm install

# 3. Start local development server (port 3000)
npm run dev`,
                    'local_setup'
                  )
                }
                className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                {copiedIndex === 'local_setup' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre className="overflow-x-auto">
{`# 1. Clone repository
git clone https://github.com/laleth092-svg/DNS-Cache-and-Network-delay-visualizer.git
cd DNS-Cache-and-Network-delay-visualizer

# 2. Install dependencies
npm install

# 3. Start local development server (port 3000)
npm run dev`}
              </pre>
            </div>
          </div>

          {/* Production Build & GitHub Pages Workflow */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">
              Production Build &amp; GitHub Pages Hosting
            </h4>
            <p className="text-xs text-slate-400">
              Configured with relative asset paths (<span className="font-mono text-sky-400">base: './'</span> in <span className="font-mono text-slate-300">vite.config.ts</span>) and automated <span className="font-mono text-sky-400">docs/</span> synchronization for GitHub Pages.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 relative group">
              <button
                onClick={() =>
                  handleCopy(
                    `# 1. Build optimized bundle and mirror to docs/
npm run build

# 2. Deploy to GitHub Pages (or push to main)
git add docs/ dist/
git commit -m "Deploy latest build"
git push origin main`,
                    'deploy_setup'
                  )
                }
                className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                {copiedIndex === 'deploy_setup' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre className="overflow-x-auto">
{`# 1. Build optimized bundle and mirror to docs/
npm run build

# 2. Deploy to GitHub Pages (or push to main)
git add docs/ dist/
git commit -m "Deploy latest build"
git push origin main`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Reference Sheet */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>3. Mathematical Derivations &amp; Networking Formulas</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-sky-400 font-mono font-bold">
              Transmission Delay: d_trans = L / R
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Where <span className="font-mono text-slate-300">L</span> is packet size in bits, and <span className="font-mono text-slate-300">R</span> is transmission rate in bits/sec. Independent of distance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-emerald-400 font-mono font-bold">
              Propagation Delay: d_prop = d / s
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Where <span className="font-mono text-slate-300">d</span> is distance in meters, and <span className="font-mono text-slate-300">s</span> is propagation speed (~2×10⁸ m/s in fiber optic glass, ~3×10⁸ m/s in vacuum).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-purple-400 font-mono font-bold">
              Nodal Processing Delay: d_proc
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Header examination time, bit-level error checking, and routing table forwarding lookup in router memory/hardware ASIC.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-mono font-bold">
              Queuing Delay &amp; Traffic Intensity: I = (L · a) / R
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Where <span className="font-mono text-slate-300">a</span> is arrival rate. If <span className="font-mono text-slate-300">I &gt; 1.0</span>, queue capacity is exceeded and packet drops occur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
