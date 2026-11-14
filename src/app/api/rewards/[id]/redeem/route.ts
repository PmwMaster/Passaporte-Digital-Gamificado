import { NextRequest, NextResponse } from 'next/server';
import { RewardsCatalogService } from '@/modules/rewards';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = RewardsCatalogService.redeemReward(id);

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
