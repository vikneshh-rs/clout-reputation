import { 
  getTableByQrCode, 
  assignQrToTable, 
  reassignQrToTable, 
  replaceDamagedQr, 
  toggleQrInactive, 
  validateQrCode,
  generateQrInventory,
  getRepAssignmentsHistory,
  getQrInventoryStats
} from '../src/lib/data';

async function test() {
  console.log('🧪 Starting programmatic validation of Module 5 functions...');

  // 1. Check initial stats
  const stats1 = await getQrInventoryStats();
  console.log('📊 Initial QR stats:', stats1);

  // 2. Resolve a pre-seeded QR code
  // Pre-seeded table t-1 has code 'TBLR1GF1'
  const table1 = await getTableByQrCode('TBLR1GF1');
  if (table1 && table1.number === '1') {
    console.log('✅ Resolved pre-seeded QR TBLR1GF1 to Table 1.');
  } else {
    console.error('❌ Failed to resolve pre-seeded QR TBLR1GF1. Got:', table1);
  }

  // 3. Test deactivation block
  console.log('🔒 Toggling TBLR1GF1 to INACTIVE...');
  await toggleQrInactive('TBLR1GF1', true, 'u-rep1');
  
  const table1Inactive = await getTableByQrCode('TBLR1GF1');
  if (table1Inactive === null) {
    console.log('✅ TBLR1GF1 correctly blocked when INACTIVE.');
  } else {
    console.error('❌ TBLR1GF1 was still accessible despite being INACTIVE.');
  }

  // Reactivate it
  await toggleQrInactive('TBLR1GF1', false, 'u-rep1');
  const table1Reactive = await getTableByQrCode('TBLR1GF1');
  if (table1Reactive && table1Reactive.number === '1') {
    console.log('✅ TBLR1GF1 successfully reactivated.');
  } else {
    console.error('❌ Failed to reactivate TBLR1GF1.');
  }

  // 4. Test Assignment of a new QR code (e.g., QR-000001)
  console.log('📝 Assigning QR-000001 to Bella Italia (r1), section "Ground Floor", new Table "15"...');
  const assignResult = await assignQrToTable({
    qrCode: 'QR-000001',
    restaurantId: 'r1',
    section: 'Ground Floor',
    tableIdOrNumber: '15',
    repId: 'u-rep1'
  });

  if (assignResult.success && assignResult.table.number === '15') {
    console.log(`✅ Successfully assigned QR-000001 to new Table ${assignResult.table.number}.`);
  } else {
    console.error('❌ Failed to assign QR-000001. Result:', assignResult);
  }

  // Verify resolution
  const resolvedNewTable = await getTableByQrCode('QR-000001');
  if (resolvedNewTable && resolvedNewTable.number === '15') {
    console.log('✅ Resolved QR-000001 to Table 15.');
  } else {
    console.error('❌ Failed to resolve QR-000001. Got:', resolvedNewTable);
  }

  // 5. Test Reassignment
  console.log('🔄 Reassigning QR-000001 to Table "16" (new table)...');
  const reassignResult = await reassignQrToTable({
    qrCode: 'QR-000001',
    newTableIdOrNumber: '16',
    newSection: 'Ground Floor',
    repId: 'u-rep1'
  });

  if (reassignResult.success && reassignResult.table.number === '16') {
    console.log(`✅ Successfully reassigned QR-000001 to Table ${reassignResult.table.number}.`);
  } else {
    console.error('❌ Failed to reassign QR-000001. Result:', reassignResult);
  }

  // Verify resolution
  const resolvedReassigned = await getTableByQrCode('QR-000001');
  if (resolvedReassigned && resolvedReassigned.number === '16') {
    console.log('✅ Resolved QR-000001 to new Table 16.');
  } else {
    console.error('❌ Failed to resolve reassigned QR-000001. Got:', resolvedReassigned);
  }

  // Verify old table qrCode is updated to prevent unique constraint conflicts
  const oldTableResolved = await getTableByQrCode('REASSIGNED-OLD-QR-000001');
  // It shouldn't resolve as an active QR code
  if (oldTableResolved === null) {
    console.log('✅ Old Table mapping cleared from active routing correctly.');
  } else {
    console.error('❌ Old Table mapping is still active!');
  }

  // 6. Test Replacing damaged QR
  console.log('🩹 Replacing QR-000001 with QR-000002 due to damage...');
  const replaceResult = await replaceDamagedQr({
    oldQrCode: 'QR-000001',
    newQrCode: 'QR-000002',
    repId: 'u-rep1'
  });

  if (replaceResult.success && replaceResult.oldQr.status === 'DAMAGED' && replaceResult.newQr.status === 'ASSIGNED') {
    console.log('✅ Successfully completed replacement. Old status: DAMAGED, New status: ASSIGNED.');
  } else {
    console.error('❌ Failed to replace QR code. Result:', replaceResult);
  }

  // Verify new QR code resolves to the same table (Table 16)
  const resolvedReplacement = await getTableByQrCode('QR-000002');
  if (resolvedReplacement && resolvedReplacement.number === '16') {
    console.log('✅ Resolved replacement QR-000002 to Table 16.');
  } else {
    console.error('❌ Failed to resolve replacement QR-000002. Got:', resolvedReplacement);
  }

  // 7. Check Rep Assignment History
  const history = await getRepAssignmentsHistory('u-rep1');
  console.log(`📝 Rep Dan has ${history.length} assignment history log entries.`);
  const lastActions = history.slice(0, 5).map(h => `${h.action} on QR ${h.qrInventory?.qrCode} (Table ${h.table?.number})`);
  console.log('🔍 Last 5 log entries:', lastActions);

  // 8. Generate new batch
  console.log('⚙️ Super Admin generating 50 new stickers...');
  const genCount = await generateQrInventory(50, 'u-admin');
  console.log(`✅ Generated ${genCount} new stickers.`);

  const stats2 = await getQrInventoryStats();
  console.log('📊 Post-operations QR stats:', stats2);
}

test().catch(err => {
  console.error('❌ Test execution failed:', err);
  process.exit(1);
});
