import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const cleanUrl = url.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');
  const sql = neon(cleanUrl);

  console.log('Criando tabela app_vouchers se não existir...');
  await sql`
    CREATE TABLE IF NOT EXISTS app_vouchers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      qr_payload TEXT NOT NULL,
      visitor_id TEXT NOT NULL REFERENCES app_visitor_profiles(id) ON DELETE CASCADE,
      visitor_name TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      reward_title TEXT NOT NULL,
      store_id TEXT NOT NULL,
      store_name TEXT NOT NULL,
      store_floor TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
  `;
  console.log('Tabela app_vouchers pronta com sucesso!');
}

main();
