# Contratos de API e Domínio — Passaporte Digital Gamificado

Este documento estabelece o **contrato oficial de integração** entre as três frentes de desenvolvimento (**Dev 01**, **Dev 02** e **Dev 03**). Qualquer alteração nos formatos de payload ou assinaturas deve ser precedida de atualização neste documento e em `src/shared/types/domain.ts` e `src/shared/schemas/api.schemas.ts`.

---

## 1. Envelope Padrão de Resposta HTTP

Todas as rotas em `src/app/api/*` retornam o envelope JSON padronizado:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-11-13T23:00:00.000Z",
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

Em caso de erro (`4xx` ou `5xx`):

```json
{
  "success": false,
  "error": {
    "code": "GEOFENCE_OUT_OF_RANGE",
    "message": "Você está a 412m do Capim Dourado Shopping. O limite permitido para check-in é de 250m.",
    "details": {
      "distanceMeters": 412,
      "maxRadiusMeters": 250
    }
  }
}
```

---

## 2. Definição dos 13 Domínios Compartilhados

Os contratos TypeScript oficiais estão implementados em `src/shared/types/domain.ts`:

1. **`User`**: Identidade base (`id`, `name`, `email`, `phone`, `role`, `isPhoneVerified`, `lgpdConsentAt`).
2. **`VisitorProfile`**: Passaporte digital (`id`, `userId`, `memberCode`, `level`, `currentPoints`, `lifetimePoints`, `totalCheckIns`, `totalStamps`).
3. **`Store`**: Loja parceira (`id`, `slug`, `name`, `category`, `floor`, `unitNumber`, `description`, `checkInPoints`, `latitude`, `longitude`, `isActive`).
4. **`Campaign`**: Campanha promocional (`id`, `storeId`, `title`, `slug`, `description`, `bannerUrl`, `bonusMultiplier`, `status`, `startsAt`, `endsAt`).
5. **`CheckIn`**: Registro auditado de visita (`id`, `visitorId`, `storeId`, `checkInDate`, `latitude`, `longitude`, `distanceMeters`, `isWithinGeofence`, `status`, `pointsAwarded`, `createdAt`).
6. **`Stamp`**: Carimbo digital (`id`, `visitorId`, `storeId`, `checkInId`, `badgeTitle`, `category`, `earnedAt`).
7. **`Mission`**: Desafio gamificado (`id`, `code`, `title`, `description`, `frequency`, `targetType`, `targetCount`, `rewardPoints`, `currentCount`, `status`).
8. **`PointTransaction`**: Registro imutável do ledger (`id`, `visitorId`, `type`, `amount`, `balanceAfter`, `origin`, `referenceId`, `description`, `createdAt`).
9. **`Reward`**: Recompensa do catálogo (`id`, `storeId`, `storeName`, `title`, `description`, `rules`, `pointsCost`, `availableStock`, `voucherValidityHours`, `approvalStatus`).
10. **`Voucher`**: Cupom emitido (`id`, `code`, `qrPayload`, `visitorId`, `rewardId`, `storeId`, `pointsSpent`, `status`, `issuedAt`, `expiresAt`, `usedAt`, `validatedByOperatorId`).
11. **`Merchant`**: Gestor lojista (`id`, `userId`, `storeId`, `cnpj`, `jobTitle`, `isApproved`).
12. **`Operator`**: Operador de balcão (`id`, `userId`, `storeId`, `badgeNumber`, `canManageOffers`, `isActive`).
13. **`Administrator`**: Gestor do shopping (`id`, `userId`, `department`, `permissionLevel`).

---

## 3. Especificação dos Endpoints da API

### 3.1 `GET /api/stores` (Dev 01 — Funcionalidade 01)
- **Método HTTP:** `GET`
- **Autorização:** Pública (Nenhuma)
- **Query Params:**
  - `q` (string, opcional): Termo de busca por nome ou descrição.
  - `category` (string, opcional): Categoria da loja (`GASTRONOMIA`, `MODA`, `SERVICOS`, `LAZER`, `BELEZA`, `TECNOLOGIA`).
  - `featured` (`true` | `false`, opcional): Filtra lojas em destaque.
