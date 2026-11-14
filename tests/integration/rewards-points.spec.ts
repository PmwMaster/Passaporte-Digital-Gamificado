// ==============================================================================
// TESTE DE INTEGRAÇÃO DE REFERÊNCIA — CONTRATO ENTRE PONTOS (DEV 02) E REWARDS (DEV 03)
// ==============================================================================

import { PointsLedgerService } from '@/modules/points';
import { RewardsCatalogService } from '@/modules/rewards';

export function runLedgerAndRedemptionIntegrationCheck() {
  const before = PointsLedgerService.getStatement().currentPoints;
  const redemption = RewardsCatalogService.redeemReward('rew_01');
  const after = PointsLedgerService.getStatement().currentPoints;

  return {
    redemptionOk: redemption.ok,
    ledgerUpdatedAtomically: redemption.ok ? after === before - 160 : after === before,
  };
}
