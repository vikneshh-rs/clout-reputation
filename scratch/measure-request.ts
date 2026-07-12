import { performance } from 'perf_hooks';

async function main() {
  const start = performance.now();
  const res = await fetch('http://localhost:3000/r/cqr-S001', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const end = performance.now();
  console.log(`Status: ${res.status}`);
  console.log(`Time taken: ${(end - start).toFixed(2)}ms`);
}

main().catch(console.error);
