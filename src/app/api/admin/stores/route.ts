import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/infrastructure/authentication/session';
import { AdministrationService } from '@/modules/administration';
import { adminCreateStoreSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: auth.code,
          message: auth.message,
        },
      },
      { status: auth.status }
    );
  }

  const body = await request.json();
  const parsed = adminCreateStoreSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]?.message ?? 'Dados da loja inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const store = AdministrationService.createPartnerStore(parsed.data);

  return NextResponse.json(
    {
      success: true,
      data: { store },
      meta: {
        timestamp: new Date().toISOString(),
        createdBy: auth.session.email,
      },
    },
    { status: 201 }
  );
}
