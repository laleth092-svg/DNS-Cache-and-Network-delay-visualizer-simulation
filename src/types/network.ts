export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA';

export type DnsProtocol = 'UDP/53' | 'DoH (HTTPS)' | 'DoT (TLS)';

export interface DnsRecord {
  id: string;
  domain: string;
  type: DnsRecordType;
  value: string;
  ttl: number; // Current remaining TTL in seconds
  originalTtl: number; // Initial TTL in seconds
  tier?: 'browser' | 'os' | 'resolver' | 'authoritative';
  cachedAt?: number;
  priority?: number; // For MX records
  flags?: string; // For SOA or TXT
}

export type DnsNodeType =
  | 'client'
  | 'browser_cache'
  | 'os_cache'
  | 'local_resolver'
  | 'root_server'
  | 'tld_server'
  | 'auth_server'
  | 'destination_host';

export interface DnsNode {
  id: string;
  name: string;
  label: string;
  type: DnsNodeType;
  ip: string;
  location?: string;
  software?: string;
  description?: string;
  zone?: string;
  x: number;
  y: number;
  status: 'idle' | 'querying' | 'processing' | 'responding' | 'hit' | 'miss';
}

export interface HopDelayBreakdown {
  hopFrom: string;
  hopTo: string;
  distanceKm: number;
  bandwidthMbps: number;
  packetSizeBytes: number;
  propDelayMs: number;
  transDelayMs: number;
  procDelayMs: number;
  queueDelayMs: number;
  cryptoTlsDelayMs?: number;
  totalHopDelayMs: number;
  trafficIntensity?: number;
  isCongested?: boolean;
}

export interface DnsPacketStep {
  stepIndex: number;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  description: string;
  protocol: DnsProtocol;
  isQuery: boolean;
  isCacheHit: boolean;
  hitTier?: 'browser' | 'os' | 'resolver';
  recordReturned?: DnsRecord;
  referralServer?: { name: string; ip: string };
  hopDelays: HopDelayBreakdown;
  dnsHeader: {
    id: string;
    flags: {
      qr: 'QUERY' | 'RESPONSE';
      opcode: 'STANDARD';
      aa: boolean; // Authoritative Answer
      tc: boolean; // Truncated
      rd: boolean; // Recursion Desired
      ra: boolean; // Recursion Available
      rcode: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL';
    };
    questionsCount: number;
    answersCount: number;
    authorityCount: number;
    additionalCount: number;
  };
  wireBytes?: {
    rawHex: string;
    sections: {
      header: string;
      question: string;
      answer?: string;
      authority?: string;
      additional?: string;
    };
  };
}

export interface ResolutionTrace {
  domain: string;
  recordType: DnsRecordType;
  resolutionMode: 'recursive' | 'iterative';
  protocol: DnsProtocol;
  cacheHitAt: 'browser' | 'os' | 'resolver' | 'none' | 'nxdomain';
  totalDelayMs: number;
  resolvedIp?: string;
  cnameChain?: string[];
  dnssecValidated?: boolean;
  steps: DnsPacketStep[];
  timestamp: string;
}

export interface DelayParameters {
  packetSizeBytes: number; // L in bytes (e.g. 512B for DNS, 1500B for MTU)
  bandwidthMbps: number; // R in Mbps (e.g. 100 Mbps)
  distanceKm: number; // d in km (e.g. 2500 km)
  mediumSpeedKmPerSec: number; // s in vacuum/fiber ~200,000 km/s in glass
  processingDelayMs: number; // d_proc
  queuePacketsWaiting: number; // N packets currently buffered
  queueBufferCapacity: number; // Max queue buffer depth before drop
  arrivalRatePacketsPerSec: number; // a: packet arrival rate
}
