// ==============================================================================
// INTEGRAÇÃO OFICIAL META WHATSAPP CLOUD API (GRAPH API v21.0)
// ==============================================================================
// Envia mensagens reais de OTP de 6 dígitos via WhatsApp Cloud API da Meta.
// Variáveis necessárias no .env / Vercel:
// - WHATSAPP_PHONE_NUMBER_ID: ID do número de telefone no painel Meta for Developers
// - WHATSAPP_API_TOKEN: Token de Acesso (Bearer) da Meta Cloud API
// - WHATSAPP_TEMPLATE_NAME (Opcional): Nome do template de autenticação aprovado

export interface OtpDispatchResult {
  provider: string;
  simulated: boolean;
  messageId?: string;
}

export interface IOtpProviderAdapter {
  sendOtpCode(phone: string, code: string): Promise<OtpDispatchResult>;
}

export class MetaWhatsAppCloudAdapter implements IOtpProviderAdapter {
  async sendOtpCode(phone: string, code: string): Promise<OtpDispatchResult> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    const accessToken = process.env.WHATSAPP_API_TOKEN?.trim();
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();
    const templateLang = process.env.WHATSAPP_TEMPLATE_LANG?.trim() || 'pt_BR';

    // Formato exigido pela Meta Cloud API: apenas dígitos com DDI (ex: 5563992114455)
    const cleanRecipient = phone.replace(/\D/g, '');

    if (!phoneNumberId || !accessToken) {
      throw new Error(
        'WHATSAPP_CREDENTIALS_MISSING: Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_API_TOKEN no arquivo .env e na Vercel para disparo real via Meta WhatsApp Cloud API.'
      );
    }

    const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    // Se houver um Template de Autenticação configurado (ex: 'otp_passe_dourado'), envia via template
    if (templateName) {
      const templatePayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: code }],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: code }],
            },
          ],
        },
      };

      const tplRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templatePayload),
      });

      if (tplRes.ok) {
        const tplJson = await tplRes.json();
        return {
          provider: 'META_WHATSAPP_CLOUD_API_TEMPLATE',
          simulated: false,
          messageId: tplJson?.messages?.[0]?.id,
        };
      }
    }

    // Disparo de mensagem de texto direta via Meta WhatsApp Cloud API
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'text',
      text: {
        preview_url: false,
        body: `✨ *Passe Dourado Shopping*\n\nSeu código de verificação de 6 dígitos é: *${code}*\n\n⏱️ Válido por 5 minutos. Não compartilhe este código com ninguém.`,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(textPayload),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const metaErrorMsg =
        json?.error?.message ||
        `Erro HTTP ${res.status} na Meta WhatsApp Cloud API`;
      throw new Error(`WHATSAPP_API_ERROR: ${metaErrorMsg}`);
    }

    return {
      provider: 'META_WHATSAPP_CLOUD_API',
      simulated: false,
      messageId: json?.messages?.[0]?.id,
    };
  }
}

export const otpProviderAdapter = new MetaWhatsAppCloudAdapter();
