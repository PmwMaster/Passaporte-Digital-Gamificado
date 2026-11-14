import { NextRequest, NextResponse } from 'next/server';
import { AdministrationService } from '@/modules/administration';
import { adminGeofenceConfigSchema } from '@/shared/schemas/api.schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = adminGeofenceConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            parsed.error.issues[0]?.message ??
            'Parâmetros de geolocalização inválidos.',
        },
      },
      { status: 400 }
    );
  }

  const updated = AdministrationService.updateGeofenceConfig(parsed.data);

  return NextResponse.json({
    success: true,
    data: { geofence: updated },
    meta: { timestamp: new Date().toISOString() },
  });
}
