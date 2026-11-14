# Regras de Negócio — Passaporte Digital Gamificado

Este documento consolida todas as regras de domínio implementadas na camada `Domain Layer` (`src/modules/*/domain/`) e compartilhadas pelos três desenvolvedores.

---

## 1. Regras de Check-in e Geofence (Módulo 04)

### RN-01: Validação Geográfica por Fórmula de Haversine
- Todo check-in exige as coordenadas `latitude` e `longitude` capturadas via HTML5 Geolocation API no momento da leitura do QR Code.
- A distância $d$ (em metros) entre o visitante $(\phi_1, \lambda_1)$ e o centro geográfico do Capim Dourado Shopping $(\phi_2, \lambda_2)$ é calculada no servidor utilizando a Fórmula de Haversine ($R = 6.371.000\text{ m}$):
  $$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cdot\cos(\phi_2)\cdot\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
  $$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right), \quad d = R \cdot c$$
- **Coordenada Oficial Padrão (Capim Dourado Shopping — Palmas/TO):**
  - Latitude: `-10.1845`
  - Longitude: `-48.3337`
  - Raio Padrão do Geofence: `250 metros` (configurável pelo Administrador no Módulo 09).
- Se $d > \text{raioConfigurado}$, o check-in é recusado com status `REJECTED_DISTANCE` e gravado para auditoria antifraude.

### RN-02: Limite Diário de Check-in por Estabelecimento
- Um visitante pode realizar **no máximo 1 (um) check-in válido por loja/evento por dia civil** (considerando o fuso horário local de Palmas - TO, `America/Araguaia`, UTC-3).
- Caso o visitante tente escanear novamente o QR Code da mesma loja no mesmo dia, o sistema retorna HTTP `409 Conflict` (`DUPLICATE_DAILY_CHECKIN`) e nenhuma pontuação adicional é creditada.
- O visitante pode realizar check-ins em **diferentes lojas** no mesmo dia sem bloqueio, estimulando a circulação pelo shopping.

---

## 2. Regras de Gamificação, Carimbos e Níveis (Módulo 05)

### RN-03: Concessão de Carimbos Digitais
- Cada check-in válido concede um carimbo digital vinculado à loja visitada e à sua respectiva categoria (`GASTRONOMIA`, `MODA`, `LAZER`, `SERVICOS`, `BELEZA`, `TECNOLOGIA`).

### RN-04: Avaliação Automática de Missões
- As missões são classificadas por janela de recorrência:
  - `DAILY`: Reiniciam diariamente às 00:00 (UTC-3).
  - `WEEKLY`: Reiniciam semanalmente (segunda a domingo).
  - `MONTHLY`: Reiniciam mensalmente no dia 1º.
  - `SPECIAL`: Vinculadas a campanhas sazonais do shopping.
- Quando `currentCount` atinge `targetCount`, o status da missão muda para `COMPLETED` e um crédito automático com `origin = MISSION` é gerado no ledger de pontos.

### RN-05: Progressão de Níveis do Passaporte
O nível do visitante é determinado pelos **pontos acumulados em sua trajetória (`lifetimePoints`)**, evitando que o visitante perca seu nível ao resgatar recompensas:
- **BRONZE:** `0` a `499` pontos acumulados.
- **SILVER (Prata):** `500` a `1.199` pontos acumulados.
- **GOLD (Ouro Capim Dourado):** `1.200` a `2.999` pontos acumulados.
- **DIAMOND (Embaixador Capim Dourado):** `3.000+` pontos acumulados.

---

## 3. Regras do Sistema de Pontos e Extrato (Módulo 06)

### RN-06: Imutabilidade e Rastreabilidade do Ledger
- Toda movimentação de pontos gera um registro imutável em `PointTransaction`.
- **Proibição Absoluta:** Nenhum módulo pode executar `UPDATE VisitorProfile SET currentPoints = ...` diretamente sem registrar simultaneamente o `PointTransaction` correspondente dentro de uma transação atômica.
- Invariante contábil obrigatória para toda transação:
  $$\text{balanceAfter} = \text{saldoAnterior} + (\text{CREDIT}) - (\text{DEBIT})$$
- O saldo disponível (`currentPoints`) nunca pode se tornar negativo ($\text{currentPoints} \ge 0$).

---

## 4. Regras de Recompensas, Vouchers e Portal do Lojista (Módulos 07 e 08)

### RN-07: Emissão e Resgate de Recompensas
- Para resgatar uma recompensa, o sistema verifica atomicamente:
  1. `Reward.isActive === true` e `Reward.approvalStatus === 'APPROVED'`.
  2. `Reward.availableStock > 0`.
  3. `VisitorProfile.currentPoints >= Reward.pointsCost`.
  4. Quantidade de vouchers já resgatados pelo visitante para aquela recompensa é menor que `Reward.maxPerVisitor`.
- O voucher recebe um código único legível (ex.: `VCH-CD-4821`) e uma data de expiração calculada a partir de `voucherValidityHours` (parametrização padrão de 2 horas para consumo imediato no shopping ou configurável por recompensa — ver `docs/DUVIDAS_E_PREMISSAS.md`).

### RN-08: Validação e Confirmação pelo Lojista
- Um operador ou lojista autenticado só pode validar e dar baixa em vouchers pertencentes à **sua própria loja** (`Voucher.storeId === Operator.storeId`).
- A operação de consulta (`validate`) apenas inspeciona o voucher sem consumi-lo.
- A operação de confirmação (`confirm`) altera o status de `ACTIVE` para `USED`, grava `usedAt` e `validatedByOperatorId` e emite imediatamente um evento Server-Sent Events (SSE) para atualizar a tela do visitante.

---

## 5. Regras de Governança Administrativa (Módulo 09)

### RN-09: Moderação de Campanhas e Ofertas
- Campanhas e recompensas cadastradas por lojistas no Portal do Lojista entram com status `PENDING_APPROVAL` (ou `PENDING`) e só aparecem na Vitrine Pública e no Catálogo após aprovação por um usuário com papel `ADMIN`.

### RN-10: Gestão de QR Codes Oficiais e Geofence
- Apenas administradores podem regenerar o `qrCodeToken` oficial de uma loja ou alterar as coordenadas e o raio do geofence do shopping. Todas essas alterações geram registro em `AuditLog`.
