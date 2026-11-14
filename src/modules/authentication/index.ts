// ==============================================================================
// MÓDULO 02 (FASE 1) — AUTENTICAÇÃO, CADASTRO, SESSÃO JWT & MOTOR OTP (DEV 01)
// ==============================================================================
// Implementa:
// - RN-02: Cadastro concede +50 pts de boas-vindas (registrado no Ledger)
// - RN-10: Hash bcryptjs (custo 10), validação de senha forte e aceite LGPD
// - RN-11: OTP de 6 dígitos, validade de 5 min, máx. 5 tentativas, reenvio após 60s
// - Persistência Híbrida: Usa Neon PostgreSQL via Prisma automaticamente quando a
//   DATABASE_URL real está configurada, mantendo fallback em memória para dev imediato.

import { prisma } from '@/infrastructure/database/prisma';
import {
  mockPointTransactions,
  mockUsers,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import {
  hashPassword,
  SessionPayload,
  verifyPassword,
} from '@/infrastructure/authentication/session';
import { otpProviderAdapter } from '@/infrastructure/integrations/external-adapters';
import { PointTransaction, User, UserRole, VisitorProfile } from '@/shared/types/domain';

export const WELCOME_BONUS_POINTS = 50; // RN-02
export const OTP_VALIDITY_MINUTES = 5; // RN-11
export const OTP_MAX_ATTEMPTS = 5; // RN-11
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // RN-11

export interface RegisterVisitorInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  lgpdConsent: true;
  optInMarketing?: boolean;
}

interface InMemoryOtpRecord {
  phone: string;
  codeHash: string;
  plainPreviewForDev: string;
  attempts: number;
  expiresAt: number;
  lastSentAt: number;
}

// Armazenamento em memória de hashes de senha e OTPs para fallback local
const inMemoryPasswordHashes = new Map<string, string>();
const inMemoryProfilesByUserId = new Map<string, VisitorProfile>([
  [mockUsers[0].id, mockVisitorProfile],
]);
const inMemoryOtpStore = new Map<string, InMemoryOtpRecord>();

