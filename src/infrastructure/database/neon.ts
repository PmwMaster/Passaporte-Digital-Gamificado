// ==============================================================================
// CLIENTE LEVE NEON SERVERLESS HTTP (@neondatabase/serverless) — ZERO PRISMA BUILD
// ==============================================================================
// Conecta diretamente ao Neon PostgreSQL via HTTP (ideal para Vercel Serverless / Edge
// e desenvolvimento rápido da equipe sem depender de binários Rust do Prisma).

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_ad4WvqogUH1t@ep-ancient-sunset-bef18lgk-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaInitialized = false;

export function isNeonConfigured(): boolean {
  const url = (process.env.DATABASE_URL ?? DEFAULT_NEON_URL).trim();
  return (
    url.startsWith('postgresql://') &&
    !url.includes('SUA_SENHA_AQUI') &&
    !url.includes('ep-exemplo')
  );
}

/**
 * Retorna a função tagged-template `sql` do driver oficial HTTP da Neon.
 * Exemplo de uso pelos Devs:
 *   const sql = getNeonSql();
 *   const rows = await sql`SELECT * FROM app_users WHERE email = ${email}`;
 */
export function getNeonSql(): NeonQueryFunction<false, false> {
  if (!cachedSql) {
    const rawUrl = (process.env.DATABASE_URL ?? DEFAULT_NEON_URL).trim();
    const cleanUrl = rawUrl
      .replace('&channel_binding=require', '')
      .replace('?channel_binding=require&', '?');
    cachedSql = neon(cleanUrl);
  }
  return cachedSql;
}

/**
 * Garante que todas as tabelas essenciais (incluindo os módulos do DEV 02:
 * Check-in F04, Gamificação/Carimbos/Missões F05 e Ledger de Pontos F06)
 * existam no Neon PostgreSQL automaticamente na primeira requisição.
 */
export async function ensureNeonTables(): Promise<void> {
  if (schemaInitialized || !isNeonConfigured()) return;

  try {
    const sql = getNeonSql();

    // 1. Usuários e Perfis
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'VISITOR',
        is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        lgpd_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        lgpd_consent_version TEXT NOT NULL DEFAULT '1.0',
        opt_in_marketing BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_visitor_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        member_code TEXT UNIQUE NOT NULL,
        level TEXT NOT NULL DEFAULT 'BRONZE',
        current_points INTEGER NOT NULL DEFAULT 50,
        lifetime_points INTEGER NOT NULL DEFAULT 50,
        total_check_ins INTEGER NOT NULL DEFAULT 0,
        total_stamps INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_otp_verifications (
        phone TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Feature 03 (F06 — DEV 02): Ledger Imutável de Pontos
    await sql`
      CREATE TABLE IF NOT EXISTS app_point_transactions (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL REFERENCES app_visitor_profiles(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        origin TEXT NOT NULL,
        reference_id TEXT,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_point_tx_idempotency
      ON app_point_transactions (visitor_id, type, origin, reference_id)
      WHERE reference_id IS NOT NULL;
    `;

    // 3. Feature 01 (F04 — DEV 02): Check-ins Presenciais + Geofence Haversine 250m
    await sql`
      CREATE TABLE IF NOT EXISTS app_check_ins (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL REFERENCES app_visitor_profiles(id) ON DELETE CASCADE,
        store_id TEXT NOT NULL,
        store_name TEXT NOT NULL,
        check_in_date TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        accuracy_meters DOUBLE PRECISION,
        distance_meters INTEGER NOT NULL,
        is_within_geofence BOOLEAN NOT NULL,
        status TEXT NOT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_valid_daily_checkin
      ON app_check_ins (visitor_id, store_id, check_in_date)
      WHERE status = 'VALID';
    `;

    // 4. Feature 02 (F05 — DEV 02): Carimbos Digitais, Missões e Progresso por Período
    await sql`
      CREATE TABLE IF NOT EXISTS app_stamps (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL REFERENCES app_visitor_profiles(id) ON DELETE CASCADE,
        store_id TEXT NOT NULL,
        store_name TEXT NOT NULL,
        check_in_id TEXT NOT NULL REFERENCES app_check_ins(id) ON DELETE CASCADE,
        badge_title TEXT NOT NULL,
        category TEXT NOT NULL,
        earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_missions (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        frequency TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_category TEXT,
        target_count INTEGER NOT NULL,
        reward_points INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS app_mission_progress (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL REFERENCES app_visitor_profiles(id) ON DELETE CASCADE,
        mission_id TEXT NOT NULL REFERENCES app_missions(id) ON DELETE CASCADE,
        period_key TEXT NOT NULL,
        current_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (visitor_id, mission_id, period_key)
      );
    `;

    // 5. Seed inicial idempotente do visitante padrão (vis_01) e das 3 missões oficiais
    await sql`
      INSERT INTO app_users (id, name, email, phone, password_hash, role, is_phone_verified)
      VALUES ('usr_visitor_01', 'Mariana Alves Tocantins', 'mariana.alves@exemplo.com.br', '+5563992114455', '$2a$10$mockhashedpassword', 'VISITOR', TRUE)
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO app_visitor_profiles (id, user_id, member_code, level, current_points, lifetime_points, total_check_ins, total_stamps)
      VALUES ('vis_01', 'usr_visitor_01', 'CD-2026-0148', 'GOLD', 640, 1420, 14, 3)
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO app_missions (id, code, title, description, frequency, target_type, target_category, target_count, reward_points, is_active)
      VALUES
        ('mis_01', 'DAILY_CHECKIN_01', 'Presença Dourada do Dia', 'Realize 1 check-in presencial em qualquer loja parceira hoje.', 'DAILY', 'CHECKIN_COUNT', NULL, 1, 30, TRUE),
        ('mis_02', 'WEEKLY_GASTRO_03', 'Rota Gastronômica de Palmas', 'Visite 3 operações de Gastronomia & Cafés durante a semana.', 'WEEKLY', 'CATEGORY_VARIETY', 'GASTRONOMIA', 3, 120, TRUE),
        ('mis_03', 'MONTHLY_EXPLORER_05', 'Embaixador Capim Dourado', 'Colecione 5 carimbos de lojas diferentes no mês de novembro.', 'MONTHLY', 'CHECKIN_COUNT', NULL, 5, 250, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `;

    schemaInitialized = true;
  } catch (err) {
    console.warn(
      '[Neon HTTP Driver] Aviso ao inicializar tabelas (usando fallback em memória):',
      err
    );
  }
}
