// ==============================================================================
// TESTES UNITÁRIOS — FEATURE 03 (F06): SISTEMA DE PONTOS E INVARIANTES DO LEDGER
// ==============================================================================

import { PointsLedgerService } from '../../src/modules/points';

export function runPointsLedgerUnitTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  const initial = PointsLedgerService.getStatement();

  // Caso 1: Crédito válido incrementa saldo e mantém integridade
  const creditTx = PointsLedgerService.recordCredit({
    visitorId: 'vis_01',
    amount: 50,
    origin: 'PROMO_BONUS',
    referenceId: 'test_ref_unique_01',
    description: 'Teste unitário de crédito idempotente',
  });

  if (
    creditTx.balanceAfter === initial.currentPoints + 50 &&
    PointsLedgerService.getStatement().isIntegrityValid
  ) {
    passed++;
  } else {
    failed++;
  }

  // Caso 2: Idempotência por (visitorId, origin, referenceId) impede crédito duplicado
  const duplicateCreditTx = PointsLedgerService.recordCredit({
    visitorId: 'vis_01',
    amount: 50,
    origin: 'PROMO_BONUS',
    referenceId: 'test_ref_unique_01',
    description: 'Repetição com mesmo referenceId não deve somar novamente',
  });

  if (
    duplicateCreditTx.id === creditTx.id &&
    PointsLedgerService.getStatement().currentPoints === creditTx.balanceAfter
  ) {
    passed++;
  } else {
    failed++;
  }

  // Caso 3: Débito acima do saldo disponível deve lançar INSUFFICIENT_POINTS
  let insufficientThrown = false;
  try {
    PointsLedgerService.recordDebit({
      visitorId: 'vis_01',
      amount: 999999,
      origin: 'REWARD_REDEMPTION',
      description: 'Tentativa acima do saldo',
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_POINTS') {
      insufficientThrown = true;
    }
  }

  if (insufficientThrown) {
    passed++;
  } else {
    failed++;
  }

  return { passed, failed };
}
