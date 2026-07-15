import './env';
import { Client } from 'pg';

async function diagnose() {
  console.log('--- DB DIAGNOSIS START ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('DIRECT_URL:', process.env.DIRECT_URL);

  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connection with DIRECT_URL succeeded!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error('Connection with DIRECT_URL failed:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Full Error:', err);
  }

  const clientPooler = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await clientPooler.connect();
    console.log('Connection with DATABASE_URL (pooler) succeeded!');
    const res = await clientPooler.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await clientPooler.end();
  } catch (err: any) {
    console.error('Connection with DATABASE_URL (pooler) failed:');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('Full Error:', err);
  }
}

diagnose();
