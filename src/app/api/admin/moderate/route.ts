import { NextRequest, NextResponse } from 'next/server';
import { AdministrationService } from '@/modules/administration';
import { adminModerationSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adminModerationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]?.message ?? 'Dados de moderação inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const result = AdministrationService.moderateItem(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: result.message,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result,
    meta: { timestamp: new Date().toISOString() },
  });
}
