import { z } from 'zod';

// Funcionalidade 01 — Vitrine
export const storeSearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  featured: z.enum(['true', 'false']).optional(),
});

// Funcionalidade 02 — Autenticação e Cadastro
export const registerVisitorSchema = z.object({
  name: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Informe um telefone válido com DDD'),
  password: z.string().min(8, 'A senha deve possuir no mínimo 8 caracteres'),
  lgpdConsent: z.literal(true, {
    errorMap: () => ({ message: 'O consentimento LGPD é obrigatório para criar o passaporte' }),
  }),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Informe seu e-mail ou telefone'),
  password: z.string().min(4, 'Informe sua senha'),
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
