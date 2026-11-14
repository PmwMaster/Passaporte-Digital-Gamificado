# PRD — Feature 02: Gamificação, Carimbos Digitais, Missões e Níveis (F05)

| Campo | Valor |
| :--- | :--- |
| **Equipe / Projeto** | Taurus — Passaporte Digital Gamificado (Capim Dourado Shopping) |
| **Desenvolvedor Responsável** | Felipe (**DEV 02**) |
| **Feature / Módulo** | Feature 02 (`F05`) — `src/modules/gamification/` |
| **Rota de Interface** | `/missoes` (`src/app/(visitor)/missoes/page.tsx`) |
| **Rota de API** | `GET /api/visitor/missions` (`src/app/api/visitor/missions/route.ts`) |
| **Branch** | `feature/dev-02` (ou `feature/dev-02-gamification`) |

---

## 1. Problema e Objetivo de Produto

### Problema
Acumular pontos isoladamente não cria senso de coleção nem orienta o visitante a conhecer diferentes corredores, pisos e segmentos do shopping (*cross-visiting* entre gastronomia, moda, lazer e serviços).

### Objetivo
Transformar cada visita ao **Capim Dourado Shopping** em uma jornada visual de coleção por meio de uma **Caderneta de Carimbos Digitais**, **Missões Periódicas (Diárias, Semanais e Mensais)** que concedem bônus automáticos de pontos ao serem concluídas, e **Progressão de Níveis de Fidelidade** (*Bronze Cerrado*, *Prata Araguaia*, *Ouro Capim Dourado* e *Diamante Embaixador*).

---

## 2. Requisitos Funcionais da Feature

- **RF-05.1 (Concessão de Carimbos Digitais):** Emitir automaticamente um carimbo digital (`Stamp`) vinculado à loja visitada e à sua categoria (`GASTRONOMIA`, `MODA`, `LAZER`, `SERVICOS`, `BELEZA`, `TECNOLOGIA`) a cada check-in válido.
- **RF-05.2 (Caderneta Completa de Selos):** Exibir na tela `/missoes` tanto os carimbos já conquistados pelo visitante (com data e categoria) quanto os selos pendentes das demais lojas parceiras ativas, incentivando a completar a coleção.
- **RF-05.3 (Listagem de Missões Ativas):** Exibir os desafios ativos com frequência (`DAILY`, `WEEKLY`, `MONTHLY`, `SPECIAL`), chave do período vigente (`periodKey`), meta (`targetCount`), progresso atual (`currentCount`), percentual concluído e recompensa em pontos (`rewardPoints`).
- **RF-05.4 (Avaliação Automática e Bônus de Missão):** Atualizar automaticamente o progresso das missões elegíveis após cada check-in válido e, quando `currentCount` atingir `targetCount`, marcar a missão como `COMPLETED` e creditar o bônus no Ledger com `origin = 'MISSION'` (uma única vez por período).
- **RF-05.5 (Progressão de Níveis por `lifetimePoints`):** Calcular o nível do passaporte com base nos pontos acumulados na trajetória (`lifetimePoints`), garantindo que o visitante nunca seja rebaixado ao gastar pontos em recompensas:
  - **BRONZE (*Bronze Cerrado*):** `0` a `499` pts
  - **SILVER (*Prata Araguaia*):** `500` a `1.199` pts
  - **GOLD (*Ouro Capim Dourado*):** `1.200` a `2.999` pts
  - **DIAMOND (*Diamante Embaixador*):** `3.000+` pts

---

## 3. Histórias de Usuário

1. **Como visitante do shopping**, quero abrir minha caderneta de carimbos para ver quais lojas já visitei e quais ainda faltam para completar minha coleção.
2. **Como visitante engajado**, quero acompanhar barras de progresso das missões da semana e do mês para saber quantas visitas faltam para ganhar pontos bônus.
3. **Como visitante que acabou de completar a última visita de uma missão**, quero receber os pontos bônus automaticamente na hora do check-in sem precisar abrir chamado ou esperar apuração manual.
4. **Como membro fiel**, quero subir de nível conforme acumulo pontos ao longo do tempo sem perder meu nível *Ouro* ou *Diamante* quando troco meus pontos por cupons.

---

## 4. Telas e Componentes Relacionados (Protótipo)

- **Tela `/missoes` (`src/app/(visitor)/missoes/page.tsx`):**
  - Resumo de Nível atual do Passaporte + barra de evolução para o próximo nível.
  - Lista de **Missões e Desafios Ativos** com badge de frequência, período, bônus em pontos e barra de progresso (`IN_PROGRESS` / `COMPLETED ✓`).
  - **Caderneta de Carimbos** exibindo selos conquistados (destacados em dourado/esmeralda) e selos pendentes para desbloquear.
- **Integrações visuais:**
  - Abas **Carimbos** e **Missões** da Tela 03 (`prototipos/tela_03_meu_passaporte_cupons`).
  - Card de Missão em destaque no Box 2 da Vitrine Aberta (`prototipos/tela_01_vitrine_aberta`).

---

## 5. Critérios de Aceite

- [ ] **CA-01:** Todo check-in válido gera exatamente 1 carimbo (`Stamp`) com `storeId`, `storeName`, `category`, `badgeTitle` e `earnedAt`.
- [ ] **CA-02:** Ao realizar um check-in que atinge `targetCount` de uma missão `IN_PROGRESS`, o status da missão muda para `COMPLETED` e uma transação `CREDIT` com `origin = 'MISSION'` no valor de `rewardPoints` é registrada no Ledger.
- [ ] **CA-03:** Uma missão já `COMPLETED` no período vigente não credita o bônus uma segunda vez em novos check-ins do mesmo período.
- [ ] **CA-04:** A rota `GET /api/visitor/missions` retorna as missões ativas, a coleção de carimbos (conquistados + total de lojas) e os dados do nível atual do visitante.
- [ ] **CA-05:** O nível do visitante sobe automaticamente ao atingir `500`, `1.200` e `3.000` `lifetimePoints`, e permanece inalterado após débitos de resgate.
