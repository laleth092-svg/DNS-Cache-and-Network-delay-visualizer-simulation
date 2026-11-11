import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Server,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  FastForward,
  ShieldAlert,
  X,
} from 'lucide-react';
import { DnsRecord, DnsRecordType } from '../types/network';

interface CacheInspectorProps {
  browserCache: DnsRecord[];
  osCache: DnsRecord[];
  resolverCache: DnsRecord[];
  cacheStats: {
    browserHits: number;
    osHits: number;
    resolverHits: number;
    misses: number;
  };
  onFlushCache: (tier: 'browser' | 'os' | 'resolver' | 'all') => void;
  onDecayTtl: (seconds: number) => void;
  onAddRecord: (tier: 'browser' | 'os' | 'resolver', record: Omit<DnsRecord, 'id'>) => void;
}

export const CacheInspector: React.FC<CacheInspectorProps> = ({
  browserCache,
  osCache,
  resolverCache,
  cacheStats,
  onFlushCache,
  onDecayTtl,
  onAddRecord,
}) => {
  const [selectedTier, setSelectedTier] = useState<'all' | 'browser' | 'os' | 'resolver'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New record form state
  const [newDomain, setNewDomain] = useState('custom-service.io');
  const [newType, setNewType] = useState<DnsRecordType>('A');
  const [newValue, setNewValue] = useState('198.51.100.77');
  const [newTtl, setNewTtl] = useState(300);
  const [targetTier, setTargetTier] = useState<'browser' | 'os' | 'resolver'>('browser');

  const totalHits = cacheStats.browserHits + cacheStats.osHits + cacheStats.resolverHits;
  const totalQueries = totalHits + cacheStats.misses;
  const hitRatio = totalQueries > 0 ? ((totalHits / totalQueries) * 100).toFixed(1) : '0.0';

  // Helper to filter records
  const filterRecords = (records: DnsRecord[], tierName: 'browser' | 'os' | 'resolver') => {
    return records
      .filter((r) => {
        if (selectedTier !== 'all' && selectedTier !== tierName) return false;
        if (!searchQuery) return true;
        return (
          r.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .map((r) => ({ ...r, tier: tierName }));
  };

  const allFilteredRecords = [
    ...filterRecords(browserCache, 'browser'),
    ...filterRecords(osCache, 'os'),
    ...filterRecords(resolverCache, 'resolver'),
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newValue.trim()) return;
    onAddRecord(targetTier, {
      domain: newDomain.trim().toLowerCase(),
      type: newType,
      value: newValue.trim(),
      ttl: Number(newTtl),
      originalTtl: Number(newTtl),
      tier: targetTier,
      cachedAt: Date.now(),
    });
    setShowAddModal(false);
  };

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'browser':
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case 'os':
        return <Database className="w-3.5 h-3.5 text-indigo-400" />;
      case 'resolver':
        return <Server className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'browser':
        return 'L1 Browser';
      case 'os':
        return 'L2 OS Stub';
      case 'resolver':
        return 'L3 Resolver';
      default:
        return tier;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Multi-Tier DNS Cache Inspector &amp; TTL Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time inspection of L1 Browser memory, L2 OS stub resolver (getaddrinfo), and L3 recursive resolver caches. Monitor active TTL countdowns and simulate cache warming or eviction.
          </p>
        </div>

        {/* Global Flush & Add Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject Custom Record</span>
          </button>
          <button
            onClick={() => onFlushCache('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/80 text-xs font-medium rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush All Caches</span>
          </button>
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">Overall Hit Ratio</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {hitRatio}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {totalHits} hits / {totalQueries} queries
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">L1 Browser Hits</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {cacheStats.browserHits}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Sub-millisecond resolution
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">L2 OS Hits</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            {cacheStats.osHits}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Kernel IPC / systemd-resolved
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-mono">L3 Resolver Hits</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {cacheStats.resolverHits}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            ISP PoP / Root-TLD bypassed
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
        {/* Tier Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['all', 'browser', 'os', 'resolver'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1 rounded text-xs capitalize transition-colors font-medium ${
                selectedTier === tier
                  ? 'bg-slate-800 text-sky-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : tier === 'browser' ? 'L1 Browser' : tier === 'os' ? 'L2 OS' : 'L3 Resolver'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain, IP, or type..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Time Travel Controls (Decay TTL) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Age TTLs:</span>
          </span>
          <button
            onClick={() => onDecayTtl(10)}
            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-mono"
          >
            +10s
          </button>
          <button
            onClick={() => onDecayTtl(60)}
            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-mono"
          >
            +60s
          </button>
          <button
            onClick={() => onDecayTtl(300)}
            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs font-mono"
          >
            +300s
          </button>
        </div>
      </div>

      {/* Cached Records Table */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-lg">
        {allFilteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-mono">
            No cached DNS records found in selected tier. Run a query in the Topology view or inject a record above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cache Tier</th>
                  <th className="py-3 px-4">Domain Name</th>
                  <th className="py-3 px-4">Record Type</th>
                  <th className="py-3 px-4">Resolved IP / Value</th>
                  <th className="py-3 px-4">Remaining TTL</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {allFilteredRecords.map((record) => {
                  const ttlPercent = Math.min(
                    100,
                    Math.round((record.ttl / (record.originalTtl || 300)) * 100)
                  );
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 flex items-center gap-2">
                        {getTierIcon(record.tier)}
                        <span className="font-semibold text-slate-300">
                          {getTierLabel(record.tier)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sky-300 font-bold">
                        {record.domain}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-semibold">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-300 font-semibold">
                        {record.value}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${ttlPercent}%` }}
                              className={`h-full transition-all duration-500 ${
                                ttlPercent > 40
                                  ? 'bg-emerald-400'
                                  : ttlPercent > 15
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <span
                            className={`tabular-nums font-bold ${
                              record.ttl < 30 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                            }`}
                          >
                            {record.ttl}s
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Hot
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Custom Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Inject Custom DNS Cache Record</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Cache Tier</label>
                <select
                  value={targetTier}
                  onChange={(e) =>
                    setTargetTier(e.target.value as 'browser' | 'os' | 'resolver')
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="browser">L1 Browser Cache (RAM)</option>
                  <option value="os">L2 Operating System Stub Resolver</option>
                  <option value="resolver">L3 Local Recursive Resolver (ISP)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Domain Name</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. portal.example.internal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Record Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DnsRecordType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="A">A (IPv4)</option>
                    <option value="AAAA">AAAA (IPv6)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                    <option value="MX">MX (Mail)</option>
                    <option value="TXT">TXT (Text)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">TTL (Seconds)</label>
                  <input
                    type="number"
                    value={newTtl}
                    onChange={(e) => setNewTtl(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Value / IP Address</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 198.51.100.77"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg"
                >
                  Inject Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
