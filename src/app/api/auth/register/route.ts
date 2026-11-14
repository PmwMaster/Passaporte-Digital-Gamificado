import { NextRequest, NextResponse } from 'next/server';
import { AuthenticationService } from '@/modules/authentication';
import {
  encodeSessionToken,
  SESSION_COOKIE_NAME,
} from '@/infrastructure/authentication/session';
import { registerVisitorSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerVisitorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message:
              parsed.error.issues[0]?.message ?? 'Dados de cadastro inválidos.',
            details: { issues: parsed.error.issues },
          },
        },
        { status: 400 }
      );
    }

    const result = await AuthenticationService.registerVisitor(parsed.data);

    const token = encodeSessionToken({
      userId: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role,
      issuedAt: Date.now(),
    });

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_ALREADY_EXISTS') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message:
              'Já existe um passaporte cadastrado com este e-mail ou telefone.',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao processar cadastro do Passaporte Digital.',
        },
      },
      { status: 500 }
    );
  }
}
