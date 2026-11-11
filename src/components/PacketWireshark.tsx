import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  Binary,
} from 'lucide-react';
import { DnsPacketStep, ResolutionTrace } from '../types/network';

interface PacketWiresharkProps {
  trace: ResolutionTrace | null;
  selectedStepIndex: number;
  onSelectStepIndex: (idx: number) => void;
}

export const PacketWireshark: React.FC<PacketWiresharkProps> = ({
  trace,
  selectedStepIndex,
  onSelectStepIndex,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    eth: true,
    ip: true,
    transport: true,
    dnsHeader: true,
    dnsFlags: true,
    questions: true,
    answers: true,
  });

  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const toggleSection = (sec: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const currentStep: DnsPacketStep | undefined = trace?.steps[selectedStepIndex];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Generate realistic formatted Hex Dump rows
  const generateHexDumpRows = (rawHex?: string) => {
    const hex = rawHex || '1a4f0100000100000000000106676f6f676c6503636f6d0000010001';
    const rows: { offset: string; hexBytes: string[]; ascii: string }[] = [];

    // Split into 2-character byte tokens
    const bytes: string[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(hex.slice(i, i + 2));
    }

    for (let r = 0; r < bytes.length; r += 16) {
      const slice = bytes.slice(r, r + 16);
      const offset = (r).toString(16).padStart(4, '0');
      let ascii = '';
      for (const b of slice) {
        const charCode = parseInt(b, 16);
        if (charCode >= 32 && charCode <= 126) {
          ascii += String.fromCharCode(charCode);
        } else {
          ascii += '.';
        }
      }
      rows.push({
        offset,
        hexBytes: slice,
        ascii,
      });
    }
    return rows;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-5 overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>RFC 1035 DNS Protocol &amp; Wireshark Frame Dissector</span>
          </h2>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Low-level byte inspection of DNS UDP datagram headers, flag bits, RDATA, and copyable terminal commands.
          </div>
        </div>

        {trace && (
          <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            Total Captured Packets: <span className="text-sky-400 font-bold">{trace.steps.length}</span>
          </div>
        )}
      </div>

      {!trace || trace.steps.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-xs font-mono">
          No packets captured yet. Run a DNS query in the Topology view or from the top bar.
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Top Wireshark Frame List Table */}
          <div className="h-44 rounded-xl border border-slate-800 bg-slate-900/90 overflow-y-auto shrink-0 font-mono text-[11px]">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800 select-none">
                <tr>
                  <th className="py-1.5 px-3">No.</th>
                  <th className="py-1.5 px-3">Source Node</th>
                  <th className="py-1.5 px-3">Destination Node</th>
                  <th className="py-1.5 px-3">Protocol</th>
                  <th className="py-1.5 px-3">Type</th>
                  <th className="py-1.5 px-3">Length</th>
                  <th className="py-1.5 px-3">Information Summary</th>
                  <th className="py-1.5 px-3 text-right">Hop Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trace.steps.map((step, idx) => {
                  const isSelected = selectedStepIndex === idx;
                  return (
                    <tr
                      key={step.stepIndex}
                      onClick={() => onSelectStepIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200 font-semibold'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-3 tabular-nums">{step.stepIndex}</td>
                      <td className="py-1.5 px-3 text-slate-300 truncate max-w-[120px]">
                        {step.fromNodeId}
                      </td>
                      <td className="py-1.5 px-3 text-slate-300 truncate max-w-[120px]">
                        {step.toNodeId}
                      </td>
                      <td className="py-1.5 px-3 text-sky-400">{step.protocol}</td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            step.isCacheHit
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : step.isQuery
                              ? 'bg-sky-950 text-sky-400 border border-sky-800'
                              : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                          }`}
                        >
                          {step.isCacheHit ? 'CACHE HIT' : step.isQuery ? 'STANDARD QUERY' : 'RESPONSE'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 tabular-nums text-slate-400">
                        {step.hopDelays.packetSizeBytes} bytes
                      </td>
                      <td className="py-1.5 px-3 truncate max-w-[320px] text-slate-300">
                        {step.label}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-amber-300 font-bold">
                        {step.hopDelays.totalHopDelayMs} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Split: Protocol Tree (Left) & Hex Dump (Right) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
            {/* Left: Collapsible OSI Layer Tree (7 Cols) */}
            <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 overflow-y-auto font-mono text-xs space-y-2">
              {currentStep ? (
                <>
                  {/* Layer 2: Ethernet II */}
                  <div className="border border-slate-800/80 rounded-lg p-2 bg-slate-950/60">
                    <button
                      onClick={() => toggleSection('eth')}
                      className="flex items-center gap-1.5 text-slate-300 font-semibold w-full text-left"
                    >
                      {expandedSections.eth ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Ethernet II, Src: 52:54:00:12:34:56, Dst: 00:1a:2b:3c:4d:5e</span>
                    </button>
                    {expandedSections.eth && (
                      <div className="pl-5 mt-1.5 space-y-0.5 text-[11px] text-slate-400">
                        <div>Destination: 00:1a:2b:3c:4d:5e (Gateway Router)</div>
                        <div>Source: 52:54:00:12:34:56 (Client Interface)</div>
                        <div>Type: IPv4 (0x0800)</div>
                      </div>
                    )}
                  </div>

                  {/* Layer 3: Internet Protocol Version 4 */}
                  <div className="border border-slate-800/80 rounded-lg p-2 bg-slate-950/60">
                    <button
                      onClick={() => toggleSection('ip')}
                      className="flex items-center gap-1.5 text-slate-300 font-semibold w-full text-left"
                    >
                      {expandedSections.ip ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>
                        Internet Protocol Version 4, Src: {currentStep.fromNodeId}, Dst:{' '}
                        {currentStep.toNodeId}
                      </span>
                    </button>
                    {expandedSections.ip && (
                      <div className="pl-5 mt-1.5 space-y-0.5 text-[11px] text-slate-400">
                        <div>Version: 4</div>
                        <div>Header Length: 20 bytes</div>
                        <div>Time to Live (TTL): 64 hops</div>
                        <div>
                          Protocol:{' '}
                          {currentStep.protocol.includes('HTTPS') ? 'TCP (6)' : 'UDP (17)'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layer 4: Transport Layer (UDP/TCP) */}
                  <div className="border border-slate-800/80 rounded-lg p-2 bg-slate-950/60">
                    <button
                      onClick={() => toggleSection('transport')}
                      className="flex items-center gap-1.5 text-slate-300 font-semibold w-full text-left"
                    >
                      {expandedSections.transport ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>
                        {currentStep.protocol.includes('HTTPS')
                          ? 'Transmission Control Protocol (TCP), Dst Port: 443 (HTTPS/DoH)'
                          : 'User Datagram Protocol (UDP), Dst Port: 53 (DNS)'}
                      </span>
                    </button>
                    {expandedSections.transport && (
                      <div className="pl-5 mt-1.5 space-y-0.5 text-[11px] text-slate-400">
                        <div>Source Port: 53244 (Ephemeral)</div>
                        <div>
                          Destination Port:{' '}
                          {currentStep.protocol.includes('HTTPS') ? '443' : '53'}
                        </div>
                        <div>Payload Length: {currentStep.hopDelays.packetSizeBytes} bytes</div>
                      </div>
                    )}
                  </div>

                  {/* Layer 7: RFC 1035 Domain Name System */}
                  <div className="border border-sky-900/60 rounded-lg p-2.5 bg-slate-950/80">
                    <button
                      onClick={() => toggleSection('dnsHeader')}
                      className="flex items-center gap-1.5 text-sky-300 font-bold w-full text-left"
                    >
                      {expandedSections.dnsHeader ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-sky-400" />
                      )}
                      <span>Domain Name System ({currentStep.dnsHeader.flags.qr})</span>
                    </button>

                    {expandedSections.dnsHeader && (
                      <div className="pl-5 mt-2 space-y-2 text-[11px]">
                        <div className="text-slate-300">
                          Transaction ID:{' '}
                          <span className="text-sky-400 font-bold">
                            {currentStep.dnsHeader.id}
                          </span>
                        </div>

                        {/* Flags Breakdown Sub-tree */}
                        <div className="border-l-2 border-slate-800 pl-3 space-y-1">
                          <button
                            onClick={() => toggleSection('dnsFlags')}
                            className="flex items-center gap-1 text-slate-300 font-semibold"
                          >
                            {expandedSections.dnsFlags ? (
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-500" />
                            )}
                            <span>Flags:</span>
                          </button>
                          {expandedSections.dnsFlags && (
                            <div className="pl-4 space-y-0.5 text-slate-400">
                              <div>
                                {currentStep.dnsHeader.flags.qr === 'QUERY' ? '0...' : '1...'}{' '}
                                QR = {currentStep.dnsHeader.flags.qr} (
                                {currentStep.dnsHeader.flags.qr === 'QUERY'
                                  ? 'Message is a query'
                                  : 'Message is a response'}
                                )
                              </div>
                              <div>
                                .000 0... Opcode = STANDARD (Standard query 0)
                              </div>
                              <div>
                                .... {currentStep.dnsHeader.flags.aa ? '1...' : '0...'} AA ={' '}
                                {currentStep.dnsHeader.flags.aa ? '1 (Authoritative)' : '0 (Non-authoritative)'}
                              </div>
                              <div>
                                .... .0.. TC = 0 (Message is not truncated)
                              </div>
                              <div>
                                .... ..1. RD = 1 (Recursion desired)
                              </div>
                              <div>
                                .... ...{currentStep.dnsHeader.flags.ra ? '1' : '0'} RA ={' '}
                                {currentStep.dnsHeader.flags.ra ? '1 (Recursion available)' : '0 (Recursion not available)'}
                              </div>
                              <div>
                                Reply Code (RCODE) ={' '}
                                <span
                                  className={
                                    currentStep.dnsHeader.flags.rcode === 'NXDOMAIN'
                                      ? 'text-rose-400 font-bold'
                                      : 'text-emerald-400'
                                  }
                                >
                                  {currentStep.dnsHeader.flags.rcode}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section Counts */}
                        <div className="grid grid-cols-2 gap-2 text-slate-400 border-t border-slate-800 pt-1.5">
                          <div>Questions: {currentStep.dnsHeader.questionsCount}</div>
                          <div>Answer RRs: {currentStep.dnsHeader.answersCount}</div>
                          <div>Authority RRs: {currentStep.dnsHeader.authorityCount}</div>
                          <div>Additional RRs: {currentStep.dnsHeader.additionalCount}</div>
                        </div>

                        {/* Questions Section */}
                        {currentStep.dnsHeader.questionsCount > 0 && (
                          <div className="border-t border-slate-800 pt-1.5">
                            <span className="text-slate-300 font-semibold">Queries:</span>
                            <div className="pl-3 text-slate-400 mt-0.5">
                              {trace.domain}: type {trace.recordType}, class IN
                            </div>
                          </div>
                        )}

                        {/* Answers Section */}
                        {currentStep.recordReturned && (
                          <div className="border-t border-slate-800 pt-1.5">
                            <span className="text-emerald-400 font-semibold">Answers:</span>
                            <div className="pl-3 text-emerald-300 mt-0.5">
                              {currentStep.recordReturned.domain}: type{' '}
                              {currentStep.recordReturned.type}, class IN, TTL{' '}
                              {currentStep.recordReturned.ttl}s, addr{' '}
                              {currentStep.recordReturned.value}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Right: Realistic Hex Dump & CLI Generator (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
              {/* Hex Dump Panel */}
              <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col min-h-0 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-xs">
                  <span className="flex items-center gap-1.5">
                    <Binary className="w-3.5 h-3.5 text-sky-400" />
                    <span>Packet Hex &amp; ASCII Wire Format</span>
                  </span>
                  <span className="text-[10px] text-slate-500">RFC 1035 UDP Payload</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-slate-300 select-text">
                  {generateHexDumpRows(currentStep?.wireBytes?.rawHex).map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-bold">{row.offset}</span>
                      <div className="flex items-center gap-1.5 text-sky-300 font-medium">
                        {row.hexBytes.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className={bIdx === 7 ? 'mr-1.5' : ''}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                      <span className="text-slate-400 border-l border-slate-800 pl-2">
                        {row.ascii}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminal CLI Command Generator */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 shrink-0 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reproduce via Terminal (CLI)</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {/* dig command */}
                  <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                    <span className="truncate text-slate-300">
                      dig @8.8.8.8 {trace.domain} {trace.recordType} +trace
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `dig @8.8.8.8 ${trace.domain} ${trace.recordType} +trace`,
                          'dig'
                        )
                      }
                      className="ml-2 text-slate-400 hover:text-slate-200"
                    >
                      {copiedCmd === 'dig' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* nslookup command */}
                  <div className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                    <span className="truncate text-slate-300">
                      nslookup -type={trace.recordType} {trace.domain} 8.8.8.8
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `nslookup -type=${trace.recordType} ${trace.domain} 8.8.8.8`,
                          'nslookup'
                        )
                      }
                      className="ml-2 text-slate-400 hover:text-slate-200"
                    >
                      {copiedCmd === 'nslookup' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