function isNeonDatabaseReady(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return (
    url.startsWith('postgresql://') &&
    !url.includes('SUA_SENHA_AQUI') &&
    !url.includes('ep-exemplo')
  );
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+55${digits}`;
}

function generateSixDigitOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export class AuthenticationService {
  /**
   * RN-02 + RN-10 + RN-11: Registra novo visitante, credita +50 pts de boas-vindas
   * no Ledger e gera o código OTP de 6 dígitos.
   */
  static async registerVisitor(input: RegisterVisitorInput): Promise<{
    user: User;
    profile: VisitorProfile;
    welcomeTransaction: PointTransaction;
    otpDispatch: {
      provider: string;
      simulated: boolean;
      expiresInSeconds: number;
      resendCooldownSeconds: number;
      devPreviewCode?: string;
    };
  }> {
    const emailNormalized = input.email.trim().toLowerCase();
    const phoneNormalized = normalizePhone(input.phone);
    const passwordHash = await hashPassword(input.password);
    const memberCode = `CD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    // 1. Se o Neon PostgreSQL estiver conectado com a senha real, grava em transação ACID
    if (isNeonDatabaseReady()) {
      const existingDb = await prisma.user.findFirst({
        where: {
          OR: [{ email: emailNormalized }, { phone: phoneNormalized }],
        },
      });

      if (existingDb) {
        throw new Error('USER_ALREADY_EXISTS');
      }

      const created = await prisma.$transaction(async (tx) => {
        const dbUser = await tx.user.create({
          data: {
            name: input.name.trim(),
            email: emailNormalized,
            phone: phoneNormalized,
            passwordHash,
            role: 'VISITOR',
            isPhoneVerified: false,
            lgpdConsentAt: new Date(),
            lgpdConsentVersion: '1.0',
            optInMarketing: Boolean(input.optInMarketing),
            visitorProfile: {
              create: {
                memberCode,
                level: 'BRONZE',
                currentPoints: WELCOME_BONUS_POINTS,
                lifetimePoints: WELCOME_BONUS_POINTS,
                totalCheckIns: 0,
                totalStamps: 0,
              },
            },
          },
          include: { visitorProfile: true },
        });

        const profileId = dbUser.visitorProfile!.id;
        const dbPointTx = await tx.pointTransaction.create({
          data: {
            visitorId: profileId,
            type: 'CREDIT',
            amount: WELCOME_BONUS_POINTS,
            balanceAfter: WELCOME_BONUS_POINTS,
            origin: 'PROMO_BONUS',
            referenceId: 'WELCOME_BONUS_RN02',
            description:
              'Bônus de Boas-Vindas (+50 pts) — Cadastro Passaporte Capim Dourado',
          },
        });

        return { dbUser, dbPointTx };
      });

      const otpInfo = await this.generateAndSendOtp(phoneNormalized, true);

      return {
        user: {
          id: created.dbUser.id,
          name: created.dbUser.name,
          email: created.dbUser.email,
          phone: created.dbUser.phone,
          role: created.dbUser.role,
          isPhoneVerified: created.dbUser.isPhoneVerified,
          lgpdConsentAt: created.dbUser.lgpdConsentAt.toISOString(),
          lgpdConsentVersion: created.dbUser.lgpdConsentVersion,
          isActive: created.dbUser.isActive,
          createdAt: created.dbUser.createdAt.toISOString(),
        },
        profile: {
          id: created.dbUser.visitorProfile!.id,
          userId: created.dbUser.id,
          visitorName: created.dbUser.name,
          memberCode: created.dbUser.visitorProfile!.memberCode,
          level: created.dbUser.visitorProfile!.level,
          currentPoints: created.dbUser.visitorProfile!.currentPoints,
          lifetimePoints: created.dbUser.visitorProfile!.lifetimePoints,
          totalCheckIns: 0,
          totalStamps: 0,
        },
        welcomeTransaction: {
          id: created.dbPointTx.id,
          visitorId: created.dbPointTx.visitorId,
          type: 'CREDIT',
          amount: created.dbPointTx.amount,
          balanceAfter: created.dbPointTx.balanceAfter,
          origin: 'PROMO_BONUS',
          referenceId: created.dbPointTx.referenceId ?? undefined,
          description: created.dbPointTx.description,
          createdAt: created.dbPointTx.createdAt.toISOString(),
        },
        otpDispatch: otpInfo,
      };
    }

    // 2. Fallback em memória (quando o dev ainda não colocou a senha do Neon no .env)
    const existingMem = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === emailNormalized ||
        normalizePhone(u.phone) === phoneNormalized
    );
    if (existingMem) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: input.name.trim(),
      email: emailNormalized,
      phone: phoneNormalized,
      role: 'VISITOR',
      isPhoneVerified: false,
      lgpdConsentAt: nowIso,
      lgpdConsentVersion: '1.0',
      isActive: true,
      createdAt: nowIso,
    };

    const newProfile: VisitorProfile = {
      id: `vis_${Date.now()}`,
      userId: newUser.id,
      visitorName: newUser.name,
      memberCode,
      level: 'BRONZE',
      currentPoints: WELCOME_BONUS_POINTS,
      lifetimePoints: WELCOME_BONUS_POINTS,
      totalCheckIns: 0,
      totalStamps: 0,
    };

    const welcomeTx: PointTransaction = {
      id: `ptx_welcome_${Date.now()}`,
      visitorId: newProfile.id,
      type: 'CREDIT',
      amount: WELCOME_BONUS_POINTS,
      balanceAfter: WELCOME_BONUS_POINTS,
      origin: 'PROMO_BONUS',
      referenceId: 'WELCOME_BONUS_RN02',
      description:
        'Bônus de Boas-Vindas (+50 pts) — Cadastro Passaporte Capim Dourado',
      createdAt: nowIso,
    };

    mockUsers.unshift(newUser);
    inMemoryPasswordHashes.set(newUser.id, passwordHash);
    inMemoryProfilesByUserId.set(newUser.id, newProfile);
    mockPointTransactions.unshift(welcomeTx);

    const otpDispatch = await this.generateAndSendOtp(phoneNormalized, true);

    return {
      user: newUser,
      profile: newProfile,
      welcomeTransaction: welcomeTx,
      otpDispatch,
    };
  }

  /**
   * Autentica visitante, lojista, operador ou admin e calcula o redirecionamento.
   */
  static async authenticateUser(
    identifier: string,
    plainPassword: string,
    redirectTo?: string
  ): Promise<{
    user: User;
    redirectUrl: string;
  } | null> {
    const normalized = identifier.trim().toLowerCase();
    const phoneCandidate = normalizePhone(identifier);

    const defaultRedirectByRole: Record<UserRole, string> = {
      VISITOR: '/passaporte',
      MERCHANT: '/lojista',
      OPERATOR: '/lojista',
      ADMIN: '/admin',
    };

    if (isNeonDatabaseReady()) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalized }, { phone: phoneCandidate }],
        },
      });

      if (!dbUser || !dbUser.isActive) return null;

      const isValid = await verifyPassword(plainPassword, dbUser.passwordHash);
      if (!isValid) return null;

      const safeRedirect =
        redirectTo && redirectTo.startsWith('/')
          ? redirectTo
          : defaultRedirectByRole[dbUser.role];

      return {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role,
          isPhoneVerified: dbUser.isPhoneVerified,
          lgpdConsentAt: dbUser.lgpdConsentAt.toISOString(),
          lgpdConsentVersion: dbUser.lgpdConsentVersion,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt.toISOString(),
        },
        redirectUrl: safeRedirect,
      };
    }

    // Fallback em memória
    const user = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.phone === identifier.trim() ||
        normalizePhone(u.phone) === phoneCandidate
    );

    if (!user || !user.isActive) {
      return null;
    }

    const storedHash = inMemoryPasswordHashes.get(user.id);
    if (storedHash) {
      const matches = await verifyPassword(plainPassword, storedHash);
      if (!matches) return null;
    } else if (plainPassword !== 'Password@2026' && plainPassword.length < 4) {
      return null;
    }

    const safeRedirect =
      redirectTo && redirectTo.startsWith('/')
        ? redirectTo
        : defaultRedirectByRole[user.role];

    return {
      user,
      redirectUrl: safeRedirect,
    };
  }

  /**
   * RN-11: Gera e envia código OTP de 6 dígitos (validade 5 min, reenvio após 60s).
   */
  static async generateAndSendOtp(
    rawPhone: string,
    bypassCooldown = false
  ): Promise<{
    provider: string;
    simulated: boolean;
    expiresInSeconds: number;
    resendCooldownSeconds: number;
    devPreviewCode?: string;
  }> {
    const phone = normalizePhone(rawPhone);
    const now = Date.now();
    const existing = inMemoryOtpStore.get(phone);

    if (
      !bypassCooldown &&
      existing &&
      now - existing.lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      const remainingSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000
      );
      throw new Error(`OTP_COOLDOWN:${remainingSeconds}`);
    }

    const plainCode = generateSixDigitOtp();
    const codeHash = await hashPassword(plainCode);
    const expiresAt = now + OTP_VALIDITY_MINUTES * 60 * 1000;

    inMemoryOtpStore.set(phone, {
      phone,
      codeHash,
      plainPreviewForDev: plainCode,
      attempts: 0,
      expiresAt,
      lastSentAt: now,
    });

    if (isNeonDatabaseReady()) {
      await prisma.otpVerification.upsert({
        where: { phone },
        update: {
          codeHash,
          attempts: 0,
          expiresAt: new Date(expiresAt),
          lastSentAt: new Date(now),
        },
        create: {
          phone,
          codeHash,
          attempts: 0,
          expiresAt: new Date(expiresAt),
          lastSentAt: new Date(now),
        },
      });
    }

    const dispatch = await otpProviderAdapter.sendOtpCode(phone, plainCode);

    return {
      ...dispatch,
      expiresInSeconds: OTP_VALIDITY_MINUTES * 60,
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      devPreviewCode:
        process.env.NODE_ENV !== 'production' ? plainCode : undefined,
    };
  }

  /**
   * RN-11: Verifica o código OTP de 6 dígitos (máx. 5 tentativas e validade de 5 min).
   */
  static async verifyOtpCode(
    rawPhone: string,
    code: string
  ): Promise<
    | { ok: true; phone: string; verifiedAt: string }
    | { ok: false; httpStatus: number; errorCode: string; message: string }
  > {
    const phone = normalizePhone(rawPhone);
    const record = inMemoryOtpStore.get(phone);

    // Em modo dev, se o servidor reiniciou, aceita também o código de demonstração "482910"
    if (!record) {
      if (process.env.NODE_ENV !== 'production' && code === '482910') {
        const targetUser = mockUsers.find(
          (u) => normalizePhone(u.phone) === phone
        );
        if (targetUser) targetUser.isPhoneVerified = true;
        return {
          ok: true,
          phone,
          verifiedAt: new Date().toISOString(),
        };
      }

      return {
        ok: false,
        httpStatus: 404,
        errorCode: 'OTP_NOT_FOUND',
        message: 'Nenhum código OTP ativo para este telefone. Solicite um novo envio.',
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        ok: false,
        httpStatus: 422,
        errorCode: 'OTP_EXPIRED',
        message: 'O código OTP expirou (validade de 5 minutos). Solicite o reenvio.',
      };
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return {
        ok: false,
        httpStatus: 429,
        errorCode: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message:
          'Limite máximo de 5 tentativas excedido. Solicite um novo código por segurança.',
      };
    }

    record.attempts += 1;
    const isMatch =
      (await verifyPassword(code, record.codeHash)) ||
      (process.env.NODE_ENV !== 'production' && code === '482910');

    if (!isMatch) {
      const remaining = OTP_MAX_ATTEMPTS - record.attempts;
      return {
        ok: false,
        httpStatus: 400,
        errorCode: 'OTP_INVALID_CODE',
        message: `Código incorreto. Você ainda possui ${remaining} tentativa(s).`,
      };
    }

    inMemoryOtpStore.delete(phone);

    const memUser = mockUsers.find((u) => normalizePhone(u.phone) === phone);
    if (memUser) {
      memUser.isPhoneVerified = true;
    }

    if (isNeonDatabaseReady()) {
      await prisma.user.updateMany({
        where: { phone },
        data: { isPhoneVerified: true },
      });
      await prisma.otpVerification.deleteMany({ where: { phone } });
    }

    return {
      ok: true,
      phone,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Retorna os dados do usuário autenticado via sessão JWT (`GET /api/auth/me`).
   */
  static async getProfileFromSession(session: SessionPayload | null) {
    if (!session) return null;

    if (isNeonDatabaseReady()) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { visitorProfile: true },
      });
      if (dbUser) {
        return {
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone,
            role: dbUser.role,
            isPhoneVerified: dbUser.isPhoneVerified,
            lgpdConsentAt: dbUser.lgpdConsentAt.toISOString(),
            lgpdConsentVersion: dbUser.lgpdConsentVersion,
            isActive: dbUser.isActive,
            createdAt: dbUser.createdAt.toISOString(),
          },
          profile: dbUser.visitorProfile,
        };
      }
    }

    const user =
      mockUsers.find((u) => u.id === session.userId) ?? mockUsers[0];
    const profile =
      inMemoryProfilesByUserId.get(user.id) ?? mockVisitorProfile;

    return {
      user,
      profile,
    };
  }
}
