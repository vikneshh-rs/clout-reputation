import { resolveBusinessByIdentifier } from '../src/lib/data';
import { performance } from 'perf_hooks';

async function runAudit() {
  console.log("--- Performance Audit of resolveBusinessByIdentifier ---");
  const testQr = 'cqr-S001'; // Use existing QR code from DB

  for (let i = 1; i <= 5; i++) {
    const start = performance.now();
    // Use a unique query string format each time to bypass resolveCache (5-min memory cache)
    const testCode = i === 1 ? testQr : `${testQr}?t=${i}`;
    const res = await resolveBusinessByIdentifier(testCode);
    const end = performance.now();
    console.log(`Run ${i} took: ${(end - start).toFixed(2)}ms (found: ${res ? 'Yes' : 'No'})`);
  }
}

runAudit().catch(console.error);
