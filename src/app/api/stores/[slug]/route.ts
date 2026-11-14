import { NextRequest, NextResponse } from 'next/server';
import { StorefrontService } from '@/modules/storefront';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const result = StorefrontService.getStoreBySlug(slug);

  if (!result) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Loja parceira não encontrada ou inativa.',
        },
      },
      { status: 404 }
    );
  }

  // Oculta o qrCodeToken oficial no payload público da vitrine
  const { qrCodeToken: _hiddenToken, ...publicStore } = result.store;

  return NextResponse.json({
    success: true,
    data: {
      store: publicStore,
      rewards: result.rewards,
      campaigns: result.campaigns,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
