import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Database connection and fetching users...');
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true
      }
    });
    console.log(`📊 Found ${users.length} users in the database:`);
    for (const u of users) {
      console.log(`- Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`);
    }
  } catch (error) {
    console.warn('❌ Database connection failed. You might be running in Mock Demo Mode.', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
