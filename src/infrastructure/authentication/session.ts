// ==============================================================================
// INFRAESTRUTURA DE AUTENTICAÇÃO E SESSÃO (JWT + COOKIES HTTP-ONLY + BCRYPTJS)
// ==============================================================================

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole } from '@/shared/types/domain';

export const SESSION_COOKIE_NAME = 'passaporte_cd_session';

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  storeId?: string;
  issuedAt: number;
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, 10);
}

export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Codifica payload de sessão assinado para Cookie HttpOnly.
 */
export function encodeSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf-8').toString('base64url');
}

export function decodeSessionToken(token: string): SessionPayload | null {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(json) as SessionPayload;
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
