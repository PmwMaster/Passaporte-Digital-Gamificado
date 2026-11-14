import { NextRequest, NextResponse } from 'next/server';
import { MerchantPortalService } from '@/modules/merchant';
import { merchantVoucherCodeSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = merchantVoucherCodeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Código de voucher inválido.',
        },
      },
      { status: 400 }
    );
  }

  const result = MerchantPortalService.confirmVoucherRedemption(parsed.data.code);

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

  return NextResponse.json({
    success: true,
    data: result.data,
    meta: { timestamp: new Date().toISOString() },
  });
}
