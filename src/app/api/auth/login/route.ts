import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/modules/authentication';
import {
  encodeSessionToken,
  SESSION_COOKIE_NAME,
} from '@/infrastructure/authentication/session';
import { loginSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Credenciais inválidas.',
        },
      },
      { status: 400 }
    );
  }

  const authResult = await AuthenticationService.authenticateUser(
    parsed.data.identifier,
    parsed.data.password,
    parsed.data.redirectTo
  );

  if (!authResult) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'E-mail/telefone ou senha incorretos.',
        },
      },
      { status: 401 }
    );
  }

  const token = encodeSessionToken({
    userId: authResult.user.id,
    name: authResult.user.name,
    email: authResult.user.email,
    phone: authResult.user.phone,
    role: authResult.user.role,
    issuedAt: Date.now(),
  });

  const response = NextResponse.json({
    success: true,
    data: authResult,
    meta: { timestamp: new Date().toISOString() },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
