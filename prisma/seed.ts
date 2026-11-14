// ==============================================================================
// SEED INICIAL DO NEON POSTGRESQL VIA DRIVER HTTP (@neondatabase/serverless)
// ==============================================================================

import bcrypt from 'bcryptjs';
import { ensureNeonTables, getNeonSql } from '../src/infrastructure/database/neon';

async function main() {
  console.log('Iniciando seed no Neon Serverless PostgreSQL via HTTP (@neondatabase/serverless)...');

  await ensureNeonTables();
  const sql = getNeonSql();
  const defaultHash = await bcrypt.hash('Password@2026', 10);

  // 1. Visitante Demo
  await sql`
    INSERT INTO app_users (
      id, name, email, phone, password_hash, role,
      is_phone_verified, lgpd_consent_at, lgpd_consent_version,
      opt_in_marketing, is_active
    ) VALUES (
      'usr_visitor_01',
      'Mariana Alves Tocantins',
      'mariana.alves@exemplo.com.br',
      '+5563992114455',
      ${defaultHash},
      'VISITOR',
      TRUE,
      NOW(),
      '1.0',
      TRUE,
      TRUE
    )
    ON CONFLICT (email) DO NOTHING
  `;

  await sql`
    INSERT INTO app_visitor_profiles (
      id, user_id, member_code, level,
      current_points, lifetime_points, total_check_ins, total_stamps
    ) VALUES (
      'vis_01',
      'usr_visitor_01',
      'CD-2026-0148',
      'GOLD',
      640,
      1420,
      14,
      9
    )
    ON CONFLICT (user_id) DO NOTHING
  `;

  // 2. Lojista Demo
  await sql`
    INSERT INTO app_users (
      id, name, email, phone, password_hash, role,
      is_phone_verified, lgpd_consent_at, lgpd_consent_version,
      opt_in_marketing, is_active
    ) VALUES (
      'usr_merchant_01',
      'Roberto Mendes (Gerente Café Jalapão)',
      'gerencia@cafejalapao.com.br',
      '+5563999887766',
      ${defaultHash},
      'MERCHANT',
      TRUE,
      NOW(),
      '1.0',
      FALSE,
      TRUE
    )
    ON CONFLICT (email) DO NOTHING
  `;

  // 3. Administrador Demo
  await sql`
    INSERT INTO app_users (
      id, name, email, phone, password_hash, role,
      is_phone_verified, lgpd_consent_at, lgpd_consent_version,
      opt_in_marketing, is_active
    ) VALUES (
      'usr_admin_01',
      'Diretoria Marketing Capim Dourado',
      'admin@capimdouradoshopping.com.br',
      '+556332150000',
      ${defaultHash},
      'ADMIN',
      TRUE,
      NOW(),
      '1.0',
      FALSE,
      TRUE
    )
    ON CONFLICT (email) DO NOTHING
  `;

  console.log('Seed concluído com sucesso no Neon PostgreSQL via HTTP!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
