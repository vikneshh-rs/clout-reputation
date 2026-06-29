import { PrismaClient, UserRole } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🔍 Debugging representatives database queries...');
  try {
    console.log('1. Fetching reps...');
    const reps = await db.user.findMany({
      where: { role: UserRole.REP },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`- Found ${reps.length} representatives.`);

    const repIds = reps.map(r => r.id);

    console.log('2. Grouping businesses by rep...');
    const businessCounts = await db.business.groupBy({
      by: ['createdByRepId'],
      where: { createdByRepId: { in: repIds } },
      _count: { id: true }
    });
    console.log('- Business grouping succeeded.');

    console.log('3. Grouping assignment logs by rep...');
    const assignmentCounts = await db.assignmentLog.groupBy({
      by: ['assignedBy'],
      where: { assignedBy: { in: repIds } },
      _count: { id: true }
    });
    console.log('- Assignment grouping succeeded.');

    console.log('4. Fetching last activity logs...');
    const lastLogs = await Promise.all(
      reps.map(rep => db.activityLog.findFirst({
        where: { userId: rep.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }))
    );
    console.log('- Activity log query succeeded.');

    console.log('🎉 All queries succeeded successfully!');
  } catch (error) {
    console.error('❌ Query failed with error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
