# SPEC — Feature 02: Gamificação, Carimbos Digitais, Missões e Níveis (F05)

| Campo | Valor |
| :--- | :--- |
| **Feature** | Feature 02 (`F05`) — Gamificação, Carimbos, Missões e Níveis |
| **Desenvolvedor** | Felipe (**DEV 02**) |
| **Arquivos sob Ownership** | `src/modules/gamification/**`, `src/app/(visitor)/missoes/**`, `src/app/api/visitor/missions/**` |
| **Dependências Consumidas** | `PASSPORT_LEVELS` (`src/shared/constants`), `PointsLedgerService` (`src/modules/points`) |

---

## 1. Arquitetura do Módulo (`src/modules/gamification/`)

```text
src/modules/gamification/
├── domain/
│   ├── level-calculator.ts    # Cálculo de nível (BRONZE, SILVER, GOLD, DIAMOND) e pontos restantes para o próximo nível
│   ├── period-key.ts          # Geração de periodKey (YYYY-MM-DD, YYYY-Www, YYYY-MM) no fuso America/Araguaina
│   └── mission-evaluator.ts   # Regras de elegibilidade por MissionTargetType (CHECKIN_COUNT, CATEGORY_VARIETY, SPECIFIC_STORE)
├── application/
│   └── gamification.service.ts # Concessão de carimbos, avaliação automática de missões e consulta consolidada
└── index.ts                   # Exportação pública de GamificationService
```

---

## 2. Regras de Domínio e Algoritmos

### 2.1 Cálculo de Nível e Progresso (RN-05)
Baseado em `PASSPORT_LEVELS` (`src/shared/constants/index.ts`):
- `lifetimePoints >= 3000` → `DIAMOND` (*Diamante Embaixador*)
- `lifetimePoints >= 1200` → `GOLD` (*Ouro Capim Dourado*, próximo nível em `3000`)
- `lifetimePoints >= 500` → `SILVER` (*Prata Araguaia*, próximo nível em `1200`)
- `lifetimePoints < 500` → `BRONZE` (*Bronze Cerrado*, próximo nível em `500`)

### 2.2 Avaliação Automática de Missões pós Check-in (RN-04)
Quando `GamificationService.evaluateMissionsAfterCheckIn(checkIn, category)` é chamado:
1. Seleciona todas as missões com `status === 'IN_PROGRESS'`.
2. Verifica se o check-in é elegível para cada missão conforme `targetType`:
   - `CHECKIN_COUNT`: qualquer check-in válido incrementa o progresso (ou da categoria `targetCategory`, quando definida).
   - `CATEGORY_VARIETY`: verifica se `targetCategory` é compatível com a categoria da loja visitada (ou conta lojas distintas daquela categoria no período).
   - `SPECIFIC_STORE`: verifica correspondência com a loja/campanha alvo.
3. Incrementa `currentCount = Math.min(mission.targetCount, mission.currentCount + 1)`.
4. Se `currentCount >= mission.targetCount` e o status anterior era `IN_PROGRESS`:
   - Atualiza `mission.status = 'COMPLETED'`.
   - Chama `PointsLedgerService.recordCredit` com:
     - `amount: mission.rewardPoints`
     - `origin: 'MISSION'`
     - `referenceId: mission.id`
     - `description: 'Bônus de missão concluída: ' + mission.title`
   - Adiciona a missão ao array `completedMissions` retornado ao `CheckInService`.

---

## 3. Modelos de Dados Relacionados (`prisma/schema.prisma`)

```prisma
model Stamp {
  id         String         @id @default(cuid())
  visitorId  String
  storeId    String
  checkInId  String
  badgeTitle String
  category   StoreCategory
  earnedAt   DateTime       @default(now())
}

model Mission {
  id             String            @id @default(cuid())
  code           String            @unique
  title          String
  description    String            @db.Text
  frequency      MissionFrequency  // DAILY | WEEKLY | MONTHLY | SPECIAL
  targetType     MissionTargetType // CHECKIN_COUNT | CATEGORY_VARIETY | SPECIFIC_STORE
  targetCategory StoreCategory?
  targetCount    Int
  rewardPoints   Int
  isActive       Boolean           @default(true)
}

model MissionProgress {
  id           String        @id @default(cuid())
  visitorId    String
  missionId    String
  currentCount Int           @default(0)
  status       MissionStatus @default(IN_PROGRESS) // IN_PROGRESS | COMPLETED | EXPIRED
  periodKey    String
  completedAt  DateTime?

  @@unique([visitorId, missionId, periodKey])
}
```

---

## 4. Contrato de API (`GET /api/visitor/missions`)

### Request
- **Método:** `GET /api/visitor/missions`
- **Query Params Opcionais:** `frequency` (`DAILY` | `WEEKLY` | `MONTHLY` | `SPECIAL`), `status` (`IN_PROGRESS` | `COMPLETED`).

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "level": "GOLD",
    "levelLabel": "Ouro Capim Dourado",
    "lifetimePoints": 1420,
    "nextLevelPoints": 3000,
    "stamps": [
      {
        "id": "stp_01",
        "visitorId": "vis_01",
        "storeId": "store_01",
        "storeName": "Café Jalapão Gourmet",
        "checkInId": "chk_01",
        "badgeTitle": "Explorador Café Jalapão",
        "category": "GASTRONOMIA",
        "earnedAt": "2026-11-12T17:30:00.000Z"
      }
    ],
    "stampCatalog": {
      "collectedStoreIds": ["store_01", "store_02"],
      "totalPartnerStores": 6
    },
    "missions": [
      {
        "id": "mis_01",
        "code": "DAILY_CHECKIN_01",
        "title": "Visita Premiada do Dia",
        "description": "Realize 1 check-in presencial em qualquer loja parceira hoje.",
        "frequency": "DAILY",
        "targetType": "CHECKIN_COUNT",
        "targetCount": 1,
        "rewardPoints": 30,
        "currentCount": 1,
        "status": "COMPLETED",
        "periodKey": "2026-11-13"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-13T23:00:00.000Z"
  }
}
```
