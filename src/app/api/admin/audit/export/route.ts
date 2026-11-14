import { NextRequest, NextResponse } from 'next/server';
import { AdministrationService } from '@/modules/administration';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'json';
  const auditData = AdministrationService.exportAuditData();

  if (format === 'csv') {
    return new NextResponse(auditData.csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="auditoria-passaporte-capim-dourado.csv"',
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: auditData,
    meta: { timestamp: new Date().toISOString() },
  });
}
