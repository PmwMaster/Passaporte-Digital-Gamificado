# PLAN — Feature 02: Gamificação, Carimbos Digitais, Missões e Níveis (F05)

| Campo | Valor |
| :--- | :--- |
| **Feature** | Feature 02 (`F05`) — `gamification` |
| **Desenvolvedor** | Felipe (**DEV 02**) |
| **Base** | [`PRD.md`](./PRD.md) e [`SPEC.md`](./SPEC.md) |
| **Status** | Planejado (pronto para *Start Implementation*) |

---

## 1. Sequência de Tarefas de Implementação

### Etapa 1 — Motor de Missões e Níveis (`src/modules/gamification/`)
- [ ] **Tarefa 1.1:** Implementar helper `getLevelProgress(lifetimePoints)` em `GamificationService` retornando nível atual (`id`, `label`), `minLifetimePoints`, `nextLevelPoints` e percentual de avanço.
- [ ] **Tarefa 1.2:** Implementar `GamificationService.evaluateMissionsAfterCheckIn(checkIn, category)` que avalia todas as missões `IN_PROGRESS`, incrementa `currentCount`, muda o status para `COMPLETED` ao atingir `targetCount` e chama `PointsLedgerService.recordCredit` com `origin = 'MISSION'`.
- [ ] **Tarefa 1.3:** Expandir `GamificationService.listMissionsAndStamps()` para retornar também o catálogo completo de lojas parceiras (indicando quais já possuem carimbo conquistado e quais estão pendentes para completar a caderneta) e os dados de progresso de nível.

### Etapa 2 — Rota de API (`src/app/api/visitor/missions/route.ts`)
- [ ] **Tarefa 2.1:** Criar o endpoint `GET /api/visitor/missions` (previsto em `docs/TEAM_DIVISION.md` sob responsabilidade do DEV 02) com suporte a filtros opcionais `frequency` e `status`.
- [ ] **Tarefa 2.2:** Documentar o payload de `GET /api/visitor/missions` em `docs/API_CONTRACTS.md` (caso alinhado com o time).

### Etapa 3 — Interface de Missões e Carimbos (`src/app/(visitor)/missoes/page.tsx`)
- [ ] **Tarefa 3.1:** Adicionar no topo da tela `/missoes` o card de **Nível do Passaporte** com barra de progresso (`lifetimePoints` / `nextLevelPoints`) e resumo de carimbos (`X de 6 lojas carimbadas`).
- [ ] **Tarefa 3.2:** Exibir na **Caderneta de Carimbos** tanto os selos conquistados (coloridos, com data) quanto os espaços pontilhados das lojas parceiras ainda não visitadas (incentivando o visitante a fazer check-in nelas).

### Etapa 4 — Testes e Verificação
- [ ] **Tarefa 4.1:** Criar testes unitários validando: progressão de nível nas fronteiras (`0`, `500`, `1200`, `3000`), avanço de missão em check-in elegível, crédito único de bônus ao atingir 100% da meta e não duplicação em check-ins subsequentes.
- [ ] **Tarefa 4.2:** Executar `npm run typecheck` sem erros.

---

## 2. Commits Planejados (Conventional Commits)

1. `feat(gamification): implementa avaliador automatico de missoes e progresso de nivel`
2. `feat(gamification): cria rota GET /api/visitor/missions`
3. `feat(gamification): exibe caderneta completa de selos e barra de nivel em /missoes`
4. `test(gamification): adiciona testes de conclusao de missao e calculo de nivel`
