import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { RewardsCatalogService } from '@/modules/rewards';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Faça login para resgatar esta recompensa.',
        },
      },
      { status: 401 }
    );
  }

  const { id } = await params;
  const result = RewardsCatalogService.redeemReward(id, session.userId);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.code,
          message: result.message,
        },
      },
      { status: result.httpStatus }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: { timestamp: new Date().toISOString() },
    },
    { status: 201 }
  );
}
