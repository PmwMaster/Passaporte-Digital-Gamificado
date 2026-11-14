import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const cleanUrl = url.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');
  const sql = neon(cleanUrl);

  const users = await sql`SELECT id, name, email, phone, role, created_at FROM app_users ORDER BY created_at ASC;`;
  console.log('=== USUÁRIOS NO BANCO NEON ===');
  console.table(users);

  const profiles = await sql`SELECT id, user_id, member_code, level, current_points, lifetime_points FROM app_visitor_profiles;`;
  console.log('=== PERFIS NO BANCO NEON ===');
  console.table(profiles);
}

main();
