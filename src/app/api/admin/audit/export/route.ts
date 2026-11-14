import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/infrastructure/authentication/session';
import { AdministrationService } from '@/modules/administration';

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'csv';
  const auditData = AdministrationService.exportAuditData();

  if (format === 'csv') {
    return new NextResponse(auditData.csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="auditoria-passe-dourado.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: auditData,
    meta: {
      timestamp: new Date().toISOString(),
      exportedBy: auth.session.email,
    },
  });
}
