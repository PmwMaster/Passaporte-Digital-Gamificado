import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const cleanUrl = url.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');
  const sql = neon(cleanUrl);

  console.log('Testing queries for visitor vis_1794667127638...');
  
  // 1. Get profile
  const profile = await sql`
    SELECT * FROM app_visitor_profiles 
    WHERE user_id = 'usr_1794667127638' OR id = 'vis_1794667127638';
  `;
  console.log('Profile:', profile[0]);

  // 2. Get transactions
  const txs = await sql`
    SELECT * FROM app_point_transactions 
    WHERE visitor_id = ${profile[0].id}
    ORDER BY created_at DESC;
  `;
  console.log('Transactions count:', txs.length);
  console.log('Sample tx:', txs[0]);

  // 3. Test vouchers table
  const vouchers = await sql`
    SELECT * FROM app_vouchers 
    WHERE visitor_id = ${profile[0].id};
  `;
  console.log('Vouchers count:', vouchers.length);
}

main();
