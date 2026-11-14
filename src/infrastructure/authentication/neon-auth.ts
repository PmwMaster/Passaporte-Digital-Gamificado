// ==============================================================================
// INTEGRAÇÃO NEON AUTH & JWKS — INFRASTRUCTURE LAYER (MÓDULO 02 - DEV 01)
// ==============================================================================
// Auth Base URL: https://ep-ancient-sunset-bef18lgk.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth
// JWKS URL:      https://ep-ancient-sunset-bef18lgk.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json

export const NEON_AUTH_CONFIG = {
  authBaseUrl:
    process.env.NEON_AUTH_URL ??
    process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
    'https://ep-ancient-sunset-bef18lgk.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth',
  jwksUrl:
    process.env.NEON_AUTH_JWKS_URL ??
    'https://ep-ancient-sunset-bef18lgk.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json',
} as const;

export interface JwksKey {
  kty: string;
  use?: string;
  kid: string;
  alg?: string;
  n?: string;
  e?: string;
  crv?: string;
  x?: string;
  y?: string;
}

export interface JwksResponse {
  keys: JwksKey[];
}

/**
 * Busca as chaves públicas (JWKS) do Neon Auth para verificação de tokens JWT
 * emitidos pelo Neon Auth e utilizados na Data API REST do Neon.
 */
export async function fetchNeonJwks(): Promise<JwksResponse> {
  const response = await fetch(NEON_AUTH_CONFIG.jwksUrl, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar JWKS do Neon Auth: HTTP ${response.status}`);
  }

  return response.json() as Promise<JwksResponse>;
}

/**
 * Consulta a sessão ativa no endpoint de autenticação do Neon Auth (/get-session).
 */
export async function getNeonAuthSession(cookieHeader?: string) {
  const response = await fetch(`${NEON_AUTH_CONFIG.authBaseUrl}/get-session`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
