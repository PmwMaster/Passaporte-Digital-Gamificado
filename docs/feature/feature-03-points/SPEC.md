# SPEC — Feature 03: Sistema de Pontos e Extrato Auditável / Ledger (F06)

| Campo | Valor |
| :--- | :--- |
| **Feature** | Feature 03 (`F06`) — Sistema de Pontos e Extrato (Ledger) |
| **Desenvolvedor** | Felipe (**DEV 02**) |
| **Arquivos sob Ownership** | `src/modules/points/**`, `src/app/(visitor)/extrato/**`, `src/app/api/visitor/points/**` |
| **Contrato Fornecido ao Time** | `PointsLedgerContract` (`PointsLedgerService.recordCredit`, `PointsLedgerService.recordDebit`, `PointsLedgerService.getStatement`) |

---

## 1. Arquitetura do Módulo (`src/modules/points/`)

```text
src/modules/points/
├── domain/
│   └── ledger-invariants.ts   # Validação de valores positivos, verificação de integridade contábil e idempotência
├── application/
│   └── points-ledger.service.ts # Implementação de recordCredit, recordDebit, getStatement e verifyLedgerIntegrity
└── index.ts                   # Exportação pública de PointsLedgerService e contratos
```

---

## 2. Contrato de Desacoplamento (`PointsLedgerContract`)

Conforme definido em `docs/TEAM_DIVISION.md` (§3), o módulo `points` (DEV 02) expõe a interface consumida pelo módulo `checkin` (F04), `gamification` (F05) e `rewards` (F07 — DEV 03):

```ts
export interface LedgerOperationInput {
  visitorId: string;
  amount: number;
  origin: PointTransactionOrigin; // 'CHECKIN' | 'MISSION' | 'REWARD_REDEMPTION' | 'PROMO_BONUS' | 'ADMIN_ADJUSTMENT'
  referenceId?: string;
  description: string;
}

export interface StatementSummary {
  currentPoints: number;
  lifetimePoints: number;
  level: PassportLevel;
  nextLevelPoints: number;
  totalCredits: number;
  totalDebits: number;
  isIntegrityValid: boolean;
  transactions: PointTransaction[];
}
```

---

## 3. Regras de Domínio e Invariantes Contábeis (RN-06)

1. **Validação de Valor Positivo:**
   - Se `!Number.isInteger(amount) || amount <= 0`, lança `Error('INVALID_POINT_AMOUNT')`.
2. **Idempotência por `(origin, referenceId)`:**
   - Se `referenceId` for informado em um crédito (`CHECKIN`, `MISSION`, `PROMO_BONUS`) e já existir uma `PointTransaction` para o mesmo `(visitorId, origin, referenceId)`, retorna a transação existente sem alterar o saldo novamente.
3. **Invariante de Crédito (`recordCredit`):**
   - `newBalance = currentPoints + amount`
   - `newLifetime = lifetimePoints + amount`
   - `level = GamificationService.calculateLevelByLifetimePoints(newLifetime)`
   - Registra `PointTransaction` com `type: 'CREDIT'` e `balanceAfter: newBalance`.
4. **Invariante de Débito (`recordDebit`):**
   - Se `currentPoints < amount`, lança `Error('INSUFFICIENT_POINTS')`.
   - `newBalance = currentPoints - amount` (`lifetimePoints` e `level` **não** diminuem).
   - Registra `PointTransaction` com `type: 'DEBIT'` e `balanceAfter: newBalance`.
5. **Auditoria de Integridade (`verifyLedgerIntegrity`):**
   - Confere se o `balanceAfter` da transação mais recente coincide com `VisitorProfile.currentPoints`.

---

## 4. Modelo de Dados Relacionado (`prisma/schema.prisma`)

```prisma
model PointTransaction {
  id           String                 @id @default(cuid())
  visitorId    String
  type         PointTransactionType   // CREDIT | DEBIT
  amount       Int
  balanceAfter Int
  origin       PointTransactionOrigin // CHECKIN | MISSION | REWARD_REDEMPTION | PROMO_BONUS | ADMIN_ADJUSTMENT
  referenceId  String?
  description  String
  createdAt    DateTime               @default(now())

  visitor      VisitorProfile         @relation(fields: [visitorId], references: [id], onDelete: Cascade)

  @@index([visitorId, createdAt])
}
```

---

## 5. Contrato de API (`GET /api/visitor/points`)

### Request
- **Método:** `GET /api/visitor/points`
- **Query Params Opcionais:**
  - `type`: `CREDIT` | `DEBIT`
  - `origin`: `CHECKIN` | `MISSION` | `REWARD_REDEMPTION` | `PROMO_BONUS` | `ADMIN_ADJUSTMENT`

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "currentPoints": 640,
    "lifetimePoints": 1420,
    "level": "GOLD",
    "nextLevelPoints": 3000,
    "totalCredits": 890,
    "totalDebits": 250,
    "isIntegrityValid": true,
    "transactions": [
      {
        "id": "ptx_01",
        "visitorId": "vis_01",
        "type": "CREDIT",
        "amount": 40,
        "balanceAfter": 640,
        "origin": "CHECKIN",
        "referenceId": "chk_01",
        "description": "Check-in presencial: Café Jalapão Gourmet",
        "createdAt": "2026-11-13T18:30:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-13T23:00:00.000Z",
    "total": 1
  }
}
```
