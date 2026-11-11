import React from 'react';
import {
  Network,
  Play,
  RotateCcw,
  Activity,
  Layers,
  FileText,
  BookOpen,
  Code2,
  Lock,
  Radio,
  Zap,
} from 'lucide-react';
import { DnsProtocol } from '../types/network';

interface TopBarProps {
  activeTab: 'topology' | 'delay_lab' | 'caches' | 'packets' | 'scenarios' | 'architecture';
  setActiveTab: (
    tab: 'topology' | 'delay_lab' | 'caches' | 'packets' | 'scenarios' | 'architecture'
  ) => void;
  onRunQuery: () => void;
  onResetAll: () => void;
  isSimulating: boolean;
  protocol: DnsProtocol;
  onToggleProtocol: () => void;
  resolutionMode: 'recursive' | 'iterative';
  onToggleResolutionMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onRunQuery,
  onResetAll,
  isSimulating,
  protocol,
  onToggleProtocol,
  resolutionMode,
  onToggleResolutionMode,
}) => {
  const tabs = [
    { id: 'topology', label: 'DNS Topology', icon: Network },
    { id: 'delay_lab', label: 'Delay Physics Lab', icon: Zap },
    { id: 'caches', label: 'Multi-Tier Caches', icon: Layers },
    { id: 'packets', label: 'Packet Inspector', icon: FileText },
    { id: 'scenarios', label: 'Lab & Quiz', icon: BookOpen },
    { id: 'architecture', label: 'Architecture & Setup', icon: Code2 },
  ] as const;

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-slate-900 border-b border-slate-800 text-white select-none z-30">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/20">
          <Network className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-100">
              NetScope DNS
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/80">
              v2.4
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Multi-Tier Caching &amp; 4-Delay Network Visualizer
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/90 overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Protocol & Mode Switchers + Action Button */}
      <div className="flex items-center gap-2.5">
        {/* DoH / UDP Toggle */}
        <button
          onClick={onToggleProtocol}
          title="Toggle between standard UDP/53 and encrypted DNS-over-HTTPS (DoH)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            protocol === 'DoH (HTTPS)'
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {protocol === 'DoH (HTTPS)' ? (
            <Lock className="w-3 h-3 text-emerald-400" />
          ) : (
            <Radio className="w-3 h-3 text-sky-400" />
          )}
          <span>{protocol}</span>
        </button>

        {/* Recursive vs Iterative Toggle */}
        <button
          onClick={onToggleResolutionMode}
          title="Toggle Recursive (Resolver executes walk) vs Iterative (Client receives referrals)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 transition-all"
        >
          <Activity className="w-3 h-3 text-amber-400" />
          <span className="capitalize">{resolutionMode}</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetAll}
          title="Reset all caches, delays, and topology"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Resolve Button */}
        <button
          onClick={onRunQuery}
          disabled={isSimulating}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm ${
            isSimulating
              ? 'bg-sky-600/50 text-sky-200 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold active:scale-95'
          }`}
        >
          <Play className="w-3 h-3 fill-current" />
          <span>{isSimulating ? 'In Flight...' : 'Run Query'}</span>
        </button>
      </div>
    </header>
  );
};
