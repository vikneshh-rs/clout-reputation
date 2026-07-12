import http from 'https';
import { performance } from 'perf_hooks';

async function testProd(urlStr: string) {
  return new Promise<{
    dns: number;
    tcp: number;
    tls: number;
    ttfb: number;
    total: number;
    headers: any;
  }>((resolve, reject) => {
    const url = new URL(urlStr);
    const timings = {
      start: performance.now(),
      dnsLookup: 0,
      tcpConnect: 0,
      tlsHandshake: 0,
      firstByte: 0,
      end: 0
    };

    const req = http.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        timings.end = performance.now();
        const dns = timings.dnsLookup - timings.start;
        const tcp = timings.tcpConnect - timings.dnsLookup;
        const tls = timings.tlsHandshake - timings.tcpConnect;
        const ttfb = timings.firstByte - timings.tlsHandshake;
        const total = timings.end - timings.start;
        resolve({
          dns,
          tcp,
          tls,
          ttfb,
          total,
          headers: res.headers
        });
      });
    });

    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        timings.dnsLookup = performance.now();
      });
      socket.on('connect', () => {
        timings.tcpConnect = performance.now();
      });
      socket.on('secureConnect', () => {
        timings.tlsHandshake = performance.now();
      });
    });

    req.on('information', () => {});
    
    req.on('response', (res) => {
      timings.firstByte = performance.now();
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log("=== MEASURING PRODUCTION URL: https://www.cloutation.com/r/cqr-S001 ===");
  
  // Run 5 requests to check cold/warm performance and headers
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Request #${i} ---`);
    try {
      const res = await testProd('https://www.cloutation.com/r/cqr-S001');
      console.log(`DNS Lookup: ${res.dns.toFixed(2)}ms`);
      console.log(`TCP Connect: ${res.tcp.toFixed(2)}ms`);
      console.log(`TLS Handshake: ${res.tls.toFixed(2)}ms`);
      console.log(`TTFB (Server processing + network transit): ${res.ttfb.toFixed(2)}ms`);
      console.log(`Total Request Time: ${res.total.toFixed(2)}ms`);
      console.log(`x-vercel-id: ${res.headers['x-vercel-id']}`);
      console.log(`x-vercel-cache: ${res.headers['x-vercel-cache']}`);
      console.log(`cache-control: ${res.headers['cache-control']}`);
    } catch (err) {
      console.error("Request failed:", err);
    }
    // Wait 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }
}

runTests();
