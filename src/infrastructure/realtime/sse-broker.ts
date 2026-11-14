// ==============================================================================
// BROKER DE TEMPO REAL — SERVER-SENT EVENTS (SSE) PARA VOUCHERS
// ==============================================================================

export interface VoucherRealtimeEvent {
  type: 'VOUCHER_USED' | 'VOUCHER_EXPIRED' | 'HEARTBEAT';
  code: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  usedAt?: string;
  storeName?: string;
}

type Listener = (event: VoucherRealtimeEvent) => void;

class VoucherSseBroker {
  private listenersByCode = new Map<string, Set<Listener>>();

  subscribe(voucherCode: string, listener: Listener): () => void {
    const normalized = voucherCode.toUpperCase();
    const existing = this.listenersByCode.get(normalized) ?? new Set<Listener>();
    existing.add(listener);
    this.listenersByCode.set(normalized, existing);

    return () => {
      const current = this.listenersByCode.get(normalized);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listenersByCode.delete(normalized);
      }
    };
  }

  publish(event: VoucherRealtimeEvent): void {
    const normalized = event.code.toUpperCase();
    const listeners = this.listenersByCode.get(normalized);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(event);
    }
  }
}

export const voucherSseBroker = new VoucherSseBroker();
