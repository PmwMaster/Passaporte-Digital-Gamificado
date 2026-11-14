import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const cleanUrl = url.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');
  const sql = neon(cleanUrl);

  const fks = await sql`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
  `;
  console.log('=== CHAVES ESTRANGEIRAS EXISTENTES ===');
  console.table(fks);
}

main();
