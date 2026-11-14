import { NextRequest, NextResponse } from 'next/server';
import { MerchantPortalService } from '@/modules/merchant';
import {
  merchantCreateRewardSchema,
  merchantUpdateStockSchema,
} from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = merchantCreateRewardSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]?.message ??
            'Dados da oferta/recompensa inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const reward = MerchantPortalService.createStoreReward(parsed.data);

  return NextResponse.json(
    {
      success: true,
      data: { reward },
      meta: { timestamp: new Date().toISOString() },
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = merchantUpdateStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de ajuste de estoque inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const updated = MerchantPortalService.adjustRewardStock(
    parsed.data.rewardId,
    parsed.data.deltaStock
  );

  if (!updated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'REWARD_NOT_FOUND',
          message: 'Oferta não encontrada.',
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { reward: updated },
    meta: { timestamp: new Date().toISOString() },
  });
}
