import { resolveBusinessByIdentifier } from '../src/lib/data';
import { db } from '../src/lib/db';
import { performance } from 'perf_hooks';

async function testResolvePerf() {
  console.log("=== Testing resolveBusinessByIdentifier Warm Run Performance ===");
  
  // Warmup first
  await db.$queryRaw`SELECT 1`;
  await resolveBusinessByIdentifier('cqr-S001');

  // Measure 3 warm runs
  for (let i = 1; i <= 3; i++) {
    // Append dummy param to bypass memory cache
    const identifier = `cqr-S001?t=${Date.now()}_${i}`;
    const start = performance.now();
    const res = await resolveBusinessByIdentifier(identifier);
    const end = performance.now();
    console.log(`Warm run ${i} took: ${(end - start).toFixed(2)}ms (found: ${res ? 'Yes' : 'No'})`);
  }
}

testResolvePerf()
  .catch(console.error)
  .finally(() => db.$disconnect());
