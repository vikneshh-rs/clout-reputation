import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting Username Migration...');

  // 1. Fetch all users
  const users = await prisma.user.findMany({
    include: {
      restaurant: true
    }
  });

  console.log(`👤 Found ${users.length} users in the database.`);

  for (const user of users) {
    let username = '';
    
    if (user.role === 'SUPER_ADMIN') {
      username = 'deco-admin';
    } else if (user.role === 'REP') {
      if (user.email === 'rep@cloutation.com' || user.name.toLowerCase().includes('dan')) {
        username = 'dan';
      } else {
        username = user.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    } else if (user.role === 'OWNER') {
      if (user.restaurant) {
        username = `${user.restaurant.slug}-owner`;
      } else {
        username = `owner-${user.id.substring(0, 5)}`;
      }
    } else if (user.role === 'MANAGER') {
      if (user.restaurant) {
        username = `${user.restaurant.slug}-manager`;
      } else {
        username = `manager-${user.id.substring(0, 5)}`;
      }
    }

    if (username) {
      console.log(`Updating user ${user.email || user.name} -> username: ${username}`);
      await prisma.user.update({
        where: { id: user.id },
        data: { username }
      });
    }
  }

  // 2. Seed extra reps if they don't exist
  const salt = await bcrypt.genSalt(10);
  const repPasswordHash = await bcrypt.hash('rep123', salt);

  const repsToSeed = [
    { name: 'Rahul', username: 'rahul', email: 'rahul@cloutation.com' },
    { name: 'Karthik', username: 'karthik', email: 'karthik@cloutation.com' }
  ];

  for (const rep of repsToSeed) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: rep.username },
          { email: rep.email }
        ]
      }
    });

    if (!existing) {
      console.log(`Seeding representative: ${rep.name} (${rep.username})`);
      await prisma.user.create({
        data: {
          name: rep.name,
          username: rep.username,
          email: rep.email,
          passwordHash: repPasswordHash,
          role: 'REP'
        }
      });
    } else {
      console.log(`Representative ${rep.username} already exists.`);
    }
  }

  console.log('✅ Username Migration & Representative Seeding Completed!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
