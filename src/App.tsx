import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Search,
  Sliders,
  Play,
  RotateCcw,
  Layers,
  Database,
  Server,
  ArrowRight,
  Info,
  Clock,
  Activity,
  Radio,
  Lock,
} from 'lucide-react';
import { TopBar } from './components/TopBar';
import { DnsTopologyCanvas } from './components/DnsTopologyCanvas';
import { CacheInspector } from './components/CacheInspector';
import { NetworkDelayLab } from './components/NetworkDelayLab';
import { PacketWireshark } from './components/PacketWireshark';
import { ScenarioDrawer } from './components/ScenarioDrawer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import {
  DelayParameters,
  DnsNode,
  DnsProtocol,
  DnsRecord,
  DnsRecordType,
  ResolutionTrace,
} from './types/network';
import {
  AUTHORITATIVE_DATABASE,
  INITIAL_BROWSER_CACHE,
  INITIAL_OS_CACHE,
  INITIAL_RESOLVER_CACHE,
  NETWORK_SCENARIOS,
  ScenarioDefinition,
  TOPOLOGY_NODES,
} from './data/defaultDnsDatabase';
import { simulateDnsQuery } from './utils/dnsSimulator';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'topology' | 'delay_lab' | 'caches' | 'packets' | 'scenarios' | 'architecture'
  >('topology');

  // Query parameters
  const [targetDomain, setTargetDomain] = useState('google.com');
  const [recordType, setRecordType] = useState<DnsRecordType>('A');
  const [resolutionMode, setResolutionMode] = useState<'recursive' | 'iterative'>('recursive');
  const [protocol, setProtocol] = useState<DnsProtocol>('UDP/53');

  // Multi-tier cache states
  const [browserCache, setBrowserCache] = useState<DnsRecord[]>(INITIAL_BROWSER_CACHE);
  const [osCache, setOsCache] = useState<DnsRecord[]>(INITIAL_OS_CACHE);
  const [resolverCache, setResolverCache] = useState<DnsRecord[]>(INITIAL_RESOLVER_CACHE);

  // Statistics
  const [cacheStats, setCacheStats] = useState({
    browserHits: 3,
    osHits: 2,
    resolverHits: 4,
    misses: 2,
  });

  // Delay simulation parameters
  const [delayParams, setDelayParams] = useState<DelayParameters>({
    packetSizeBytes: 512, // Standard DNS UDP payload
    bandwidthMbps: 100, // 100 Mbps link
    distanceKm: 2500, // 2,500 km link
    mediumSpeedKmPerSec: 200000, // Fiber glass speed ~200,000 km/s
    processingDelayMs: 0.2,
    queuePacketsWaiting: 3,
    queueBufferCapacity: 30,
    arrivalRatePacketsPerSec: 8000,
  });

  // Active Simulation Trace & Step Playback
  const [trace, setTrace] = useState<ResolutionTrace | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('cold_lookup');

  // Topology node states (for highlighting)
  const [nodes, setNodes] = useState<DnsNode[]>(TOPOLOGY_NODES);

  // Ref for playback timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time TTL decay timer (ticks every 1s)
  useEffect(() => {
    const ttlTimer = setInterval(() => {
      setBrowserCache((prev) =>
        prev
          .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - 1) }))
          .filter((r) => r.ttl > 0)
      );
      setOsCache((prev) =>
        prev
          .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - 1) }))
          .filter((r) => r.ttl > 0)
      );
      setResolverCache((prev) =>
        prev
          .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - 1) }))
          .filter((r) => r.ttl > 0)
      );
    }, 1000);
    return () => clearInterval(ttlTimer);
  }, []);

  // Run DNS Resolution
  const handleExecuteQuery = useCallback(() => {
    const newTrace = simulateDnsQuery({
      domain: targetDomain,
      recordType,
      mode: resolutionMode,
      protocol,
      browserCache,
      osCache,
      resolverCache,
      delayParams,
    });

    setTrace(newTrace);
    setCurrentStepIndex(0);
    setIsPlaying(true);

    // Update Cache Stats & Warm Caches
    if (newTrace.cacheHitAt === 'browser') {
      setCacheStats((s) => ({ ...s, browserHits: s.browserHits + 1 }));
    } else if (newTrace.cacheHitAt === 'os') {
      setCacheStats((s) => ({ ...s, osHits: s.osHits + 1 }));
      // OS hit warms browser cache
      if (newTrace.resolvedIp) {
        setBrowserCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `b-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: 60,
            originalTtl: 60,
            tier: 'browser',
            cachedAt: Date.now(),
          },
        ]);
      }
    } else if (newTrace.cacheHitAt === 'resolver') {
      setCacheStats((s) => ({ ...s, resolverHits: s.resolverHits + 1 }));
      // Resolver hit warms OS and Browser caches
      if (newTrace.resolvedIp) {
        setOsCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `os-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: 300,
            originalTtl: 300,
            tier: 'os',
            cachedAt: Date.now(),
          },
        ]);
        setBrowserCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `b-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: 60,
            originalTtl: 60,
            tier: 'browser',
            cachedAt: Date.now(),
          },
        ]);
      }
    } else if (newTrace.cacheHitAt === 'none') {
      // Full miss -> populate all 3 tiers with authoritative result!
      setCacheStats((s) => ({ ...s, misses: s.misses + 1 }));
      if (newTrace.resolvedIp) {
        const authData = AUTHORITATIVE_DATABASE[newTrace.domain];
        const authTtl = authData?.records[0]?.ttl || 300;

        setResolverCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `res-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: authTtl,
            originalTtl: authTtl,
            tier: 'resolver',
            cachedAt: Date.now(),
          },
        ]);
        setOsCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `os-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: Math.min(300, authTtl),
            originalTtl: Math.min(300, authTtl),
            tier: 'os',
            cachedAt: Date.now(),
          },
        ]);
        setBrowserCache((prev) => [
          ...prev.filter((r) => r.domain !== newTrace.domain),
          {
            id: `b-auto-${Date.now()}`,
            domain: newTrace.domain,
            type: recordType,
            value: newTrace.resolvedIp!,
            ttl: Math.min(60, authTtl),
            originalTtl: Math.min(60, authTtl),
            tier: 'browser',
            cachedAt: Date.now(),
          },
        ]);
      }
    }
  }, [
    targetDomain,
    recordType,
    resolutionMode,
    protocol,
    browserCache,
    osCache,
    resolverCache,
    delayParams,
  ]);

  // Initial simulation load on mount
  useEffect(() => {
    handleExecuteQuery();
  }, []);

  // Step Animation Playback effect
  useEffect(() => {
    if (isPlaying && trace) {
      playTimerRef.current = setTimeout(() => {
        if (currentStepIndex < trace.steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500 / speed);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, trace, speed]);

  // Update Node status based on active step
  useEffect(() => {
    if (!trace) return;
    const currentStep = trace.steps[currentStepIndex];
    if (!currentStep) return;

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        if (n.id === currentStep.fromNodeId) {
          return {
            ...n,
            status: currentStep.isCacheHit ? 'hit' : 'querying',
          };
        }
        if (n.id === currentStep.toNodeId) {
          return {
            ...n,
            status: currentStep.isQuery ? 'processing' : 'responding',
          };
        }
        return { ...n, status: 'idle' };
      })
    );
  }, [currentStepIndex, trace]);

  // Flush cache action
  const handleFlushCache = (tier: 'browser' | 'os' | 'resolver' | 'all') => {
    if (tier === 'browser' || tier === 'all') setBrowserCache([]);
    if (tier === 'os' || tier === 'all') setOsCache([]);
    if (tier === 'resolver' || tier === 'all') setResolverCache([]);
  };

  // Decay TTL action
  const handleDecayTtl = (seconds: number) => {
    setBrowserCache((prev) =>
      prev
        .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - seconds) }))
        .filter((r) => r.ttl > 0)
    );
    setOsCache((prev) =>
      prev
        .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - seconds) }))
        .filter((r) => r.ttl > 0)
    );
    setResolverCache((prev) =>
      prev
        .map((r) => ({ ...r, ttl: Math.max(0, r.ttl - seconds) }))
        .filter((r) => r.ttl > 0)
    );
  };

  // Add custom manual record to cache
  const handleAddCacheRecord = (
    tier: 'browser' | 'os' | 'resolver',
    record: Omit<DnsRecord, 'id'>
  ) => {
    const fullRecord: DnsRecord = {
      ...record,
      id: `manual-${Date.now()}`,
    };
    if (tier === 'browser') setBrowserCache((p) => [fullRecord, ...p]);
    if (tier === 'os') setOsCache((p) => [fullRecord, ...p]);
    if (tier === 'resolver') setResolverCache((p) => [fullRecord, ...p]);
  };

  // Select pre-packaged scenario
  const handleSelectScenario = (scenario: ScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    setTargetDomain(scenario.targetDomain);
    setRecordType(scenario.recordType);
    setResolutionMode(scenario.resolutionMode);
    setProtocol(scenario.protocol);

    let newBrowser: DnsRecord[] = [];
    let newOs: DnsRecord[] = [];
    let newResolver: DnsRecord[] = [];

    if (scenario.setupAction === 'warm_browser') {
      newBrowser = [
        {
          id: 'sc-b',
          domain: scenario.targetDomain,
          type: scenario.recordType,
          value: '54.148.37.106',
          ttl: 55,
          originalTtl: 60,
          tier: 'browser',
        },
      ];
    } else if (scenario.setupAction === 'warm_os') {
      newOs = [
        {
          id: 'sc-os',
          domain: scenario.targetDomain,
          type: scenario.recordType,
          value: '104.18.23.101',
          ttl: 1200,
          originalTtl: 1800,
          tier: 'os',
        },
      ];
    } else if (scenario.setupAction === 'warm_resolver') {
      newResolver = [
        {
          id: 'sc-res',
          domain: scenario.targetDomain,
          type: scenario.recordType,
          value: '208.80.154.224',
          ttl: 400,
          originalTtl: 600,
          tier: 'resolver',
        },
      ];
    } else if (scenario.setupAction === 'satellite') {
      setDelayParams((p) => ({
        ...p,
        distanceKm: 36000,
        mediumSpeedKmPerSec: 300000,
      }));
    }

    setBrowserCache(newBrowser);
    setOsCache(newOs);
    setResolverCache(newResolver);

    // Switch to topology view to observe execution
    setActiveTab('topology');

    // Trigger simulation
    setTimeout(() => {
      const newTrace = simulateDnsQuery({
        domain: scenario.targetDomain,
        recordType: scenario.recordType,
        mode: scenario.resolutionMode,
        protocol: scenario.protocol,
        browserCache: newBrowser,
        osCache: newOs,
        resolverCache: newResolver,
        delayParams,
      });
      setTrace(newTrace);
      setCurrentStepIndex(0);
      setIsPlaying(true);
    }, 100);
  };

  const handleResetAll = () => {
    setBrowserCache(INITIAL_BROWSER_CACHE);
    setOsCache(INITIAL_OS_CACHE);
    setResolverCache(INITIAL_RESOLVER_CACHE);
    setTargetDomain('google.com');
    setRecordType('A');
    setResolutionMode('recursive');
    setProtocol('UDP/53');
    setCacheStats({
      browserHits: 3,
      osHits: 2,
      resolverHits: 4,
      misses: 2,
    });
    setDelayParams({
      packetSizeBytes: 512,
      bandwidthMbps: 100,
      distanceKm: 2500,
      mediumSpeedKmPerSec: 200000,
      processingDelayMs: 0.2,
      queuePacketsWaiting: 3,
      queueBufferCapacity: 30,
      arrivalRatePacketsPerSec: 8000,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* 1. Universal Top Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunQuery={handleExecuteQuery}
        onResetAll={handleResetAll}
        isSimulating={isPlaying}
        protocol={protocol}
        onToggleProtocol={() =>
          setProtocol((p) => (p === 'UDP/53' ? 'DoH (HTTPS)' : 'UDP/53'))
        }
        resolutionMode={resolutionMode}
        onToggleResolutionMode={() =>
          setResolutionMode((m) => (m === 'recursive' ? 'iterative' : 'recursive'))
        }
      />

      {/* 2. Interactive Query & Resolution Toolbar */}
      <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] max-w-xl">
          <div className="relative flex-1">
            <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="Enter domain (e.g. google.com, mit.edu, wikipedia.org, fake-site.invalid)..."
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery()}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono text-xs"
            />
          </div>

          {/* Quick Domain Shortcuts */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              'google.com',
              'mit.edu',
              'wikipedia.org',
              'github.com',
              'shop.example.com',
              'fake-site.invalid',
            ].map((d) => (
              <button
                key={d}
                onClick={() => setTargetDomain(d)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  targetDomain === d
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Record Type and Mode Selectors */}
        <div className="flex items-center gap-3">
          {/* Record Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Type:</span>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as DnsRecordType)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs cursor-pointer"
            >
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="CNAME">CNAME (Alias)</option>
              <option value="MX">MX (Mail)</option>
              <option value="TXT">TXT (Text)</option>
            </select>
          </div>

          {/* Resolution Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setResolutionMode('recursive')}
              title="Resolver takes over full query resolution on client behalf"
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                resolutionMode === 'recursive'
                  ? 'bg-slate-800 text-sky-300 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recursive
            </button>
            <button
              onClick={() => setResolutionMode('iterative')}
              title="Client receives referrals and queries Root, TLD, and Auth step-by-step"
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                resolutionMode === 'iterative'
                  ? 'bg-slate-800 text-sky-300 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Iterative
            </button>
          </div>

          {/* Query Button */}
          <button
            onClick={handleExecuteQuery}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* 3. Main Body Tabs */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'topology' && (
          <DnsTopologyCanvas
            nodes={nodes}
            trace={trace}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            speed={speed}
            onSetStepIndex={(idx) => setCurrentStepIndex(idx)}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onSetSpeed={(s) => setSpeed(s)}
            onReset={() => {
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
          />
        )}

        {activeTab === 'delay_lab' && (
          <NetworkDelayLab
            delayParams={delayParams}
            onUpdateParams={(newP) => setDelayParams((prev) => ({ ...prev, ...newP }))}
          />
        )}

        {activeTab === 'caches' && (
          <CacheInspector
            browserCache={browserCache}
            osCache={osCache}
            resolverCache={resolverCache}
            cacheStats={cacheStats}
            onFlushCache={handleFlushCache}
            onDecayTtl={handleDecayTtl}
            onAddRecord={handleAddCacheRecord}
          />
        )}

        {activeTab === 'packets' && (
          <PacketWireshark
            trace={trace}
            selectedStepIndex={currentStepIndex}
            onSelectStepIndex={(idx) => setCurrentStepIndex(idx)}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioDrawer
            onSelectScenario={handleSelectScenario}
            activeScenarioId={activeScenarioId}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>
    </div>
  );
}