- **Corpo da Requisição:** N/A
- **Resposta Esperada (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "id": "store_01",
        "slug": "cafe-jalapao-gourmet",
        "name": "Café Jalapão Gourmet",
        "category": "GASTRONOMIA",
        "floor": "Piso 2",
        "unitNumber": "L-204",
        "description": "Cafeteria artesanal com grãos especiais e doces regionais do Tocantins.",
        "checkInPoints": 40,
        "activeRewardsCount": 2,
        "isFeatured": true
      }
    ],
    "banners": []
  }
}
```
- **Possíveis Erros:** `400 INVALID_QUERY_PARAMS`
- **Regras de Negócio:** Retorna apenas lojas com `isActive = true` e recompensas com `approvalStatus = APPROVED`.

---

### 3.2 `GET /api/stores/:slug` (Dev 01 — Funcionalidade 01)
- **Método HTTP:** `GET`
- **Autorização:** Pública
- **Parâmetros de Rota:** `slug` (string) — identificador amigável da loja.
- **Resposta Esperada (`200 OK`):** Dados completos da loja, lista de recompensas ativas e campanhas vigentes da loja.
- **Possíveis Erros:** `404 STORE_NOT_FOUND`
- **Regras de Negócio:** Não deve expor o `qrCodeToken` oficial da loja no payload público (evitando geração fraudulenta de QR Code remoto).

---

### 3.3 `POST /api/auth/register` (Dev 01 — Funcionalidade 02)
- **Método HTTP:** `POST`
- **Autorização:** Pública
- **Corpo da Requisição:**
```json
{
  "name": "Mariana Alves",
  "email": "mariana@exemplo.com.br",
  "phone": "+5563992001122",
  "password": "Password@2026",
  "lgpdConsent": true
}
```
- **Resposta Esperada (`201 Created`):** Define cookie `HttpOnly` `passaporte_token` e retorna dados do `User` e `VisitorProfile` recém-criado (com bônus de boas-vindas opcional auditado no ledger).
- **Possíveis Erros:**
  - `400 VALIDATION_ERROR` (LGPD não aceito ou dados inválidos)
  - `409 USER_ALREADY_EXISTS` (E-mail ou telefone já cadastrado)
- **Regras de Negócio:** Exige `lgpdConsent === true`, aplica hash `bcryptjs` na senha e cria automaticamente o `VisitorProfile` com nível inicial `BRONZE`.

---

### 3.4 `POST /api/auth/login` (Dev 01 — Funcionalidade 02)
- **Método HTTP:** `POST`
- **Autorização:** Pública
- **Corpo da Requisição:**
```json
{
  "identifier": "mariana@exemplo.com.br",
  "password": "Password@2026"
}
```
- **Resposta Esperada (`200 OK`):** Define cookie `HttpOnly` `passaporte_token` e retorna `{ user, redirectUrl }` de acordo com a `role` (`VISITOR -> /passaporte`, `MERCHANT/OPERATOR -> /lojista`, `ADMIN -> /admin`).
- **Possíveis Erros:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE`
- **Regras de Negócio:** Suporta login tanto por e-mail quanto por telefone no campo `identifier`.

---

### 3.5 `POST /api/checkins` (Dev 02 — Funcionalidade 04)
- **Método HTTP:** `POST`
- **Autorização:** `VISITOR` (Cookie JWT `HttpOnly`)
- **Corpo da Requisição:**
```json
{
  "qrCodeToken": "QR-CD-STORE-01-VERIFIED",
  "latitude": -10.184412,
  "longitude": -48.333648,
  "accuracyMeters": 18
}
```
- **Resposta Esperada (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "checkIn": {
      "id": "chk_01",
      "storeId": "store_01",
      "storeName": "Café Jalapão Gourmet",
      "distanceMeters": 42,
      "pointsAwarded": 40,
      "status": "VALID"
    },
    "stampEarned": {
      "id": "stp_01",
      "badgeTitle": "Explorador Café Jalapão"
    },
    "completedMissions": [],
    "newBalance": 680
  }
}
```
- **Possíveis Erros:**
  - `401 UNAUTHORIZED`
  - `404 INVALID_QR_TOKEN`
  - `409 DUPLICATE_DAILY_CHECKIN` (Já fez check-in nesta loja hoje)
  - `422 GEOFENCE_OUT_OF_RANGE` (Distância Haversine > 250m)
- **Regras de Negócio:**
  1. Valida se `qrCodeToken` pertence a uma loja ativa.
  2. Calcula distância Haversine até o ponto central do Capim Dourado Shopping (configurado em `SystemConfig`, padrão `-10.1845, -48.3337`, raio `250m`).
  3. Verifica se já existe `CheckIn` com `status = VALID` para o mesmo `visitorId`, `storeId` e `checkInDate`.
  4. Em transação única: grava o `CheckIn`, gera o `Stamp`, avalia `MissionProgress` e credita os pontos via `PointTransaction`.

---

### 3.6 `GET /api/visitor/passport` (Dev 01 & Dev 02 — Funcionalidades 03 e 05)
- **Método HTTP:** `GET`
- **Autorização:** `VISITOR`
- **Resposta Esperada (`200 OK`):** Retorna `VisitorProfile` completo, cartão de membro, resumo de carimbos conquistados (`stamps`), missões ativas com progresso (`missions`) e contagem de vouchers ativos.
- **Possíveis Erros:** `401 UNAUTHORIZED`

---

### 3.7 `GET /api/visitor/points` (Dev 02 — Funcionalidade 06)
- **Método HTTP:** `GET`
- **Autorização:** `VISITOR`
- **Query Params:** `type` (`CREDIT` | `DEBIT`, opcional), `page` (number, opcional).
- **Resposta Esperada (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "currentPoints": 640,
    "lifetimePoints": 1420,
    "level": "GOLD",
    "nextLevelPoints": 2000,
    "transactions": [
      {
        "id": "ptx_01",
        "type": "CREDIT",
        "amount": 40,
        "balanceAfter": 640,
        "origin": "CHECKIN",
        "referenceId": "chk_01",
        "description": "Check-in presencial: Café Jalapão Gourmet",
        "createdAt": "2026-11-13T18:30:00.000Z"
      }
    ]
  }
}
```
- **Possíveis Erros:** `401 UNAUTHORIZED`
- **Regras de Negócio:** Soma auditável; o saldo exibido deve coincidir com o `balanceAfter` da última transação registrada.

