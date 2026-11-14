import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/modules/authentication';
import { otpSendSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Telefone inválido.',
          },
        },
        { status: 400 }
      );
    }

    const dispatch = await AuthenticationService.generateAndSendOtp(
      parsed.data.phone
    );

    return NextResponse.json({
      success: true,
      data: dispatch,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('OTP_COOLDOWN:')) {
      const seconds = Number(err.message.split(':')[1] ?? 60);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OTP_COOLDOWN_ACTIVE',
            message: `Aguarde ${seconds}s antes de solicitar um novo código OTP (RN-11).`,
            details: { retryAfterSeconds: seconds },
          },
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OTP_DISPATCH_ERROR',
          message: 'Não foi possível enviar o código OTP.',
        },
      },
      { status: 500 }
    );
  }
}
