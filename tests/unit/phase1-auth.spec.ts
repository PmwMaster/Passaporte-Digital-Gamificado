// ==============================================================================
// TESTES UNITÁRIOS DA FASE 1 — AUTENTICAÇÃO, CADASTRO (+50 PTS), JWT & OTP
// ==============================================================================

import { passwordStrengthSchema } from '@/shared/schemas/api.schemas';
import {
  decodeSessionToken,
  encodeSessionToken,
} from '@/infrastructure/authentication/session';
import { WELCOME_BONUS_POINTS } from '@/modules/authentication';

export function runPhase1AuthChecks() {
  const weakPassword = passwordStrengthSchema.safeParse('12345678');
  const strongPassword = passwordStrengthSchema.safeParse('Capim@2026');

  const token = encodeSessionToken({
    userId: 'usr_test_01',
    name: 'Teste Fase 1',
    email: 'teste@capimdourado.com.br',
    role: 'VISITOR',
    issuedAt: Date.now(),
  });
  const decoded = decodeSessionToken(token);
  const tampered = decodeSessionToken(`${token}x`);

  return {
    rn02WelcomeBonusIs50: WELCOME_BONUS_POINTS === 50,
    rn10RejectsWeakPassword: weakPassword.success === false,
    rn10AcceptsStrongPassword: strongPassword.success === true,
    jwtRoundtripValid: decoded?.userId === 'usr_test_01',
    jwtRejectsTampering: tampered === null,
  };
}
