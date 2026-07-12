import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const assets = await db.qRAsset.findMany({
    select: {
      qrCode: true,
      status: true,
      business: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });
  console.log("All QR Assets in database:");
  console.log(JSON.stringify(assets, null, 2));
}

main().catch(console.error).finally(() => db.$disconnect());
