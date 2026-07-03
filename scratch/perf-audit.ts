import { resolveBusinessByIdentifier } from '../src/lib/data';
import { performance } from 'perf_hooks';

async function runAudit() {
  console.log("--- Performance Audit of resolveBusinessByIdentifier ---");
  const testQr = 'cqr-S002'; // Use existing QR code from DB

  // Warm-up query
  await resolveBusinessByIdentifier(testQr);

  // Measure 5 iterations
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await resolveBusinessByIdentifier(testQr);
    const end = performance.now();
    times.push(end - start);
    console.log(`Iteration ${i + 1}: ${(end - start).toFixed(2)}ms`);
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average execution time: ${average.toFixed(2)}ms`);
}

runAudit().catch(console.error);
