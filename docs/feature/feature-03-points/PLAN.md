# PLAN — Feature 03: Sistema de Pontos e Extrato Auditável / Ledger (F06)

| Campo | Valor |
| :--- | :--- |
| **Feature** | Feature 03 (`F06`) — `points` |
| **Desenvolvedor** | Felipe (**DEV 02**) |
| **Base** | [`PRD.md`](./PRD.md) e [`SPEC.md`](./SPEC.md) |
| **Status** | Planejado (pronto para *Start Implementation*) |

---

## 1. Sequência de Tarefas de Implementação

### Etapa 1 — Invariantes do Ledger e Serviço (`src/modules/points/`)
- [ ] **Tarefa 1.1:** Adicionar proteção de idempotência em `PointsLedgerService.recordCredit` por `(visitorId, origin, referenceId)` para impedir crédito duplicado do mesmo check-in ou missão.
- [ ] **Tarefa 1.2:** Enriquecer `PointsLedgerService.getStatement(typeFilter, originFilter)` para retornar `nextLevelPoints` (de `PASSPORT_LEVELS`), `totalCredits`, `totalDebits` e `isIntegrityValid`.
- [ ] **Tarefa 1.3:** Garantir compatibilidade total com `tests/integration/rewards-points.spec.ts` e com o módulo `rewards` (DEV 03).

### Etapa 2 — Rota de API (`src/app/api/visitor/points/route.ts`)
- [ ] **Tarefa 2.1:** Suportar os query params `type` (`CREDIT` | `DEBIT`) e `origin` em `GET /api/visitor/points`, retornando o payload completo do contrato (`currentPoints`, `lifetimePoints`, `level`, `nextLevelPoints`, `totalCredits`, `totalDebits`, `transactions`).

### Etapa 3 — Interface de Extrato (`src/app/(visitor)/extrato/page.tsx`)
- [ ] **Tarefa 3.1:** Tornar a tela `/extrato` interativa com filtros rápidos por tipo (**Todas**, **Entradas (+)**, **Saídas (-)**) e resumo de total ganho vs. total resgatado.
- [ ] **Tarefa 3.2:** Exibir badges semânticos por origem (`CHECKIN`, `MISSION`, `REWARD_REDEMPTION`, `PROMO_BONUS`) e indicador de integridade contábil do Ledger.

### Etapa 4 — Testes e Verificação
- [ ] **Tarefa 4.1:** Expandir os testes do Ledger validando: crédito normal, idempotência por `referenceId`, débito com saldo suficiente, bloqueio de débito com saldo insuficiente (`INSUFFICIENT_POINTS`) e preservação do nível após débito.
- [ ] **Tarefa 4.2:** Executar `npm run typecheck` sem erros.

---

## 2. Commits Planejados (Conventional Commits)

1. `feat(points): adiciona idempotencia por referencia e metricas contabeis no ledger`
2. `feat(points): adiciona filtro por origem e nextLevelPoints em GET /api/visitor/points`
3. `feat(points): adiciona filtros interativos de entradas e saidas na tela /extrato`
4. `test(points): adiciona testes de invariantes contabeis e idempotencia do ledger`
