import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Inspecting QRInventory records...');
  try {
    const records = await prisma.qRInventory.findMany({
      include: {
        table: true,
        restaurant: true
      }
    });

    console.log(`📊 Found ${records.length} records in inventory:`);
    let missingLogsCount = 0;
    
    // Find a user to attribute logs to (preferably our SUPER_ADMIN or a REP)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    const assignedBy = adminUser ? adminUser.id : 'system-migration';

    for (const r of records) {
      console.log(`- Code: ${r.qrCode}, Status: ${r.status}, Table: ${r.table?.number || 'N/A'}, Restaurant: ${r.restaurant?.name || 'N/A'}`);
      
      if (r.status === 'ASSIGNED' && r.assignedRestaurantId && r.assignedTableId) {
        // Check if an AssignmentLog exists for this table and QR
        const log = await prisma.assignmentLog.findFirst({
          where: {
            qrInventoryId: r.id,
            tableId: r.assignedTableId,
            action: 'ASSIGNED'
          }
        });

        if (!log) {
          console.log(`  ⚠️ Missing assignment log for code "${r.qrCode}". Creating one...`);
          await prisma.assignmentLog.create({
            data: {
              qrInventoryId: r.id,
              restaurantId: r.assignedRestaurantId,
              tableId: r.assignedTableId,
              assignedBy: assignedBy,
              action: 'ASSIGNED',
              createdAt: r.assignedAt || new Date()
            }
          });
          missingLogsCount++;
        }
      }
    }
    console.log(`✅ Fixed ${missingLogsCount} missing assignment logs!`);
  } catch (error: any) {
    console.error('❌ Error inspecting inventory status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
