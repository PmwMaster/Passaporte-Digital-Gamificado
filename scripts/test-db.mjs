import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const cleanUrl = url.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');
  const sql = neon(cleanUrl);

  const tables = [
    'app_users',
    'app_visitor_profiles',
    'app_point_transactions',
    'app_check_ins',
    'app_missions',
    'app_mission_progress',
    'app_stamps',
    'app_otp_verifications'
  ];

  console.log('=== VERIFICAÇÃO DAS TABELAS NO NEON ===');
  for (const t of tables) {
    try {
      const res = await sql`SELECT count(*)::int as total FROM app_users WHERE ${t} = ${t}`; // placeholder
      // let's do a direct query for each:
      let count = 0;
      let sample = null;
      if (t === 'app_users') {
        const c = await sql`SELECT count(*)::int as total FROM app_users;`;
        count = c[0].total;
        const s = await sql`SELECT id, name, email, phone, role, is_phone_verified FROM app_users LIMIT 2;`;
        sample = s;
      } else if (t === 'app_visitor_profiles') {
        const c = await sql`SELECT count(*)::int as total FROM app_visitor_profiles;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_visitor_profiles LIMIT 2;`;
        sample = s;
      } else if (t === 'app_point_transactions') {
        const c = await sql`SELECT count(*)::int as total FROM app_point_transactions;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_point_transactions LIMIT 2;`;
        sample = s;
      } else if (t === 'app_check_ins') {
        const c = await sql`SELECT count(*)::int as total FROM app_check_ins;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_check_ins LIMIT 2;`;
        sample = s;
      } else if (t === 'app_missions') {
        const c = await sql`SELECT count(*)::int as total FROM app_missions;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_missions LIMIT 2;`;
        sample = s;
      } else if (t === 'app_mission_progress') {
        const c = await sql`SELECT count(*)::int as total FROM app_mission_progress;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_mission_progress LIMIT 2;`;
        sample = s;
      } else if (t === 'app_stamps') {
        const c = await sql`SELECT count(*)::int as total FROM app_stamps;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_stamps LIMIT 2;`;
        sample = s;
      } else if (t === 'app_otp_verifications') {
        const c = await sql`SELECT count(*)::int as total FROM app_otp_verifications;`;
        count = c[0].total;
        const s = await sql`SELECT * FROM app_otp_verifications LIMIT 2;`;
        sample = s;
      }

      console.log(`\n--- Tabela [${t}]: ${count} registros ---`);
      if (sample && sample.length > 0) {
        console.log('Exemplo de registro:', JSON.stringify(sample[0]));
      } else {
        console.log('(Tabela vazia)');
      }
    } catch (err) {
      console.error(`Erro ao consultar ${t}:`, err.message);
    }
  }

  // Verificar colunas de cada tabela
  const cols = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `;
  console.log('\n=== COLUNAS REGISTRADAS ===');
  const grouped = {};
  for (const c of cols) {
    if (!grouped[c.table_name]) grouped[c.table_name] = [];
    grouped[c.table_name].push(`${c.column_name} (${c.data_type})`);
  }
  for (const [tb, fields] of Object.entries(grouped)) {
    console.log(`\n[${tb}]:\n  - ${fields.join('\n  - ')}`);
  }
}

main();
