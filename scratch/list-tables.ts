import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function listTables() {
  const result = await db.$queryRaw<any[]>`
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
  `;
  console.log("Tables in DB:", result.map(r => r.tablename));
}

listTables().catch(console.error);
