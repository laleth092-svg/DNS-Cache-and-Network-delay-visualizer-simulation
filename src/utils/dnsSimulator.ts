import {
  DelayParameters,
  DnsPacketStep,
  DnsProtocol,
  DnsRecord,
  DnsRecordType,
  HopDelayBreakdown,
  ResolutionTrace,
} from '../types/network';
import {
  AUTHORITATIVE_DATABASE,
  DEFAULT_ROOT_SERVERS,
  DEFAULT_TLD_SERVERS,
} from '../data/defaultDnsDatabase';

export function calculateHopDelays(
  hopFrom: string,
  hopTo: string,
  params: DelayParameters,
  isTlsCryptoOverhead: boolean = false
): HopDelayBreakdown {
  const {
    packetSizeBytes,
    bandwidthMbps,
    distanceKm,
    mediumSpeedKmPerSec,
    processingDelayMs,
    queuePacketsWaiting,
    arrivalRatePacketsPerSec,
  } = params;

  // L in bits
  const packetBits = packetSizeBytes * 8;
  // R in bits per second
  const bandwidthBps = bandwidthMbps * 1_000_000;

  // Transmission delay: d_trans = L / R (converted to ms)
  const transDelayMs = (packetBits / bandwidthBps) * 1000;

  // Propagation delay: d_prop = d / s (converted to ms)
  const isLocalhost =
    (hopFrom === 'client' && (hopTo === 'browser_cache' || hopTo === 'os_cache')) ||
    ((hopFrom === 'browser_cache' || hopFrom === 'os_cache') && hopTo === 'client');

  const effectiveDistanceKm = isLocalhost ? 0.0001 : distanceKm;
  const propDelayMs = (effectiveDistanceKm / mediumSpeedKmPerSec) * 1000;

  // Processing delay: d_proc
  const effectiveProcDelayMs = isLocalhost ? 0.02 : processingDelayMs;

  // Queuing delay: d_queue = (N * L) / R
  const effectiveQueueDelayMs = isLocalhost
    ? 0
    : ((queuePacketsWaiting * packetBits) / bandwidthBps) * 1000;

  // Traffic intensity: I = (L * a) / R
  const trafficIntensity = Number(
    ((packetBits * arrivalRatePacketsPerSec) / bandwidthBps).toFixed(3)
  );
  const isCongested =
    trafficIntensity > 0.85 || queuePacketsWaiting >= params.queueBufferCapacity;

  // TLS handshake crypto delay if DoH / DoT is active
  const cryptoTlsDelayMs = isTlsCryptoOverhead ? 4.5 : 0;

  const totalHopDelayMs = Number(
    (
      transDelayMs +
      propDelayMs +
      effectiveProcDelayMs +
      effectiveQueueDelayMs +
      cryptoTlsDelayMs
    ).toFixed(3)
  );

  return {
    hopFrom,
    hopTo,
    distanceKm: effectiveDistanceKm,
    bandwidthMbps,
    packetSizeBytes,
    transDelayMs: Number(transDelayMs.toFixed(3)),
    propDelayMs: Number(propDelayMs.toFixed(3)),
    procDelayMs: Number(effectiveProcDelayMs.toFixed(3)),
    queueDelayMs: Number(effectiveQueueDelayMs.toFixed(3)),
    cryptoTlsDelayMs: isTlsCryptoOverhead ? Number(cryptoTlsDelayMs.toFixed(2)) : undefined,
    totalHopDelayMs,
    trafficIntensity,
    isCongested,
  };
}

/**
 * Generates realistic simulated RFC 1035 wire hex bytes and segment breakdowns
 */
