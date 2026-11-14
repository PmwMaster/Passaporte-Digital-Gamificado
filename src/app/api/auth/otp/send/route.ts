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

    // Verifica se existe conta cadastrada para o número antes de disparar o WhatsApp
    const existingUser = await AuthenticationService.findUserByPhoneOrEmail(
      parsed.data.phone
    );
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message:
              'Nenhuma conta encontrada para este número de WhatsApp. Crie sua conta primeiro na aba "Criar conta".',
          },
        },
        { status: 404 }
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

    if (
      err instanceof Error &&
      (err.message.startsWith('WHATSAPP_CREDENTIALS_MISSING:') ||
        err.message.startsWith('WHATSAPP_API_ERROR:'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WHATSAPP_PROVIDER_ERROR',
            message: err.message.replace(/^WHATSAPP_[A-Z_]+:\s*/, ''),
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'OTP_DISPATCH_ERROR',
          message: 'Não foi possível enviar o código OTP via WhatsApp.',
        },
      },
      { status: 500 }
    );
  }
}
