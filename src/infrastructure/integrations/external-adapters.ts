// ==============================================================================
// ADAPTADORES DE INTEGRAÇÕES EXTERNAS (MODO MOCK EXPLÍCITO PARA DESENVOLVIMENTO)
// ==============================================================================
// Importante: Conforme documentado em docs/DUVIDAS_E_PREMISSAS.md (P0-01, P1-01, P2-03),
// nenhuma integração externa simula conexão real de produção sem credenciais definidas.

export interface IOtpProviderAdapter {
  sendOtpCode(phone: string, code: string): Promise<{ provider: string; simulated: boolean }>;
}

export class MockWhatsAppOtpAdapter implements IOtpProviderAdapter {
  async sendOtpCode(phone: string, code: string) {
    console.info(
      `[MOCK OTP ADAPTER - PENDENTE P0-01] Código OTP ${code} gerado para ${phone} (Ambiente de Desenvolvimento)`
    );
    return {
      provider: 'MOCK_DEV_CONSOLE',
      simulated: true,
    };
  }
}

export const otpProviderAdapter = new MockWhatsAppOtpAdapter();
