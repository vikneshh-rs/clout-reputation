import { resolveBusinessByIdentifier } from '../src/lib/data';
import { performance } from 'perf_hooks';

async function runAudit() {
  console.log("--- Performance Audit of resolveBusinessByIdentifier ---");
  const testQr = 'cqr-S001'; // Use existing QR code from DB

  // Measure first query (cold start)
  const startCold = performance.now();
  const resCold = await resolveBusinessByIdentifier(testQr);
  const endCold = performance.now();
  console.log(`Cold start (uncached) took: ${(endCold - startCold).toFixed(2)}ms`);

  // Let's inspect the resolved details
  console.log('Result found:', resCold ? 'Yes' : 'No');
  console.log('Result details:', JSON.stringify(resCold, null, 2));
}

runAudit().catch(console.error);
