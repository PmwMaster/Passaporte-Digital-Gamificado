// ==============================================================================
// ADAPTADORES DE INTEGRAÇÕES EXTERNAS — MODO HÍBRIDO (API WHATSAPP + SIMULADOR)
// ==============================================================================

export interface OtpDispatchResult {
  provider: string;
  simulated: boolean;
  messagePreview: string;
}

export interface IOtpProviderAdapter {
  sendOtpCode(phone: string, code: string): Promise<OtpDispatchResult>;
}

export class HybridWhatsAppOtpAdapter implements IOtpProviderAdapter {
  async sendOtpCode(phone: string, code: string): Promise<OtpDispatchResult> {
    const messagePreview = `✨ *Passe Dourado Shopping*: Seu código de verificação de 6 dígitos é *${code}*. Válido por 5 minutos.`;

    const apiUrl = process.env.WHATSAPP_API_URL?.trim();
    const apiToken = process.env.WHATSAPP_API_TOKEN?.trim();

    // Se houver endpoint de API WhatsApp configurado no .env (Evolution API, Z-API ou Meta Cloud), dispara via HTTP
    if (apiUrl && apiToken) {
      try {
        const cleanDigits = phone.replace(/\D/g, '');
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
            apikey: apiToken,
          },
          body: JSON.stringify({
            number: cleanDigits,
            phone: cleanDigits,
            text: messagePreview,
            message: messagePreview,
          }),
        });

        if (res.ok) {
          return {
            provider: 'WHATSAPP_HTTP_API',
            simulated: false,
            messagePreview,
          };
        }
      } catch (err) {
        console.warn(
          '[WhatsApp Hybrid Adapter] Falha no envio HTTP externo, ativando simulador interativo:',
          err
        );
      }
    }

    console.info(
      `[WHATSAPP HYBRID SIMULATOR] Para ${phone} -> ${messagePreview}`
    );

    return {
      provider: 'WHATSAPP_HYBRID_SIMULATOR',
      simulated: true,
      messagePreview,
    };
  }
}

export const otpProviderAdapter = new HybridWhatsAppOtpAdapter();
