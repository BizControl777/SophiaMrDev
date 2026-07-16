const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:%21%21elvatech777@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
process.env.DIRECT_URL   = 'postgresql://postgres.mvbhzasfxxtkelmrimwk:%21%21elvatech777@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

const prisma = new PrismaClient({ log: ['error'] });

prisma.$connect()
  .then(() => {
    console.log('✅ CONECTADO com sucesso!');
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ ERRO de conexão:', e.message);
    console.error('Código:', e.code);
    await prisma.$disconnect();
    process.exit(1);
  });
