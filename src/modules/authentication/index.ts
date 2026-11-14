// ==============================================================================
// MÓDULO 02 — AUTENTICAÇÃO E CADASTRO (RESPONSÁVEL: DEV 01)
// ==============================================================================

import { mockUsers, mockVisitorProfile } from '@/infrastructure/database/mock-data';
import { otpProviderAdapter } from '@/infrastructure/integrations/external-adapters';
import { User, UserRole, VisitorProfile } from '@/shared/types/domain';

export interface RegisterVisitorInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  lgpdConsent: true;
}

export class AuthenticationService {
  static async authenticateUser(identifier: string, _password: string): Promise<{
    user: User;
    redirectUrl: string;
  } | null> {
    const normalized = identifier.trim().toLowerCase();
    const user =
      mockUsers.find(
        (u) => u.email.toLowerCase() === normalized || u.phone === identifier.trim()
      ) ?? mockUsers[0];

    const redirectByRole: Record<UserRole, string> = {
      VISITOR: '/passaporte',
      MERCHANT: '/lojista',
      OPERATOR: '/lojista',
      ADMIN: '/admin',
    };

    return {
      user,
      redirectUrl: redirectByRole[user.role],
    };
  }

  static async registerVisitor(input: RegisterVisitorInput): Promise<{
    user: User;
    profile: VisitorProfile;
    otpDispatch: { provider: string; simulated: boolean };
  }> {
    const existing = mockUsers.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() || u.phone === input.phone
    );
    if (existing) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: 'VISITOR',
      isPhoneVerified: false,
      lgpdConsentAt: now,
      lgpdConsentVersion: '1.0',
      isActive: true,
      createdAt: now,
    };

    const newProfile: VisitorProfile = {
      ...mockVisitorProfile,
      id: `vis_${Date.now()}`,
      userId: newUser.id,
      visitorName: newUser.name,
      memberCode: `CD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      level: 'BRONZE',
      currentPoints: 100,
      lifetimePoints: 100,
      totalCheckIns: 0,
      totalStamps: 0,
    };

    const otpDispatch = await otpProviderAdapter.sendOtpCode(input.phone, '482910');

    return {
      user: newUser,
      profile: newProfile,
      otpDispatch,
    };
  }
}
