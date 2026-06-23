import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Adding Representative user to live database...');
  try {
    const salt = await bcrypt.genSalt(10);
    const repPasswordHash = await bcrypt.hash('rep123', salt);

    // Check if the user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'rep@cloutreputation.com' }
    });

    if (existing) {
      console.log('ℹ️ User rep@cloutreputation.com already exists. Updating password...');
      await prisma.user.update({
        where: { email: 'rep@cloutreputation.com' },
        data: { passwordHash: repPasswordHash, role: 'REP', username: 'dan' }
      });
    } else {
      const rep = await prisma.user.create({
        data: {
          name: 'Field Agent Dan',
          email: 'rep@cloutreputation.com',
          username: 'dan',
          passwordHash: repPasswordHash,
          role: 'REP'
        }
      });
      console.log(`✅ Created Representative User: ${rep.email}`);
    }
  } catch (error) {
    console.error('❌ Failed to insert Representative user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
