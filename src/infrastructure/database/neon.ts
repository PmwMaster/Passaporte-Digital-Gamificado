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
    // O driver HTTP da Neon usa a string de conexão padrão postgresql://
    const cleanUrl = rawUrl
      .replace('&channel_binding=require', '')
      .replace('?channel_binding=require&', '?');
    cachedSql = neon(cleanUrl);
  }
  return cachedSql;
}

/**
 * Garante que as tabelas essenciais existam no Neon PostgreSQL automaticamente
 * na primeira requisição, sem precisar de `prisma migrate` ou `prisma db push`.
 */
export async function ensureNeonTables(): Promise<void> {
  if (schemaInitialized || !isNeonConfigured()) return;

  try {
    const sql = getNeonSql();

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
      CREATE TABLE IF NOT EXISTS app_otp_verifications (
        phone TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMPTZ NOT NULL,
        last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    schemaInitialized = true;
  } catch (err) {
    console.warn('[Neon HTTP Driver] Aviso ao inicializar tabelas (usando fallback em memória):', err);
  }
}