---

### 3.8 `GET /api/visitor/vouchers` (Dev 01 & Dev 03 — Funcionalidades 03 e 07)
- **Método HTTP:** `GET`
- **Autorização:** `VISITOR`
- **Query Params:** `status` (`ACTIVE` | `USED` | `EXPIRED`, opcional).
- **Resposta Esperada (`200 OK`):** Lista de vouchers do visitante contendo código, payload do QR Code, dados da recompensa, nome/localização da loja e timestamps de validade.
- **Possíveis Erros:** `401 UNAUTHORIZED`

---

### 3.9 `POST /api/rewards/:id/redeem` (Dev 03 — Funcionalidade 07)
- **Método HTTP:** `POST`
- **Autorização:** `VISITOR`
- **Parâmetros de Rota:** `id` (ID da recompensa)
- **Corpo da Requisição:** `{ "idempotencyKey": "uuid-opcional" }`
- **Resposta Esperada (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "voucher": {
      "id": "vch_99",
      "code": "VCH-CD-4821",
      "qrPayload": "PASSAPORTE-CD:VOUCHER:VCH-CD-4821",
      "status": "ACTIVE",
      "pointsSpent": 250,
      "issuedAt": "2026-11-13T20:00:00.000Z",
      "expiresAt": "2026-11-13T22:00:00.000Z"
    },
    "remainingPoints": 390
  }
}
```
- **Possíveis Erros:**
  - `400 INSUFFICIENT_POINTS`
  - `409 OUT_OF_STOCK`
  - `409 MAX_REDEMPTION_LIMIT_REACHED`
- **Regras de Negócio:** Decrementa estoque, debita pontos no ledger (`origin = REWARD_REDEMPTION`) e emite o voucher único em uma única transação ACID.

---

### 3.10 `POST /api/merchant/vouchers/validate` (Dev 03 — Funcionalidade 08)
- **Método HTTP:** `POST`
- **Autorização:** `MERCHANT` ou `OPERATOR`
- **Corpo da Requisição:**
```json
{
  "code": "VCH-CD-4821"
}
```
- **Resposta Esperada (`200 OK`):** Retorna detalhes do voucher, nome do visitante, título da recompensa, horário de expiração e flag `canConfirm: true | false`.
- **Possíveis Erros:**
  - `403 WRONG_STORE_VOUCHER` (Voucher pertence a outra loja do shopping)
  - `404 VOUCHER_NOT_FOUND`
  - `422 VOUCHER_ALREADY_USED`
  - `422 VOUCHER_EXPIRED`

---

### 3.11 `POST /api/merchant/vouchers/confirm` (Dev 03 — Funcionalidade 08)
- **Método HTTP:** `POST`
- **Autorização:** `MERCHANT` ou `OPERATOR`
- **Corpo da Requisição:**
```json
{
  "code": "VCH-CD-4821"
}
```
- **Resposta Esperada (`200 OK`):** Voucher atualizado com `status: "USED"`, `usedAt` preenchido e evento disparado no barramento SSE (`/api/realtime/vouchers`) para atualizar a tela do visitante instantaneamente.
- **Possíveis Erros:** `409 VOUCHER_ALREADY_USED`, `422 VOUCHER_EXPIRED`

---

### 3.12 `GET /api/admin/dashboard` (Dev 03 — Funcionalidade 09)
- **Método HTTP:** `GET`
- **Autorização:** `ADMIN`
- **Resposta Esperada (`200 OK`):** KPIs executivos do programa, parâmetros atuais de geofence, fila de aprovação de campanhas/ofertas, lojas cadastradas e últimos eventos de auditoria.
- **Possíveis Erros:** `401 UNAUTHORIZED`, `403 FORBIDDEN`
