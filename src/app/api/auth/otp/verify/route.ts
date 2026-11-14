import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/modules/authentication';
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

  return NextResponse.json({
    success: true,
    data: {
      phone: verification.phone,
      verifiedAt: verification.verifiedAt,
      redirectUrl: '/passaporte',
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
