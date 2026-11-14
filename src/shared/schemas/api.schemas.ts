import { z } from 'zod';

// Funcionalidade 01 — Vitrine
export const storeSearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  featured: z.enum(['true', 'false']).optional(),
});

// Funcionalidade 02 (Fase 1) — Autenticação, Cadastro (RN-10) e OTP (RN-11)
export const passwordStrengthSchema = z
  .string()
  .min(8, 'A senha deve possuir no mínimo 8 caracteres')
  .regex(/[0-9]/, 'A senha deve conter pelo menos 1 número')
  .regex(
    /[^A-Za-z0-9]/,
    'A senha deve conter pelo menos 1 caractere especial (ex.: @, #, !, %)'
  );

export const registerVisitorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo (mínimo 3 caracteres)'),
  email: z.string().trim().email('Informe um endereço de e-mail válido'),
  phone: z
    .string()
    .trim()
    .min(10, 'Informe um telefone celular válido com DDD (ex.: +5563992114455)'),
  password: passwordStrengthSchema,
  lgpdConsent: z.literal(true, {
    errorMap: () => ({
      message: 'O aceite dos Termos e Política de Privacidade (LGPD) é obrigatório',
    }),
  }),
  optInMarketing: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Informe seu e-mail ou telefone'),
  password: z.string().min(4, 'Informe sua senha'),
  redirectTo: z.string().optional(),
});

export const otpSendSchema = z.object({
  phone: z.string().trim().min(10, 'Informe um telefone válido para envio do código OTP'),
});

export const otpVerifySchema = z.object({
  phone: z.string().trim().min(10, 'Informe o telefone da conta'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'O código OTP deve conter exatamente 6 dígitos numéricos'),
});

// Funcionalidade 04 — Check-in QR Code + GPS
export const createCheckInSchema = z.object({
  qrCodeToken: z.string().min(5, 'QR Code inválido'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
});

// Funcionalidade 07 — Resgate de Recompensa
export const redeemRewardSchema = z.object({
  idempotencyKey: z.string().optional(),
});

// Funcionalidade 08 — Validação e Baixa de Voucher pelo Lojista
export const merchantVoucherCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, 'Informe o código do voucher (ex.: VCH-CD-4821)'),
});
