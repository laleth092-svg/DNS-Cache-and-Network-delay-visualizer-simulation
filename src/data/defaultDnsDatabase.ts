import { DnsNode, DnsRecord, DnsRecordType } from '../types/network';

export const DEFAULT_ROOT_SERVERS: DnsRecord[] = [
  { id: 'root-a', domain: '.', type: 'A', value: '198.41.0.4 (a.root-servers.net)', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
  { id: 'root-b', domain: '.', type: 'A', value: '199.9.14.201 (b.root-servers.net)', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
  { id: 'root-j', domain: '.', type: 'A', value: '192.58.128.30 (j.root-servers.net)', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
];

export const DEFAULT_TLD_SERVERS: Record<string, { server: string; ip: string; operator: string }> = {
  com: { server: 'a.gtld-servers.net', ip: '192.5.6.30', operator: 'Verisign Global Registry Services' },
  org: { server: 'a0.org.afilias-nst.info', ip: '199.19.56.1', operator: 'Public Interest Registry (PIR)' },
  edu: { server: 'a.edu-servers.net', ip: '192.33.14.30', operator: 'Educause Registry' },
  net: { server: 'a.gtld-servers.net', ip: '192.5.6.30', operator: 'Verisign Global Registry Services' },
  io: { server: 'a0.nic.io', ip: '193.0.14.129', operator: 'Internet Computer Bureau / Identity Digital' },
  gov: { server: 'a.gov-servers.net', ip: '192.5.6.31', operator: 'CISA Cybersecurity and Infrastructure Security Agency' },
  dev: { server: 'ns1.google.com', ip: '216.239.32.10', operator: 'Google Registry' },
};

export interface AuthoritativeZone {
  ns: string;
  nsIp: string;
  soa: string;
  records: DnsRecord[];
}

export const AUTHORITATIVE_DATABASE: Record<string, AuthoritativeZone> = {
  'google.com': {
    ns: 'ns1.google.com',
    nsIp: '216.239.32.10',
    soa: 'ns1.google.com. dns-admin.google.com. 2026111101 7200 3600 1209600 300',
    records: [
      { id: 'g-1', domain: 'google.com', type: 'A', value: '142.250.190.46', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'g-2', domain: 'google.com', type: 'AAAA', value: '2607:f8b0:4005:805::200e', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'g-3', domain: 'google.com', type: 'MX', value: '10 smtp.google.com', ttl: 3600, originalTtl: 3600, priority: 10, tier: 'authoritative' },
      { id: 'g-4', domain: 'google.com', type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600, originalTtl: 3600, tier: 'authoritative' },
      { id: 'g-5', domain: 'google.com', type: 'NS', value: 'ns1.google.com', ttl: 86400, originalTtl: 86400, tier: 'authoritative' },
    ],
  },
  'mit.edu': {
    ns: 'straw.mit.edu',
    nsIp: '18.71.0.151',
    soa: 'straw.mit.edu. hostmaster.mit.edu. 2026102801 10800 3600 2419200 1800',
    records: [
      { id: 'mit-1', domain: 'mit.edu', type: 'A', value: '104.18.23.101', ttl: 1800, originalTtl: 1800, tier: 'authoritative' },
      { id: 'mit-2', domain: 'mit.edu', type: 'MX', value: '10 enterprise.mit.edu', ttl: 3600, originalTtl: 3600, priority: 10, tier: 'authoritative' },
      { id: 'mit-3', domain: 'mit.edu', type: 'TXT', value: 'v=spf1 redirect=_spf.mit.edu', ttl: 1800, originalTtl: 1800, tier: 'authoritative' },
    ],
  },
  'wikipedia.org': {
    ns: 'ns0.wikimedia.org',
    nsIp: '208.80.154.238',
    soa: 'ns0.wikimedia.org. hostmaster.wikimedia.org. 2026110901 43200 7200 1209600 600',
    records: [
      { id: 'wiki-1', domain: 'wikipedia.org', type: 'A', value: '208.80.154.224', ttl: 600, originalTtl: 600, tier: 'authoritative' },
      { id: 'wiki-2', domain: 'wikipedia.org', type: 'AAAA', value: '2620:0:861:ed1a::1', ttl: 600, originalTtl: 600, tier: 'authoritative' },
      { id: 'wiki-3', domain: 'wikipedia.org', type: 'TXT', value: 'v=spf1 include:wikimedia.org ~all', ttl: 3600, originalTtl: 3600, tier: 'authoritative' },
    ],
  },
  'github.com': {
    ns: 'dns1.p08.nsone.net',
    nsIp: '198.51.44.8',
    soa: 'dns1.p08.nsone.net. hostmaster.github.com. 2026110501 3600 600 1209600 60',
    records: [
      { id: 'gh-1', domain: 'github.com', type: 'A', value: '140.82.121.3', ttl: 60, originalTtl: 60, tier: 'authoritative' },
      { id: 'gh-2', domain: 'github.com', type: 'AAAA', value: '2606:50c0:8000::153', ttl: 60, originalTtl: 60, tier: 'authoritative' },
      { id: 'gh-3', domain: 'github.com', type: 'MX', value: '10 aspmx.l.google.com', ttl: 3600, originalTtl: 3600, priority: 10, tier: 'authoritative' },
    ],
  },
  'www.github.com': {
    ns: 'dns1.p08.nsone.net',
    nsIp: '198.51.44.8',
    soa: 'dns1.p08.nsone.net. hostmaster.github.com. 2026110501 3600 600 1209600 60',
    records: [
      { id: 'wgh-1', domain: 'www.github.com', type: 'CNAME', value: 'github.com', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'wgh-2', domain: 'www.github.com', type: 'A', value: '140.82.121.3', ttl: 60, originalTtl: 60, tier: 'authoritative' },
    ],
  },
  'netflix.com': {
    ns: 'ns-1218.awsdns-24.org',
    nsIp: '205.251.196.194',
    soa: 'ns-1218.awsdns-24.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 60',
    records: [
      { id: 'nflx-1', domain: 'netflix.com', type: 'A', value: '54.148.37.106', ttl: 60, originalTtl: 60, tier: 'authoritative' },
      { id: 'nflx-2', domain: 'netflix.com', type: 'AAAA', value: '2a05:d07a:a000:701::1', ttl: 60, originalTtl: 60, tier: 'authoritative' },
    ],
  },
  'cloudflare.com': {
    ns: 'ns3.cloudflare.com',
    nsIp: '162.159.0.33',
    soa: 'ns3.cloudflare.com. dns.cloudflare.com. 2026111001 10000 2400 604800 300',
    records: [
      { id: 'cf-1', domain: 'cloudflare.com', type: 'A', value: '104.16.132.229', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'cf-2', domain: 'cloudflare.com', type: 'AAAA', value: '2606:4700::6810:84e5', ttl: 300, originalTtl: 300, tier: 'authoritative' },
      { id: 'cf-3', domain: 'cloudflare.com', type: 'TXT', value: 'v=spf1 include:_spf.mx.cloudflare.net ~all', ttl: 300, originalTtl: 300, tier: 'authoritative' },
    ],
  },
  'shop.example.com': {
    ns: 'ns1.shopdns.com',
    nsIp: '198.51.100.99',
    soa: 'ns1.shopdns.com. admin.shopdns.com. 2026110101 3600 600 604800 60',
    records: [
      { id: 'shop-1', domain: 'shop.example.com', type: 'CNAME', value: 'cdn.global.fastly.net', ttl: 120, originalTtl: 120, tier: 'authoritative' },
    ],
  },
  'cdn.global.fastly.net': {
    ns: 'ns1.fastly.net',
    nsIp: '151.101.1.57',
    soa: 'ns1.fastly.net. hostmaster.fastly.net. 2026110101 3600 600 604800 60',
    records: [
      { id: 'fastly-1', domain: 'cdn.global.fastly.net', type: 'A', value: '151.101.65.140', ttl: 60, originalTtl: 60, tier: 'authoritative' },
    ],
  },
};

export const INITIAL_BROWSER_CACHE: DnsRecord[] = [
  { id: 'b-cache-1', domain: 'netflix.com', type: 'A', value: '54.148.37.106', ttl: 48, originalTtl: 60, tier: 'browser', cachedAt: Date.now() - 12000 },
];

export const INITIAL_OS_CACHE: DnsRecord[] = [
  { id: 'os-cache-1', domain: 'mit.edu', type: 'A', value: '104.18.23.101', ttl: 1140, originalTtl: 1800, tier: 'os', cachedAt: Date.now() - 660000 },
  { id: 'os-cache-2', domain: 'cloudflare.com', type: 'A', value: '104.16.132.229', ttl: 180, originalTtl: 300, tier: 'os', cachedAt: Date.now() - 120000 },
];

export const INITIAL_RESOLVER_CACHE: DnsRecord[] = [
  { id: 'res-cache-1', domain: 'wikipedia.org', type: 'A', value: '208.80.154.224', ttl: 420, originalTtl: 600, tier: 'resolver', cachedAt: Date.now() - 180000 },
];

export const TOPOLOGY_NODES: DnsNode[] = [
  {
    id: 'client',
    name: 'Client Host / App',
    label: 'Browser Application',
    type: 'client',
    ip: '192.168.1.105',
    location: 'User Workstation (Local)',
    software: 'Chrome 131 / Node.js Runtime',
    description: 'Originates DNS requests when an application makes a fetch(), XMLHttpRequest, or browser URL navigation.',
    x: 80,
    y: 240,
    status: 'idle',
  },
  {
    id: 'browser_cache',
    name: 'L1 Browser DNS Cache',
    label: 'In-Memory Host Table',
    type: 'browser_cache',
    ip: '127.0.0.1 (Process Memory)',
    location: 'RAM (V8 Heap)',
    software: 'Chrome Internal DNS Cache',
    description: 'First checkpoint. Holds mapped hostnames in memory for ~60s. Resolves with sub-millisecond zero-network latency.',
    x: 240,
    y: 120,
    status: 'idle',
  },
  {
    id: 'os_cache',
    name: 'L2 OS Stub Resolver',
    label: 'systemd-resolved / getaddrinfo',
    type: 'os_cache',
    ip: '127.0.0.53:53',
    location: 'Kernel IPC / Stub Resolver',
    software: 'systemd-resolved (Linux) / DnsCache (Windows)',
    description: 'Kernel-level DNS cache populated via getaddrinfo() syscalls. Inspects /etc/hosts before querying network.',
    x: 240,
    y: 360,
    status: 'idle',
  },
  {
    id: 'local_resolver',
    name: 'L3 Recursive Resolver',
    label: 'ISP / Anycast (8.8.8.8)',
    type: 'local_resolver',
    ip: '8.8.8.8 / 1.1.1.1',
    location: 'ISP Edge / Anycast Point of Presence (PoP)',
    software: 'BIND 9.18 / Unbound / PowerDNS',
    description: 'Handles full iterative resolution on behalf of clients. Caches records according to authoritative TTLs.',
    x: 480,
    y: 240,
    status: 'idle',
  },
  {
    id: 'root_server',
    name: 'Root Name Server',
    label: 'a.root-servers.net (.)',
    type: 'root_server',
    ip: '198.41.0.4',
    zone: '.',
    location: 'Global Anycast Cluster (ICANN/Verisign)',
    software: 'NSD / BIND9 Anycast',
    description: 'Directs resolvers to appropriate TLD servers (e.g. .com, .org, .edu) based on top-level domain.',
    x: 740,
    y: 90,
    status: 'idle',
  },
  {
    id: 'tld_server',
    name: 'TLD Name Server',
    label: 'a.gtld-servers.net (.com)',
    type: 'tld_server',
    ip: '192.5.6.30',
    zone: '.com / .org / .edu / .io',
    location: 'Verisign TLD Datacenter (Dulles, VA)',
    software: 'Verisign ATLAS / UltraDNS',
    description: 'Manages second-level domain delegations and supplies NS and glue A-records for domain authoritative servers.',
    x: 740,
    y: 240,
    status: 'idle',
  },
  {
    id: 'auth_server',
    name: 'Authoritative Server',
    label: 'ns1.google.com / ns1.domain',
    type: 'auth_server',
    ip: '216.239.32.10',
    zone: 'Specific Domain Zone File',
    location: 'Zone Owner Infrastructure (Cloud DNS)',
    software: 'Google Cloud DNS / AWS Route53 / Cloudflare',
    description: 'Holds definitive, authentic DNS records (A, AAAA, MX, CNAME, TXT) signed with authoritative flag AA=1.',
    x: 740,
    y: 390,
    status: 'idle',
  },
  {
    id: 'destination_host',
    name: 'Origin Web Server',
    label: 'Target HTTP/HTTPS Endpoint',
    type: 'destination_host',
    ip: '142.250.190.46',
    location: 'Web Server / Content Delivery Network (CDN)',
    software: 'Nginx / Envoy / Cloudflare Edge',
    description: 'The final destination server where HTTP GET / TLS handshake connects once DNS yields the destination IP.',
    x: 950,
    y: 240,
    status: 'idle',
  },
];

export interface ScenarioDefinition {
  id: string;
  title: string;
  badge: string;
  description: string;
  targetDomain: string;
  recordType: DnsRecordType;
  resolutionMode: 'recursive' | 'iterative';
  protocol: 'UDP/53' | 'DoH (HTTPS)';
  setupAction: 'flush_all' | 'warm_browser' | 'warm_os' | 'warm_resolver' | 'cname_demo' | 'nxdomain' | 'satellite' | 'doh_mode';
  educationalFocus: string;
  takeaways: string[];
}

export const NETWORK_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'cold_lookup',
    title: 'Cold DNS Hierarchy Traversal',
    badge: '4-Hop Full Walk',
    description: 'Simulates a completely cold domain query where neither browser, OS, nor recursive resolver has cached the record. All 4 hops (Client -> Resolver -> Root -> TLD -> Auth) must be traversed.',
    targetDomain: 'google.com',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'flush_all',
    educationalFocus: 'Recursive resolution flow: Resolver acts as client agent, querying Root (.) for .com TLD referral, TLD for ns1.google.com referral, and Authoritative for the final IP answer.',
    takeaways: [
      'Incurs highest cumulative latency due to 4 sequential round-trip network hops.',
      'Result is saved in local resolver cache with authoritative TTL (300s).',
      'OS and browser caches are warmed to accelerate subsequent lookups.',
    ],
  },
  {
    id: 'browser_hit',
    title: 'L1 Browser Memory Cache Hit',
    badge: 'Sub-millisecond (~0.1ms)',
    description: 'Querying netflix.com which is already hot in the browser DNS cache. Zero network packets are dispatched outside process memory.',
    targetDomain: 'netflix.com',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'warm_browser',
    educationalFocus: 'L1 in-memory caching avoids OS kernel transitions (getaddrinfo syscalls) and physical link transmission delay completely.',
    takeaways: [
      'Total resolution latency is dominated solely by internal process memory lookup (~0.05ms).',
      'Drastically reduces page load time and battery consumption on mobile devices.',
    ],
  },
  {
    id: 'os_hit',
    title: 'L2 Operating System Stub Resolver Hit',
    badge: 'Kernel Cache (~1ms)',
    description: 'Querying mit.edu which resides in the host OS stub resolver cache. Resolves locally without ISP or WAN link traversal.',
    targetDomain: 'mit.edu',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'warm_os',
    educationalFocus: 'Demonstrates OS stub resolver behavior (systemd-resolved / Windows DNS Client). Overheads consist only of local UNIX socket IPC.',
    takeaways: [
      'OS cache services all local applications (curl, browser, python, mail client).',
      'Avoids traversing home WiFi router or ISP uplink.',
    ],
  },
  {
    id: 'resolver_hit',
    title: 'L3 Local Recursive Resolver Cache Hit',
    badge: 'ISP Edge Hit (~10-25ms)',
    description: 'Querying wikipedia.org where the recursive resolver has a valid cached entry. Traversal of Root and TLD servers is bypassed.',
    targetDomain: 'wikipedia.org',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'warm_resolver',
    educationalFocus: 'Local resolver caching saves global internet bandwidth and shields authoritative servers from being overwhelmed.',
    takeaways: [
      'One user querying Wikipedia warms the cache for all other ISP subscribers.',
      'Saves ~100-200ms of global WAN latency.',
    ],
  },
  {
    id: 'cname_alias',
    title: 'CNAME Canonical Name Chaining',
    badge: 'Alias Resolution Chain',
    description: 'Querying shop.example.com which delegates to cdn.global.fastly.net via a CNAME record, requiring an iterative sub-lookup.',
    targetDomain: 'shop.example.com',
    recordType: 'CNAME',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'cname_demo',
    educationalFocus: 'Shows how CNAME records map an alias to a canonical name, prompting the resolver to restart resolution for the canonical hostname.',
    takeaways: [
      'CNAMEs add extra resolution cycles unless cached alongside the alias.',
      'Widely used in modern CDNs (Cloudflare, Fastly, CloudFront) for traffic steering.',
    ],
  },
  {
    id: 'nxdomain_negative',
    title: 'Negative Caching (NXDOMAIN)',
    badge: 'RFC 2308 SOA Record',
    description: 'Querying a non-existent domain (fake-portal-xyz.com). The authoritative server returns RCODE=NXDOMAIN with an SOA record for negative caching.',
    targetDomain: 'fake-portal-xyz.com',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'nxdomain',
    educationalFocus: 'Negative caching prevents clients from continually hammering root and TLD servers with invalid hostnames.',
    takeaways: [
      'SOA record specifies negative TTL (MINIMUM field in SOA).',
      'Subsequent queries fail instantly at local resolver rather than hitting the network.',
    ],
  },
  {
    id: 'doh_handshake',
    title: 'DNS-over-HTTPS (DoH) vs Plain UDP',
    badge: 'TLS 1.3 Encryption Overhead',
    description: 'Simulates DNS resolution over encrypted HTTPS (DoH / RFC 8484) showing TCP 3-way handshake + TLS 1.3 negotiation latency versus unencrypted UDP/53.',
    targetDomain: 'google.com',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'DoH (HTTPS)',
    setupAction: 'doh_mode',
    educationalFocus: 'Quantifies the security vs latency trade-off: DoH prevents ISP eavesdropping and DNS spoofing at the expense of initial TLS handshake overhead.',
    takeaways: [
      'TCP SYN/ACK and TLS ClientHello add 1 to 2 RTTs of extra setup delay on cold connections.',
      'Subsequent queries reuse persistent HTTP/2 or HTTP/3 sessions (0-RTT).',
    ],
  },
  {
    id: 'satellite_link',
    title: 'Satellite Link: GEO vs LEO Delay',
    badge: 'High Propagation Delay (d/s)',
    description: 'Demonstrates extreme propagation delay on high-altitude links: 36,000km Geostationary (GEO) orbit vs 550km Low Earth Orbit (LEO) vs Terrestrial Fiber.',
    targetDomain: 'wikipedia.org',
    recordType: 'A',
    resolutionMode: 'recursive',
    protocol: 'UDP/53',
    setupAction: 'satellite',
    educationalFocus: 'Highlights that propagation delay d_prop = d / s cannot be engineered away by increasing bandwidth; physical distance and speed of light govern latency.',
    takeaways: [
      'GEO satellite round-trip adds ~480ms solely from speed-of-light travel.',
      'LEO constellations (Starlink) reduce propagation to ~7ms by orbiting at ~550km.',
    ],
  },
];
