# PLAN — Feature 01: Check-in e Validação por QR Code + GPS (F04)

| Campo | Valor |
| :--- | :--- |
| **Feature** | Feature 01 (`F04`) — `checkin` |
| **Desenvolvedor** | Felipe (**DEV 02**) |
| **Base** | [`PRD.md`](./PRD.md) e [`SPEC.md`](./SPEC.md) |
| **Status** | ✅ Concluído (arquivos locais prontos para revisão) |

---

## 1. Sequência de Tarefas de Implementação

### Etapa 1 — Regras de Domínio e Fuso Horário (`src/modules/checkin/`)
- [x] **Tarefa 1.1:** Implementar helper `getLocalCheckInDate(date?: Date)` usando `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Araguaina' })` para garantir que a trava diária respeite o fuso horário de Palmas (UTC-3).
- [x] **Tarefa 1.2:** Adicionar validação opcional de `accuracyMeters` (limite de `150m`) no serviço de check-in, retornando `422 GPS_LOW_ACCURACY` quando a precisão do GPS for insuficiente.
- [x] **Tarefa 1.3:** Gravar no histórico de `CheckIn` as tentativas recusadas por distância (`REJECTED_DISTANCE`) e por repetição no mesmo dia (`REJECTED_DUPLICATE`) com `pointsAwarded: 0`, atendendo à regra de auditoria antifraude (RF-04.5).

### Etapa 2 — Integração com Gamificação e Pontos (`src/modules/checkin/index.ts`)
- [x] **Tarefa 2.1:** Integrar `CheckInService.performCheckIn` com `GamificationService.evaluateMissionsAfterCheckIn(...)` logo após conceder o carimbo e creditar os pontos da visita.
- [x] **Tarefa 2.2:** Incluir o array `completedMissions` e o `newBalance` atualizado (somando pontos do check-in + eventuais bônus de missões concluídas) no payload de retorno de `performCheckIn`.
- [x] **Tarefa 2.3:** Expor método `CheckInService.listRecentCheckIns(visitorId)` para permitir que a tela `/checkin` mostre as últimas leituras validadas/rejeitadas.

### Etapa 3 — Rota de API (`src/app/api/checkins/route.ts`)
- [x] **Tarefa 3.1:** Ler a sessão atual via `getCurrentSession()` (com fallback para o perfil de demonstração quando em modo protótipo) e repassar `visitorId` e `accuracyMeters` para `CheckInService.performCheckIn`.
- [x] **Tarefa 3.2:** Garantir que todos os códigos HTTP (`201`, `400`, `404`, `409`, `422`) sigam o envelope JSON oficial de `docs/API_CONTRACTS.md`.

### Etapa 4 — Interface do Visitante (`src/app/(visitor)/checkin/page.tsx`)
- [x] **Tarefa 4.1:** Aprimorar a tela `/checkin` com feedback visual detalhado do resultado: card do carimbo ganho, lista de missões que avançaram/concluíram no check-in e histórico recente de tentativas na sessão.
- [x] **Tarefa 4.2:** Manter os controles rápidos de demonstração para a banca (*Usar GPS Real do Navegador*, *Simular Dentro do Shopping ~12m*, *Simular Fora do Geofence > 250m*).

### Etapa 5 — Testes e Verificação
- [x] **Tarefa 5.1:** Expandir `tests/unit/haversine.spec.ts` com casos de borda (`0m`, `250m` exatos, `251m`) e testes do `CheckInService` (sucesso, fora do raio, duplicado no mesmo dia, loja diferente no mesmo dia).
- [x] **Tarefa 5.2:** Executar `npm run typecheck` para validar tipagem sem erros.

---

## 2. Commits Planejados (Conventional Commits)

1. `feat(checkin): aplica fuso America/Araguaina e auditoria de tentativas recusadas`
2. `feat(checkin): integra avaliacao automatica de missoes no retorno do check-in`
3. `feat(checkin): aprimora tela de check-in com resumo de carimbo e missoes`
4. `test(checkin): adiciona testes de geofence, trava diaria e antifraude`