function generateRealisticWireBytes(
  queryId: string,
  domain: string,
  recordType: DnsRecordType,
  isResponse: boolean,
  isAA: boolean,
  answerIp?: string,
  rcode: 'NOERROR' | 'NXDOMAIN' = 'NOERROR'
) {
  const cleanId = queryId.replace('0x', '').padEnd(4, '0');
  const flagsHex = !isResponse
    ? '0100' // Standard query, RD=1
    : isAA
    ? rcode === 'NXDOMAIN'
      ? '8503' // Response, AA=1, RD=1, RA=1, NXDOMAIN
      : '8500' // Response, AA=1, RD=1, RA=1, NOERROR
    : rcode === 'NXDOMAIN'
    ? '8183'
    : '8180'; // Response, AA=0, RD=1, RA=1, NOERROR

  const qdCount = '0001';
  const anCount = isResponse && answerIp && rcode === 'NOERROR' ? '0001' : '0000';
  const nsCount = isResponse && (!answerIp || rcode === 'NXDOMAIN') ? '0002' : '0000';
  const arCount = '0001';

  const headerHex = `${cleanId}${flagsHex}${qdCount}${anCount}${nsCount}${arCount}`;

  // Domain QNAME encoding: e.g. "google.com" -> 06 67 6f 6f 67 6c 65 03 63 6f 6d 00
  const parts = domain.split('.');
  let qnameHex = '';
  for (const part of parts) {
    const lenHex = part.length.toString(16).padStart(2, '0');
    let partHex = '';
    for (let i = 0; i < part.length; i++) {
      partHex += part.charCodeAt(i).toString(16).padStart(2, '0');
    }
    qnameHex += lenHex + partHex;
  }
  qnameHex += '00';

  const typeHex =
    recordType === 'A'
      ? '0001'
      : recordType === 'AAAA'
      ? '001c'
      : recordType === 'CNAME'
      ? '0005'
      : recordType === 'MX'
      ? '000f'
      : recordType === 'TXT'
      ? '0010'
      : '0001';
  const classHex = '0001'; // IN (Internet)
  const questionHex = `${qnameHex}${typeHex}${classHex}`;

  let answerHex = '';
  if (isResponse && answerIp && rcode === 'NOERROR') {
    const ptrNameHex = 'c00c'; // Compression pointer to offset 12
    const ttlHex = '0000012c'; // 300 seconds TTL
    let rdataHex = '';
    let rdLenHex = '0004';

    if (recordType === 'A') {
      const ipOctets = answerIp.split('.').map((o) => parseInt(o, 10));
      rdataHex = ipOctets.map((o) => (isNaN(o) ? '7f' : o.toString(16).padStart(2, '0'))).join('');
      rdLenHex = '0004';
    } else {
      rdataHex = '7f000001';
      rdLenHex = '0004';
    }
    answerHex = `${ptrNameHex}${typeHex}${classHex}${ttlHex}${rdLenHex}${rdataHex}`;
  }

  const rawHex = `${headerHex}${questionHex}${answerHex}`;

  return {
    rawHex,
    sections: {
      header: headerHex,
      question: questionHex,
      answer: answerHex || undefined,
    },
  };
}

