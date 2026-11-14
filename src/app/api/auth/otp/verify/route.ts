import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/modules/authentication';
import {
  encodeSessionToken,
  SESSION_COOKIE_NAME,
} from '@/infrastructure/authentication/session';
import { otpVerifySchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = otpVerifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]?.message ??
            'Informe os 6 dígitos numéricos do código OTP.',
        },
      },
      { status: 400 }
    );
  }

  const verification = await AuthenticationService.verifyOtpCode(
    parsed.data.phone,
    parsed.data.code
  );

  if (!verification.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: verification.errorCode,
          message: verification.message,
        },
      },
      { status: verification.httpStatus }
    );
  }

  const defaultRedirect =
    verification.user.role === 'ADMIN'
      ? '/admin'
      : verification.user.role === 'MERCHANT' ||
        verification.user.role === 'OPERATOR'
      ? '/lojista'
      : '/passaporte';

  const token = encodeSessionToken({
    userId: verification.user.id,
    name: verification.user.name,
    email: verification.user.email,
    phone: verification.user.phone,
    role: verification.user.role,
    issuedAt: Date.now(),
  });

  const response = NextResponse.json({
    success: true,
    data: {
      phone: verification.phone,
      verifiedAt: verification.verifiedAt,
      user: verification.user,
      redirectUrl: defaultRedirect,
    },
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
