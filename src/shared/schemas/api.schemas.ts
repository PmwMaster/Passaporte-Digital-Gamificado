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

// Funcionalidade 03 (Fase 3) — Atualização de Perfil do Visitante
export const updateVisitorProfileSchema = z.object({
  name: z.string().trim().min(3).optional(),
  optInMarketing: z.boolean().optional(),
});

// Funcionalidade 04 — Check-in QR Code + GPS
export const createCheckInSchema = z.object({
  qrCodeToken: z.string().min(5, 'QR Code inválido'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
});

// Funcionalidade 07 (Fase 3) — Resgate de Recompensa
export const redeemRewardSchema = z.object({
  idempotencyKey: z.string().optional(),
});

// Funcionalidade 08 (Fase 4) — Portal do Lojista: Validação, Ofertas e Estoque
export const merchantVoucherCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(6, 'Informe o código do voucher (ex.: VCH-CD-4821)'),
});

export const merchantCreateRewardSchema = z.object({
  storeId: z.string().default('store_01'),
  title: z.string().trim().min(4, 'Informe o título da oferta/recompensa'),
  description: z.string().trim().min(10, 'Descreva o benefício para o visitante'),
  rules: z.string().trim().min(5, 'Informe as regras de utilização no balcão'),
  pointsCost: z.number().int().min(10, 'O custo mínimo é de 10 pontos'),
  initialStock: z.number().int().min(1, 'O estoque inicial deve ser de pelo menos 1 unidade'),
  maxPerVisitor: z.number().int().min(1).default(2),
  voucherValidityHours: z.number().int().min(1).max(168).default(2),
});

export const merchantUpdateStockSchema = z.object({
  rewardId: z.string().min(1),
  deltaStock: z.number().int(),
});

// Funcionalidade 09 (Fase 2 & Fase 4) — Painel Administrativo
export const adminCreateStoreSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome da loja parceira'),
  category: z.enum([
    'GASTRONOMIA',
    'MODA',
    'SERVICOS',
    'LAZER',
    'BELEZA',
    'TECNOLOGIA',
  ]),
  floor: z.string().trim().min(2, 'Informe o piso/localização'),
  unitNumber: z.string().trim().min(1, 'Informe o número da loja/quiosque'),
  description: z.string().trim().min(10, 'Informe uma descrição editorial da loja'),
  checkInPoints: z.number().int().min(5).max(500).default(40),
  isFeatured: z.boolean().default(true),
});

export const adminModerationSchema = z.object({
  targetType: z.enum(['CAMPAIGN', 'REWARD']),
  targetId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
});

export const adminGeofenceConfigSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(5000),
});
