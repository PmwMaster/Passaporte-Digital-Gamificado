import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { AuthenticationService } from '@/modules/authentication';

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Nenhuma sessão JWT ativa encontrada.',
        },
      },
      { status: 401 }
    );
  }

  const profileData = await AuthenticationService.getProfileFromSession(session);

  return NextResponse.json({
    success: true,
    data: {
      session,
      ...profileData,
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
