import { NextRequest, NextResponse } from 'next/server';
import { CheckInService } from '@/modules/checkin';
import { createCheckInSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createCheckInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Dados de check-in inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const result = CheckInService.performCheckIn(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: result.code,
          message: result.message,
          details: 'details' in result ? result.details : undefined,
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
