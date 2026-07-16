const { Client } = require('pg');

async function testConnection(urlDesc, connectionString) {
  console.log(`\nTesting connection to: ${urlDesc}`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS connecting to ${urlDesc}`);
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
  } catch (err) {
    console.error(`❌ FAILED connecting to ${urlDesc}`);
    console.error('Error message:', err.message);
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

async function runTests() {
  const urlEncoded = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:%21%21elvatech777@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const urlRaw = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:!!elvatech777@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const urlEncodedPort5432 = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:%21%21elvatech777@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';
  const urlRawPort5432 = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:!!elvatech777@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';


  await testConnection('URL Encoded (%21%21) Port 6543', urlEncoded);
  await testConnection('URL Raw (!!) Port 6543', urlRaw);
  await testConnection('URL Encoded (%21%21) Port 5432', urlEncodedPort5432);
  await testConnection('URL Raw (!!) Port 5432', urlRawPort5432);
}

runTests();
