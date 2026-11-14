# PRD — Feature 03: Sistema de Pontos e Extrato Auditável / Ledger (F06)

| Campo | Valor |
| :--- | :--- |
| **Equipe / Projeto** | Taurus — Passaporte Digital Gamificado (Capim Dourado Shopping) |
| **Desenvolvedor Responsável** | Felipe (**DEV 02**) |
| **Feature / Módulo** | Feature 03 (`F06`) — `src/modules/points/` |
| **Rota de Interface** | `/extrato` (`src/app/(visitor)/extrato/page.tsx`) |
| **Rota de API** | `GET /api/visitor/points` (`src/app/api/visitor/points/route.ts`) |
| **Branch** | `feature/dev-02` (ou `feature/dev-02-points`) |

---

## 1. Problema e Objetivo de Produto

### Problema
Em programas de pontos onde múltiplos eventos somam e subtraem créditos (check-ins nas lojas, bônus de missões, bônus de boas-vindas e resgates de cupons), atualizar apenas um número de saldo no cadastro gera inconsistências contábeis, falta de transparência para o cliente e risco de saldo negativo em cliques simultâneos.

### Objetivo
Fornecer um **Razão Contábil Imutável (*Points Ledger*)** onde toda movimentação de pontos (`CREDIT` ou `DEBIT`) registra obrigatoriamente a origem, o valor e o saldo resultante (`balanceAfter`), além de entregar ao visitante uma tela de **Extrato Auditável** com filtros por tipo e origem.

---

## 2. Requisitos Funcionais da Feature

- **RF-06.1 (Operações de Crédito e Débito):** Registrar créditos (`CHECKIN`, `MISSION`, `PROMO_BONUS`, `ADMIN_ADJUSTMENT`) e débitos (`REWARD_REDEMPTION`, `ADMIN_ADJUSTMENT`) validando sempre `amount > 0`.
- **RF-06.2 (Ledger Imutável e Rastreável):** Gravar em cada `PointTransaction`: `id`, `visitorId`, `type` (`CREDIT` | `DEBIT`), `amount`, `balanceAfter`, `origin`, `referenceId`, `description` e `createdAt`.
- **RF-06.3 (Invariante Contábil e Proibição de Saldo Negativo):**
  - Proibir qualquer alteração direta de `VisitorProfile.currentPoints` fora do `PointsLedgerService`.
  - Garantir que `balanceAfter = saldoAnterior + (CREDIT) - (DEBIT)` e que `currentPoints >= 0` sempre (recusando débitos com `INSUFFICIENT_POINTS` quando o saldo for menor que o custo).
- **RF-06.4 (Idempotência de Créditos por Referência):** Impedir que o mesmo evento (`origin` + `referenceId`, como um mesmo check-in ou uma mesma missão concluída) credite pontos em duplicidade.
- **RF-06.5 (Extrato Filtrável para o Visitante):** Exibir na rota `/extrato` e em `GET /api/visitor/points` o saldo atual, os pontos acumulados na vida (`lifetimePoints`), o resumo de ganhos vs. gastos e a lista de transações filtrável por **Todos**, **Entradas (`CREDIT`)** e **Saídas (`DEBIT`)**.

---

## 3. Histórias de Usuário

1. **Como visitante do shopping**, quero consultar meu extrato completo de pontos para entender exatamente quanto ganhei em cada loja visitada ou missão cumprida e quanto gastei em cada voucher resgatado.
2. **Como visitante**, quero filtrar meu extrato apenas por *Ganhos* ou apenas por *Gastos* para conferir rapidamente minhas últimas trocas.
3. **Como Desenvolvedor 03 (Módulo de Recompensas)**, quero consumir um serviço único e seguro (`PointsLedgerService.recordDebit`) para debitar pontos no ato do resgate de um cupom sem precisar manipular a tabela de transações manualmente.
4. **Como auditor do programa do shopping**, quero que o saldo atual de qualquer visitante seja matematicamente igual ao `balanceAfter` da sua última transação e à soma algébrica de todo o seu histórico.

---

## 4. Telas e Componentes Relacionados (Protótipo)

- **Tela `/extrato` (`src/app/(visitor)/extrato/page.tsx`):**
  - 3 KPIs no topo: **Saldo Disponível para Resgate (`currentPoints`)**, **Pontuação Acumulada (`lifetimePoints` + Nível)** e **Resumo Contábil (Total de Créditos vs. Total de Débitos)**.
  - Botões de filtro rápido: **Todas as Movimentações** · **Entradas (+ Créditos)** · **Saídas (- Débitos)**.
  - Tabela/Linha do tempo de movimentações com data/hora, badge de origem (`CHECKIN`, `MISSION`, `REWARD_REDEMPTION`, `PROMO_BONUS`), descrição auditada, valor (`+` verde / `-` vermelho) e coluna **Saldo Após (`balanceAfter`)**.
- **Integrações:**
  - Aba **Extrato** da Tela 03 (`prototipos/tela_03_meu_passaporte_cupons`).
  - Link **"Extrato"** na seção *Trocar por Pontos* da página da loja (`prototipos/havanna_caf_ofertas_e_cupons`).

---

## 5. Critérios de Aceite

- [ ] **CA-01:** `PointsLedgerService.recordCredit` incrementa `currentPoints` e `lifetimePoints`, recalcula `VisitorProfile.level` e cria `PointTransaction` com `balanceAfter` exato.
- [ ] **CA-02:** `PointsLedgerService.recordDebit` decrementa apenas `currentPoints` (preservando `lifetimePoints` e `level`) e lança erro `INSUFFICIENT_POINTS` se `currentPoints < amount`.
- [ ] **CA-03:** Chamadas repetidas de `recordCredit` com o mesmo par `(origin, referenceId)` retornam a transação já existente sem duplicar pontos.
- [ ] **CA-04:** `GET /api/visitor/points?type=CREDIT` e `GET /api/visitor/points?type=DEBIT` filtram corretamente as transações mantendo os totais consistentes.
- [ ] **CA-05:** Na tela `/extrato`, o visitante consegue alternar entre *Todas*, *Entradas* e *Saídas* sem recarregar a página.
