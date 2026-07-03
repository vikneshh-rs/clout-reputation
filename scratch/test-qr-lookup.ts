import { resolveBusinessByIdentifier, validateQrCode } from '../src/lib/data';

async function runTest() {
  console.log("--- Starting QR Code Lookup Case-Insensitivity Tests ---");

  // Test standard code cqr-A001
  const testCodes = ['cqr-A001', 'cqr-a001', 'CQR-A001', 'cqr-A001 '];

  for (const code of testCodes) {
    console.log(`\nTesting resolveBusinessByIdentifier with: "${code}"`);
    const resolveResult = await resolveBusinessByIdentifier(code);
    if (resolveResult) {
      console.log(`✅ Success: Found business "${resolveResult.business?.name}" with QR code "${resolveResult.qrCode}" (Status: ${resolveResult.qrStatus})`);
    } else {
      console.log(`❌ Failed: Could not resolve business for "${code}"`);
    }

    console.log(`Testing validateQrCode with: "${code}"`);
    const validateResult = await validateQrCode(code);
    if (validateResult) {
      console.log(`✅ Success: Validated QR code "${validateResult.qrCode}" (Assigned Business ID: ${validateResult.assignedBusinessId})`);
    } else {
      console.log(`❌ Failed: Could not validate QR code "${code}"`);
    }
  }

  // Test cqr-AC001 code
  const acCodes = ['cqr-AC001', 'cqr-ac001', 'CQR-AC001'];
  console.log("\n--- Testing specific code cqr-AC001 ---");
  for (const code of acCodes) {
    const resolveResult = await resolveBusinessByIdentifier(code);
    if (resolveResult) {
      console.log(`✅ Success (AC001): Found business "${resolveResult.business?.name}" for "${code}"`);
    } else {
      console.log(`ℹ️ Info: "cqr-AC001" not resolved for "${code}" (likely does not exist in the current database environment).`);
    }
  }

  console.log("\n--- QR Code Lookup Tests Completed ---");
}

runTest().catch(console.error);
