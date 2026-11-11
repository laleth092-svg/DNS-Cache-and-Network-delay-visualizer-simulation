import React, { useState } from 'react';
import {
  Activity,
  Layers,
  Zap,
  Globe,
  Radio,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DelayParameters } from '../types/network';

interface NetworkDelayLabProps {
  delayParams: DelayParameters;
  onUpdateParams: (newParams: Partial<DelayParameters>) => void;
}

export const NetworkDelayLab: React.FC<NetworkDelayLabProps> = ({
  delayParams,
  onUpdateParams,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('transatlantic');

  // Math derivations
  const L_bits = delayParams.packetSizeBytes * 8;
  const R_bps = delayParams.bandwidthMbps * 1_000_000;

  // d_trans = L / R (in ms)
  const d_trans = (L_bits / R_bps) * 1000;

  // d_prop = d / s (in ms)
  const d_prop = (delayParams.distanceKm / delayParams.mediumSpeedKmPerSec) * 1000;

  // d_proc (in ms)
  const d_proc = delayParams.processingDelayMs;

  // Queuing: traffic intensity I = (L * a) / R
  const trafficIntensity = Number(
    ((L_bits * delayParams.arrivalRatePacketsPerSec) / R_bps).toFixed(3)
  );

  // Queuing delay: (N * L) / R
  const d_queue = ((delayParams.queuePacketsWaiting * L_bits) / R_bps) * 1000;

  // Total Nodal Delay: d_nodal = d_proc + d_queue + d_trans + d_prop
  const d_nodal = d_proc + d_queue + d_trans + d_prop;

  // Proportions for stacked bar chart
  const p_proc = d_nodal > 0 ? (d_proc / d_nodal) * 100 : 0;
  const p_queue = d_nodal > 0 ? (d_queue / d_nodal) * 100 : 0;
  const p_trans = d_nodal > 0 ? (d_trans / d_nodal) * 100 : 0;
  const p_prop = d_nodal > 0 ? (d_prop / d_nodal) * 100 : 0;

  const isBufferOverflow =
    delayParams.queuePacketsWaiting >= delayParams.queueBufferCapacity ||
    trafficIntensity > 1.0;

  // Presets
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    switch (presetKey) {
      case 'lan':
        onUpdateParams({
          distanceKm: 0.1, // 100 meters
          bandwidthMbps: 1000, // 1 Gbps LAN
          packetSizeBytes: 512,
          mediumSpeedKmPerSec: 200000,
          processingDelayMs: 0.02,
          queuePacketsWaiting: 1,
          arrivalRatePacketsPerSec: 10000,
        });
        break;
      case 'metro_fiber':
        onUpdateParams({
          distanceKm: 50, // 50 km
          bandwidthMbps: 1000,
          packetSizeBytes: 512,
          mediumSpeedKmPerSec: 200000,
          processingDelayMs: 0.05,
          queuePacketsWaiting: 3,
          arrivalRatePacketsPerSec: 20000,
        });
        break;
      case 'continental':
        onUpdateParams({
          distanceKm: 4000, // NYC to SF
          bandwidthMbps: 100,
          packetSizeBytes: 1500,
          mediumSpeedKmPerSec: 200000,
          processingDelayMs: 0.15,
          queuePacketsWaiting: 6,
          arrivalRatePacketsPerSec: 5000,
        });
        break;
      case 'transatlantic':
        onUpdateParams({
          distanceKm: 6500, // London to NYC Subsea Cable
          bandwidthMbps: 100,
          packetSizeBytes: 512,
          mediumSpeedKmPerSec: 200000,
          processingDelayMs: 0.25,
          queuePacketsWaiting: 5,
          arrivalRatePacketsPerSec: 8000,
        });
        break;
      case 'leo_satellite':
        onUpdateParams({
          distanceKm: 550, // Starlink LEO altitude
          mediumSpeedKmPerSec: 300000, // speed of light in vacuum
          bandwidthMbps: 150,
          packetSizeBytes: 1500,
          processingDelayMs: 0.4,
          queuePacketsWaiting: 10,
          arrivalRatePacketsPerSec: 10000,
        });
        break;
      case 'geo_satellite':
        onUpdateParams({
          distanceKm: 36000, // Geostationary Orbit 36,000km
          mediumSpeedKmPerSec: 300000,
          bandwidthMbps: 25,
          packetSizeBytes: 1500,
          processingDelayMs: 0.6,
          queuePacketsWaiting: 15,
          arrivalRatePacketsPerSec: 1800,
        });
        break;
      case 'mars_relay':
        onUpdateParams({
          distanceKm: 54600000, // 54.6 million km closest approach
          mediumSpeedKmPerSec: 300000,
          bandwidthMbps: 2,
          packetSizeBytes: 1024,
          processingDelayMs: 2.0,
          queuePacketsWaiting: 40,
          arrivalRatePacketsPerSec: 100,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-y-auto p-6">
      {/* Header and Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>The Four Fundamental Network Delays Laboratory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Every network hop experiences cumulative nodal delay modeled by Kurose &amp; Ross:
            <span className="font-mono text-sky-300 font-semibold mx-1">
              d_nodal = d_proc + d_queue + d_trans + d_prop
            </span>
            . Adjust physical link variables to observe how speed of light, bandwidth, packet size, and queue buffering interact.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0">
          {[
            { id: 'lan', label: '10G LAN' },
            { id: 'metro_fiber', label: 'Metro 50km' },
            { id: 'continental', label: 'US 4000km' },
            { id: 'transatlantic', label: 'Subsea Cable' },
            { id: 'leo_satellite', label: 'Starlink LEO' },
            { id: 'geo_satellite', label: 'GEO Orbit' },
            { id: 'mars_relay', label: 'Mars Relay' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${
                selectedPreset === preset.id
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Mathematical Display Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 border border-slate-800/90 shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Live Equation Breakdown */}
          <div className="flex-1 w-full">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Formula Execution: d_nodal = d_proc + d_queue + d_trans + d_prop
            </div>
            <div className="flex flex-wrap items-baseline gap-2 text-lg sm:text-xl font-mono">
              <span className="text-white font-bold text-2xl sm:text-3xl">
                {d_nodal.toFixed(3)} ms
              </span>
              <span className="text-slate-600">=</span>
              <span className="text-purple-400 font-semibold" title="Processing delay">
                {d_proc.toFixed(3)} ms
              </span>
              <span className="text-slate-600">+</span>
              <span className="text-amber-400 font-semibold" title="Queuing delay">
                {d_queue.toFixed(3)} ms
              </span>
              <span className="text-slate-600">+</span>
              <span className="text-sky-400 font-semibold" title="Transmission delay">
                {d_trans.toFixed(3)} ms
              </span>
              <span className="text-slate-600">+</span>
              <span className="text-emerald-400 font-semibold" title="Propagation delay">
                {d_prop.toFixed(3)} ms
              </span>
            </div>

            {/* Stacked Percentage Visual Bar */}
            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 flex overflow-hidden mt-4">
              <div
                style={{ width: `${p_proc}%` }}
                title={`Processing: ${p_proc.toFixed(1)}%`}
                className="bg-purple-500 transition-all duration-300"
              />
              <div
                style={{ width: `${p_queue}%` }}
                title={`Queuing: ${p_queue.toFixed(1)}%`}
                className="bg-amber-500 transition-all duration-300"
              />
              <div
                style={{ width: `${p_trans}%` }}
                title={`Transmission: ${p_trans.toFixed(1)}%`}
                className="bg-sky-500 transition-all duration-300"
              />
              <div
                style={{ width: `${p_prop}%` }}
                title={`Propagation: ${p_prop.toFixed(1)}%`}
                className="bg-emerald-500 transition-all duration-300"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono mt-3 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span>d_proc ({p_proc.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>d_queue ({p_queue.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                <span>d_trans ({p_trans.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>d_prop ({p_prop.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Traffic Intensity & Buffer State Meter */}
          <div className="w-full lg:w-72 p-4 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-mono">Traffic Intensity (I = La/R):</span>
              <span
                className={`font-mono font-bold ${
                  trafficIntensity > 1.0
                    ? 'text-rose-400'
                    : trafficIntensity > 0.8
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {trafficIntensity}
              </span>
            </div>

            {/* Traffic Intensity Meter Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                style={{ width: `${Math.min(100, trafficIntensity * 100)}%` }}
                className={`h-full transition-all duration-300 ${
                  trafficIntensity > 1.0
                    ? 'bg-rose-500 animate-pulse'
                    : trafficIntensity > 0.8
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
            </div>

            <div className="text-[11px] leading-relaxed">
              {trafficIntensity > 1.0 ? (
                <div className="flex items-start gap-1.5 text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Buffer Overflow!</strong> Arrival rate exceeds link capacity. Queued packets will be dropped.
                  </span>
                </div>
              ) : trafficIntensity > 0.8 ? (
                <div className="text-amber-300">
                  ⚠️ Heavy queuing delay. Buffer near capacity.
                </div>
              ) : (
                <div className="text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>Stable queue. Zero packet drops.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Interactive Sliders & Animated Queue Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Parameter Sliders */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Link &amp; Medium Physical Parameters</span>
            </h3>

            {/* Distance d */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Physical Distance <span className="font-mono text-emerald-400 font-semibold">(d)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.distanceKm.toLocaleString()} km
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="40000"
                step="10"
                value={delayParams.distanceKm}
                onChange={(e) =>
                  onUpdateParams({ distanceKm: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.1 km (LAN)</span>
                <span>6,500 km (Subsea)</span>
                <span>36,000 km (GEO)</span>
              </div>
            </div>

            {/* Bandwidth R */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Link Transmission Rate <span className="font-mono text-sky-400 font-semibold">(R)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.bandwidthMbps} Mbps
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10000"
                step="10"
                value={delayParams.bandwidthMbps}
                onChange={(e) =>
                  onUpdateParams({ bandwidthMbps: parseFloat(e.target.value) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Mbps (Cellular edge)</span>
                <span>1,000 Mbps (1G)</span>
                <span>10,000 Mbps (10G Fiber)</span>
              </div>
            </div>

            {/* Packet Size L */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Packet Payload Size <span className="font-mono text-sky-400 font-semibold">(L)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.packetSizeBytes} Bytes ({delayParams.packetSizeBytes * 8} bits)
                </span>
              </div>
              <input
                type="range"
                min="64"
                max="9000"
                step="64"
                value={delayParams.packetSizeBytes}
                onChange={(e) =>
                  onUpdateParams({ packetSizeBytes: parseInt(e.target.value, 10) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>64 B (DNS query)</span>
                <span>1,500 B (Standard MTU)</span>
                <span>9,000 B (Jumbo Frame)</span>
              </div>
            </div>

            {/* Medium Speed s */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Propagation Speed in Medium <span className="font-mono text-emerald-400 font-semibold">(s)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.mediumSpeedKmPerSec.toLocaleString()} km/s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateParams({ mediumSpeedKmPerSec: 200000 })}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono transition-colors border ${
                    delayParams.mediumSpeedKmPerSec === 200000
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Fiber Glass (200,000 km/s)
                </button>
                <button
                  onClick={() => onUpdateParams({ mediumSpeedKmPerSec: 300000 })}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono transition-colors border ${
                    delayParams.mediumSpeedKmPerSec === 300000
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Vacuum / Air (300,000 km/s)
                </button>
              </div>
            </div>
          </div>

          {/* Router Node Processing & Buffer Sliders */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Router Processing &amp; Queue Buffering</span>
            </h3>

            {/* Processing Delay d_proc */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Node Processing Delay <span className="font-mono text-purple-400 font-semibold">(d_proc)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.processingDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="5.0"
                step="0.02"
                value={delayParams.processingDelayMs}
                onChange={(e) =>
                  onUpdateParams({ processingDelayMs: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Queued Packets Waiting N */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Packets in Queue Buffer <span className="font-mono text-amber-400 font-semibold">(N)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.queuePacketsWaiting} / {delayParams.queueBufferCapacity} packets
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={delayParams.queueBufferCapacity}
                value={delayParams.queuePacketsWaiting}
                onChange={(e) =>
                  onUpdateParams({ queuePacketsWaiting: parseInt(e.target.value, 10) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Arrival Rate a */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">
                  Arrival Rate <span className="font-mono text-rose-400 font-semibold">(a)</span>:
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {delayParams.arrivalRatePacketsPerSec.toLocaleString()} pkt/s
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={delayParams.arrivalRatePacketsPerSec}
                onChange={(e) =>
                  onUpdateParams({
                    arrivalRatePacketsPerSec: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Visual Queuing & Transmission Buffer Diagram */}
        <div className="space-y-4">
          {/* Animated Router Queue Buffer Box */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Router Output Port Queue Buffer (FIFO)</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Capacity: {delayParams.queueBufferCapacity} Slots
              </span>
            </div>

            {/* Visual Queue Slots */}
            <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase font-mono mb-2 flex items-center justify-between">
                <span>Incoming Link (Arrival a)</span>
                <span>Buffer Slots (N={delayParams.queuePacketsWaiting})</span>
                <span>Output Link (Rate R)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Inbound stream indicator */}
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-sky-400 animate-pulse" />
                </div>

                {/* Queue Box with Packet Blocks */}
                <div className="flex-1 h-12 rounded-lg bg-slate-900 border border-slate-700 p-1.5 flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: delayParams.queueBufferCapacity }).map((_, idx) => {
                    const isOccupied = idx < delayParams.queuePacketsWaiting;
                    return (
                      <div
                        key={idx}
                        className={`h-full flex-1 min-w-[8px] max-w-[14px] rounded transition-all duration-200 ${
                          isOccupied
                            ? isBufferOverflow
                              ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                              : 'bg-amber-400 shadow-sm shadow-amber-400/40'
                            : 'bg-slate-800/60 border border-dashed border-slate-700/50'
                        }`}
                        title={
                          isOccupied
                            ? `Packet #${idx + 1} (${delayParams.packetSizeBytes}B)`
                            : `Empty Slot #${idx + 1}`
                        }
                      />
                    );
                  })}
                </div>

                {/* Transmitter / Transmit Out */}
                <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-600/60 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-sky-400" />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              When packets arrive at rate{' '}
              <strong className="text-slate-200 font-mono">a = {delayParams.arrivalRatePacketsPerSec} pkt/s</strong>{' '}
              and the transmission link can clear packets at rate{' '}
              <strong className="text-slate-200 font-mono">
                R/L = {Math.round(R_bps / L_bits).toLocaleString()} pkt/s
              </strong>
              , queue delay increases sharply as traffic intensity approaches 1.0.
            </div>
          </div>

          {/* Educational Concept Guide */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Delay Concepts &amp; Real-World Trade-Offs</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <strong className="text-sky-300">Transmission vs. Propagation:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Transmission delay (<span className="font-mono text-sky-400">L/R</span>) is the time required to push all packet bits onto the wire. Propagation delay (<span className="font-mono text-emerald-400">d/s</span>) is the physical transit time across the distance at the speed of light.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <strong className="text-amber-300">The Speed of Light Limit:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  No amount of bandwidth can overcome propagation delay. London to New York (6,500 km in fiber) incurs a hard physical lower bound of ~32.5 ms one-way (~65 ms round-trip).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <strong className="text-purple-300">Processing &amp; Queuing:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Processing delay (<span className="font-mono text-purple-400">d_proc</span>) is fixed by router CPU/ASIC speed. Queuing delay (<span className="font-mono text-amber-400">d_queue</span>) is variable and depends on instantaneous network congestion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
