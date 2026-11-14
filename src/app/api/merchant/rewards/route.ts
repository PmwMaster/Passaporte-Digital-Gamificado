import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { MerchantPortalService } from '@/modules/merchant';
import {
  merchantCreateRewardSchema,
  merchantUpdateStockSchema,
} from '@/shared/schemas/api.schemas';
import { Reward } from '@/shared/types/domain';

async function attachQrCodeDataUrl(reward: Reward): Promise<Reward> {
  const payload =
    reward.qrPayload ??
    `PASSE-DOURADO:PROMO:${reward.promoCode ?? reward.id.toUpperCase()}`;
  const promoCode =
    reward.promoCode ?? `PROMO-${reward.id.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1F1A11',
        light: '#FFFFFF',
      },
    });
    reward.promoCode = promoCode;
    reward.qrPayload = payload;
    reward.qrCodeDataUrl = qrCodeDataUrl;
  } catch {
    reward.promoCode = promoCode;
    reward.qrPayload = payload;
  }

  return reward;
}

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId') ?? 'store_01';
  const dashboard = MerchantPortalService.getStoreDashboard(storeId);
  const rewardsWithQr = await Promise.all(
    dashboard.rewards.map((r) => attachQrCodeDataUrl(r))
  );

  return NextResponse.json({
    success: true,
    data: { rewards: rewardsWithQr },
    meta: { timestamp: new Date().toISOString() },
  });
}

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
  await attachQrCodeDataUrl(reward);

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
