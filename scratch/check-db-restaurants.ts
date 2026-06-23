import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Inspecting Restaurants and Tables in Database...');
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        tables: true
      }
    });

    console.log(`📊 Found ${restaurants.length} restaurants:`);
    for (const r of restaurants) {
      console.log(`- Restaurant: ${r.name} (Slug: ${r.slug}, ID: ${r.id})`);
      console.log(`  Tables count: ${r.tables.length}`);
      for (const t of r.tables) {
        console.log(`    * Table ${t.number} in Section "${t.section || 'N/A'}" (Code: ${t.qrCode}, ID: ${t.id})`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error inspecting database entities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
