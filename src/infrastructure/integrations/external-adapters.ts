// ==============================================================================
// ADAPTADOR DE ENVIO DE MENSAGENS / WHATSAPP (PADRÃO DIRETO + META OPCIONAL)
// ==============================================================================

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

    const cleanRecipient = phone.replace(/\D/g, '');

    // Se as chaves da Meta não estiverem configuradas, opera no modo padrão direto
    if (!phoneNumberId || !accessToken) {
      return {
        provider: 'STANDARD_DIRECT_AUTH',
        simulated: true,
      };
    }

    const endpoint = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

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
          ],
        },
      };

      try {
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
      } catch {
        // Fallback para envio direto
      }
    }

    try {
      const textPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'text',
        text: {
          preview_url: false,
          body: `✨ *Passe Dourado Shopping*\n\nSeu código de acesso: *${code}*`,
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

      return {
        provider: 'META_WHATSAPP_CLOUD_API',
        simulated: !res.ok,
        messageId: json?.messages?.[0]?.id,
      };
    } catch {
      return {
        provider: 'STANDARD_DIRECT_AUTH',
        simulated: true,
      };
    }
  }
}

export const otpProviderAdapter = new MetaWhatsAppCloudAdapter();