export function simulateDnsQuery({
  domain,
  recordType,
  mode,
  protocol = 'UDP/53',
  browserCache,
  osCache,
  resolverCache,
  delayParams,
}: {
  domain: string;
  recordType: DnsRecordType;
  mode: 'recursive' | 'iterative';
  protocol?: DnsProtocol;
  browserCache: DnsRecord[];
  osCache: DnsRecord[];
  resolverCache: DnsRecord[];
  delayParams: DelayParameters;
}): ResolutionTrace {
  const normalizedDomain = domain.trim().toLowerCase();
  const steps: DnsPacketStep[] = [];
  const queryId = '0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');

  // Extract TLD
  const domainParts = normalizedDomain.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : 'com';

  const makeHeader = (
    qr: 'QUERY' | 'RESPONSE',
    aa: boolean,
    answersCount: number,
    authorityCount: number,
    rcode: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL' = 'NOERROR'
  ) => ({
    id: queryId,
    flags: {
      qr,
      opcode: 'STANDARD' as const,
      aa,
      tc: false,
      rd: true,
      ra: mode === 'recursive',
      rcode,
    },
    questionsCount: 1,
    answersCount,
    authorityCount,
    additionalCount: answersCount > 0 ? 1 : 0,
  });

  // 1. Check L1 Browser Cache
  const browserHit = browserCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  if (browserHit) {
    const memHopDelay = calculateHopDelays('client', 'browser_cache', {
      ...delayParams,
      packetSizeBytes: 64,
      processingDelayMs: 0.04,
    });

    steps.push({
      stepIndex: 1,
      fromNodeId: 'client',
      toNodeId: 'browser_cache',
      label: 'L1 Browser Memory Cache Lookup',
      description: `Checking process-memory host resolver cache for '${normalizedDomain}'. Zero socket creation or OS syscall overhead.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: memHopDelay,
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    const hitDelay = calculateHopDelays('browser_cache', 'client', {
      ...delayParams,
      packetSizeBytes: 64,
      processingDelayMs: 0.02,
    });

    steps.push({
      stepIndex: 2,
      fromNodeId: 'browser_cache',
      toNodeId: 'client',
      label: 'L1 Browser Cache HIT',
      description: `Instant cache HIT! Browser retrieved IPv4: ${browserHit.value} (TTL remaining: ${browserHit.ttl}s). Network stack completely bypassed.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: true,
      hitTier: 'browser',
      recordReturned: browserHit,
      hopDelays: hitDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false, browserHit.value),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      protocol,
      cacheHitAt: 'browser',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: browserHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 1B. Browser Cache Miss
  const browserMissDelay = calculateHopDelays('client', 'browser_cache', {
    ...delayParams,
    packetSizeBytes: 64,
    processingDelayMs: 0.04,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'browser_cache',
    label: 'L1 Browser Cache Miss',
    description: `Lookup for '${normalizedDomain}' missed in browser internal cache. Escalating request to Operating System stub resolver via getaddrinfo() syscall.`,
    protocol: 'UDP/53',
    isQuery: true,
    isCacheHit: false,
    hopDelays: browserMissDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
    wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
  });

  // 2. Check L2 OS Cache
  const osHit = osCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  const toOsDelay = calculateHopDelays('client', 'os_cache', {
    ...delayParams,
    packetSizeBytes: 128,
    processingDelayMs: 0.08,
  });

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'os_cache',
    label: 'Query L2 OS Stub Resolver (systemd-resolved)',
    description: `Dispatched getaddrinfo() kernel query to systemd-resolved on 127.0.0.53:53 via local UNIX loopback.`,
    protocol: 'UDP/53',
    isQuery: true,
    isCacheHit: false,
    hopDelays: toOsDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
    wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
  });

  if (osHit) {
    const osResponseDelay = calculateHopDelays('os_cache', 'client', {
      ...delayParams,
      packetSizeBytes: 128,
      processingDelayMs: 0.05,
    });

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'os_cache',
      toNodeId: 'client',
      label: 'L2 OS Stub Resolver HIT',
      description: `HIT in OS stub resolver cache! Returned ${osHit.value} (TTL remaining: ${osHit.ttl}s). Avoids dispatching network datagrams across the WAN link.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: true,
      hitTier: 'os',
      recordReturned: osHit,
      hopDelays: osResponseDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false, osHit.value),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      protocol,
      cacheHitAt: 'os',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: osHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 3. Dispatch to L3 Recursive Resolver
  const isDoH = protocol === 'DoH (HTTPS)';
  const clientToResolverDelay = calculateHopDelays(
    'client',
    'local_resolver',
    {
      ...delayParams,
      distanceKm: Math.max(15, delayParams.distanceKm * 0.1), // ISP edge is nearby
    },
    isDoH
  );

  steps.push({
    stepIndex: steps.length + 1,
    fromNodeId: 'client',
    toNodeId: 'local_resolver',
    label: isDoH ? 'Dispatch DoH Query (TLS 1.3 / HTTPS)' : 'Query Local Recursive Resolver',
    description: isDoH
      ? `OS cache missed. Initiated TLS 1.3 handshake over HTTPS (port 443) to Cloudflare/Google DoH endpoint. Incurs TLS setup delay (+4.5ms) but secures payload from ISP sniffing.`
      : `OS cache missed. Outbound UDP/53 datagram dispatched to configured resolver (8.8.8.8). Recursion Desired bit set (RD=1).`,
    protocol,
    isQuery: true,
    isCacheHit: false,
    hopDelays: clientToResolverDelay,
    dnsHeader: makeHeader('QUERY', false, 0, 0),
    wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
  });

  // Check Local Resolver Cache
  const resolverHit = resolverCache.find(
    (r) => r.domain.toLowerCase() === normalizedDomain && r.type === recordType && r.ttl > 0
  );

  if (resolverHit) {
    const resolverToClientDelay = calculateHopDelays('local_resolver', 'client', {
      ...delayParams,
      distanceKm: Math.max(15, delayParams.distanceKm * 0.1),
    });

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'local_resolver',
      toNodeId: 'client',
      label: 'L3 Local Resolver Cache HIT',
      description: `HIT in recursive resolver cache! Returned ${resolverHit.value} (TTL remaining: ${resolverHit.ttl}s). Upstream Root, TLD, and Authoritative hierarchy queries bypassed.`,
      protocol,
      isQuery: false,
      isCacheHit: true,
      hitTier: 'resolver',
      recordReturned: resolverHit,
      hopDelays: resolverToClientDelay,
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false, resolverHit.value),
    });

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      protocol,
      cacheHitAt: 'resolver',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      resolvedIp: resolverHit.value,
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // 4. Cache Miss at Local Resolver -> Traverse Hierarchy!
  const isNxdomainTest =
    normalizedDomain.includes('fake-') ||
    normalizedDomain.includes('nonexistent') ||
    normalizedDomain.includes('invalid') ||
    normalizedDomain.endsWith('.invalid');

  if (isNxdomainTest) {
    // Non-existent domain scenario
    const queryOriginNode = mode === 'recursive' ? 'local_resolver' : 'client';

    // Step to Root
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: queryOriginNode,
      toNodeId: 'root_server',
      label: 'Query Root Server (.)',
      description: `Inquiring root server 'a.root-servers.net' for TLD of '${normalizedDomain}'.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays(queryOriginNode, 'root_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    const tldInfo = DEFAULT_TLD_SERVERS[tld] || DEFAULT_TLD_SERVERS['com'];
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'root_server',
      toNodeId: queryOriginNode,
      label: `Root Referral to .${tld.toUpperCase()} TLD`,
      description: `Root points to '${tldInfo.server}' (${tldInfo.ip}).`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      referralServer: { name: tldInfo.server, ip: tldInfo.ip },
      hopDelays: calculateHopDelays('root_server', queryOriginNode, {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('RESPONSE', false, 0, 2),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false),
    });

    // Step to TLD
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: queryOriginNode,
      toNodeId: 'tld_server',
      label: `Query TLD Server (.${tld})`,
      description: `Querying TLD server for non-existent domain '${normalizedDomain}'.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays(queryOriginNode, 'tld_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.7,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // TLD returns NXDOMAIN with SOA negative cache
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'tld_server',
      toNodeId: queryOriginNode,
      label: 'TLD Responds with NXDOMAIN (RCODE=3)',
      description: `TLD confirms domain does not exist! Returns NXDOMAIN (Name Error) with SOA record (RFC 2308 negative caching TTL = 300s).`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      hopDelays: calculateHopDelays('tld_server', queryOriginNode, {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.7,
      }),
      dnsHeader: makeHeader('RESPONSE', true, 0, 1, 'NXDOMAIN'),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, true, undefined, 'NXDOMAIN'),
    });

    if (mode === 'recursive') {
      steps.push({
        stepIndex: steps.length + 1,
        fromNodeId: 'local_resolver',
        toNodeId: 'client',
        label: 'Resolver Relays NXDOMAIN to Client',
        description: `Local resolver caches negative answer and delivers NXDOMAIN status to host application. Host stops DNS resolution.`,
        protocol,
        isQuery: false,
        isCacheHit: false,
        hopDelays: calculateHopDelays('local_resolver', 'client', {
          ...delayParams,
          distanceKm: Math.max(15, delayParams.distanceKm * 0.1),
        }),
        dnsHeader: makeHeader('RESPONSE', false, 0, 1, 'NXDOMAIN'),
        wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false, undefined, 'NXDOMAIN'),
      });
    }

    return {
      domain: normalizedDomain,
      recordType,
      resolutionMode: mode,
      protocol,
      cacheHitAt: 'nxdomain',
      totalDelayMs: Number(
        steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
      ),
      steps,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // Find Authoritative Data or fallback
  const authEntry = AUTHORITATIVE_DATABASE[normalizedDomain];
  let finalRecord: DnsRecord | undefined;
  let cnameChain: string[] | undefined;

  if (authEntry) {
    finalRecord = authEntry.records.find((r) => r.type === recordType) || authEntry.records[0];
    if (finalRecord.type === 'CNAME') {
      cnameChain = [normalizedDomain, finalRecord.value];
    }
  } else {
    // Generate realistic simulated records for any custom user-entered domain
    const simulatedIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;
    finalRecord = {
      id: `gen-${Date.now()}`,
      domain: normalizedDomain,
      type: recordType,
      value:
        recordType === 'A'
          ? simulatedIp
          : recordType === 'AAAA'
          ? '2001:db8:85a3::8a2e:370:7334'
          : recordType === 'CNAME'
          ? `cdn.${normalizedDomain}`
          : recordType === 'MX'
          ? `10 mail.${normalizedDomain}`
          : 'v=spf1 ~all',
      ttl: 300,
      originalTtl: 300,
      tier: 'authoritative',
    };
  }

  // -------------------------------------------------------------
  // RECURSIVE vs ITERATIVE RESOLUTION FLOW
  // -------------------------------------------------------------
  if (mode === 'recursive') {
    // In Recursive Mode, the Local Resolver performs all the iterative queries
    const queryOriginNode = 'local_resolver';

    // Step 4A: Local Resolver -> Root Server (.)
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: queryOriginNode,
      toNodeId: 'root_server',
      label: 'Query Root Name Server (.)',
      description: `Recursive resolver queries Root server '198.41.0.4 (a.root-servers.net)' for '${normalizedDomain}'. RD=0 bit set because root servers are non-recursive.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays(queryOriginNode, 'root_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step 4B: Root Server -> Local Resolver (referral to TLD)
    const tldServerInfo = DEFAULT_TLD_SERVERS[tld] || DEFAULT_TLD_SERVERS['com'];
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'root_server',
      toNodeId: queryOriginNode,
      label: `Root Referral to .${tld.toUpperCase()} TLD`,
      description: `Root does not know '${normalizedDomain}', but delegates to TLD registry '${tldServerInfo.server}' (${tldServerInfo.ip}) with NS referral and glue A-records.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      referralServer: { name: tldServerInfo.server, ip: tldServerInfo.ip },
      hopDelays: calculateHopDelays('root_server', queryOriginNode, {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('RESPONSE', false, 0, 2),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false),
    });

    // Step 4C: Local Resolver -> TLD Server
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: queryOriginNode,
      toNodeId: 'tld_server',
      label: `Query .${tld.toUpperCase()} TLD Server`,
      description: `Querying '${tldServerInfo.server}' (${tldServerInfo.operator}) for authoritative nameservers of '${normalizedDomain}'.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays(queryOriginNode, 'tld_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.7,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step 4D: TLD Server -> Local Resolver (referral to Auth)
    const authNsName = authEntry ? authEntry.ns : `ns1.${normalizedDomain}`;
    const authNsIp = authEntry ? authEntry.nsIp : '216.239.32.10';

    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'tld_server',
      toNodeId: queryOriginNode,
      label: `TLD Referral to Authoritative NS`,
      description: `TLD server provides delegation to '${authNsName}' (${authNsIp}) with authoritative nameserver referral.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      referralServer: { name: authNsName, ip: authNsIp },
      hopDelays: calculateHopDelays('tld_server', queryOriginNode, {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.7,
      }),
      dnsHeader: makeHeader('RESPONSE', false, 0, 2),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false),
    });

    // Step 4E: Local Resolver -> Authoritative Server
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: queryOriginNode,
      toNodeId: 'auth_server',
      label: 'Query Authoritative Server',
      description: `Query sent directly to zone owner's authoritative server '${authNsName}'. Holds official zone file.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays(queryOriginNode, 'auth_server', delayParams),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step 4F: Authoritative Server -> Local Resolver
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'auth_server',
      toNodeId: queryOriginNode,
      label: 'Authoritative Answer (AA=1)',
      description: `Authoritative server answers with AA=1! Record: ${finalRecord.domain} ${finalRecord.type} ${finalRecord.value} (TTL ${finalRecord.ttl}s). DNSSEC signature verified.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      recordReturned: finalRecord,
      hopDelays: calculateHopDelays('auth_server', queryOriginNode, delayParams),
      dnsHeader: makeHeader('RESPONSE', true, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, true, finalRecord.value),
    });

    // Step 4G: Local Resolver -> Client Host
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'local_resolver',
      toNodeId: 'client',
      label: 'Resolver Delivers Answer to Client',
      description: `Recursive resolver caches the record in its local database and returns the final IP to the client host. OS stub resolver and Browser memory will now cache this entry.`,
      protocol,
      isQuery: false,
      isCacheHit: false,
      recordReturned: finalRecord,
      hopDelays: calculateHopDelays('local_resolver', 'client', {
        ...delayParams,
        distanceKm: Math.max(15, delayParams.distanceKm * 0.1),
      }),
      dnsHeader: makeHeader('RESPONSE', false, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false, finalRecord.value),
    });
  } else {
    // -----------------------------------------------------------
    // ITERATIVE RESOLUTION MODE:
    // In Iterative mode, the client itself iteratively contacts each server!
    // Client -> Root, Root -> Client
    // Client -> TLD, TLD -> Client
    // Client -> Auth, Auth -> Client
    // -----------------------------------------------------------
    const tldServerInfo = DEFAULT_TLD_SERVERS[tld] || DEFAULT_TLD_SERVERS['com'];
    const authNsName = authEntry ? authEntry.ns : `ns1.${normalizedDomain}`;
    const authNsIp = authEntry ? authEntry.nsIp : '216.239.32.10';

    // Step A: Client -> Root Server
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'client',
      toNodeId: 'root_server',
      label: 'Iterative Query: Client -> Root (.)',
      description: `Client directly queries Root Server '198.41.0.4' with Recursion Desired bit cleared (RD=0). Client will handle referrals manually.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays('client', 'root_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.9,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step B: Root Server -> Client (Referral)
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'root_server',
      toNodeId: 'client',
      label: 'Root Referral to Client',
      description: `Root sends referral back to client pointing to TLD '${tldServerInfo.server}' (${tldServerInfo.ip}). Client must query TLD next.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      referralServer: { name: tldServerInfo.server, ip: tldServerInfo.ip },
      hopDelays: calculateHopDelays('root_server', 'client', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.9,
      }),
      dnsHeader: makeHeader('RESPONSE', false, 0, 2),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false),
    });

    // Step C: Client -> TLD Server
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'client',
      toNodeId: 'tld_server',
      label: `Iterative Query: Client -> .${tld.toUpperCase()} TLD`,
      description: `Client follows referral and queries '${tldServerInfo.server}' directly.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays('client', 'tld_server', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step D: TLD Server -> Client (Referral)
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'tld_server',
      toNodeId: 'client',
      label: 'TLD Referral to Client',
      description: `TLD server provides referral to authoritative server '${authNsName}' (${authNsIp}) to the client.`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      referralServer: { name: authNsName, ip: authNsIp },
      hopDelays: calculateHopDelays('tld_server', 'client', {
        ...delayParams,
        distanceKm: delayParams.distanceKm * 0.8,
      }),
      dnsHeader: makeHeader('RESPONSE', false, 0, 2),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, false),
    });

    // Step E: Client -> Authoritative Server
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'client',
      toNodeId: 'auth_server',
      label: 'Iterative Query: Client -> Authoritative NS',
      description: `Client dispatches final UDP datagram directly to zone authoritative server '${authNsName}'.`,
      protocol: 'UDP/53',
      isQuery: true,
      isCacheHit: false,
      hopDelays: calculateHopDelays('client', 'auth_server', delayParams),
      dnsHeader: makeHeader('QUERY', false, 0, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, false, false),
    });

    // Step F: Authoritative Server -> Client (Authoritative Answer)
    steps.push({
      stepIndex: steps.length + 1,
      fromNodeId: 'auth_server',
      toNodeId: 'client',
      label: 'Authoritative Answer Directly to Client (AA=1)',
      description: `Authoritative server delivers answer directly to client host. Record: ${finalRecord.domain} ${finalRecord.type} ${finalRecord.value} (TTL ${finalRecord.ttl}s).`,
      protocol: 'UDP/53',
      isQuery: false,
      isCacheHit: false,
      recordReturned: finalRecord,
      hopDelays: calculateHopDelays('auth_server', 'client', delayParams),
      dnsHeader: makeHeader('RESPONSE', true, 1, 0),
      wireBytes: generateRealisticWireBytes(queryId, normalizedDomain, recordType, true, true, finalRecord.value),
    });
  }

  // Calculate total nodal delay across the entire trace
  const totalDelayMs = Number(
    steps.reduce((sum, s) => sum + s.hopDelays.totalHopDelayMs, 0).toFixed(2)
  );

  return {
    domain: normalizedDomain,
    recordType,
    resolutionMode: mode,
    protocol,
    cacheHitAt: 'none',
    totalDelayMs,
    resolvedIp: finalRecord.value,
    cnameChain,
    dnssecValidated: true,
    steps,
    timestamp: new Date().toLocaleTimeString(),
  };
}
