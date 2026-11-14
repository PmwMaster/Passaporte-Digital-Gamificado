import { NextRequest } from 'next/server';
import { voucherSseBroker } from '@/infrastructure/realtime/sse-broker';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase() ?? 'VCH-CD-4821';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent({
        type: 'HEARTBEAT',
        code,
        status: 'ACTIVE',
      });

      const unsubscribe = voucherSseBroker.subscribe(code, (event) => {
        sendEvent(event);
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
