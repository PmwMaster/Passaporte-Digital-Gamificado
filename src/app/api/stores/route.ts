import { NextRequest, NextResponse } from 'next/server';
import { StorefrontService } from '@/modules/storefront';
import { storeSearchQuerySchema } from '@/shared/schemas/api.schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = storeSearchQuerySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Parâmetros de filtro inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const stores = StorefrontService.listPublicStores({
    query: parsed.data.q,
    category: parsed.data.category,
    featuredOnly: parsed.data.featured === 'true',
  });
  const highlights = StorefrontService.getPublicHighlights();

  return NextResponse.json({
    success: true,
    data: {
      stores,
      banners: highlights.activeCampaigns,
    },
    meta: {
      timestamp: new Date().toISOString(),
      total: stores.length,
    },
  });
}
