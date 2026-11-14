// ==============================================================================
// INFRAESTRUTURA DE AUTENTICAÇÃO E SESSÃO (JWT HMAC-SHA256 + COOKIE HTTP-ONLY)
// ==============================================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole } from '@/shared/types/domain';

export const SESSION_COOKIE_NAME = 'passaporte_cd_session';

const JWT_SECRET =
  process.env.JWT_SECRET ??
  'chave-secreta-desenvolvimento-local-capim-dourado-shopping-2026';

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  storeId?: string;
  issuedAt: number;
  expiresAt: number;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

function signHmacSha256(data: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
}

/**
 * Gera um JWT assinado (HS256) para armazenamento em Cookie HttpOnly.
 */
export function encodeSessionToken(
  payload: Omit<SessionPayload, 'expiresAt'> & { expiresAt?: number }
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    'utf-8'
  ).toString('base64url');

  const expiresInMs =
    Number(process.env.JWT_EXPIRES_IN_HOURS ?? 168) * 60 * 60 * 1000;

  const fullPayload: SessionPayload = {
    ...payload,
    expiresAt: payload.expiresAt ?? Date.now() + expiresInMs,
  };

  const body = Buffer.from(JSON.stringify(fullPayload), 'utf-8').toString(
    'base64url'
  );
  const signature = signHmacSha256(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

/**
 * Verifica a assinatura HMAC-SHA256 e a expiração do JWT.
 */
export function decodeSessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = signHmacSha256(`${header}.${body}`);

    if (signature !== expectedSignature) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf-8')
    ) as SessionPayload;

    if (decoded.expiresAt && Date.now() > decoded.expiresAt) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return decodeSessionToken(token);
}
