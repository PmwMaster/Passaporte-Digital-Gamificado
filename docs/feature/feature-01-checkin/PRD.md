# PRD — Feature 01: Check-in e Validação por QR Code + GPS (F04)

| Campo | Valor |
| :--- | :--- |
| **Equipe / Projeto** | Taurus — Passaporte Digital Gamificado (Capim Dourado Shopping) |
| **Desenvolvedor Responsável** | Felipe (**DEV 02**) |
| **Feature / Módulo** | Feature 01 (`F04`) — `src/modules/checkin/` |
| **Rota de Interface** | `/checkin` (`src/app/(visitor)/checkin/page.tsx`) |
| **Rota de API** | `POST /api/checkins` (`src/app/api/checkins/route.ts`) |
| **Branch** | `feature/dev-02` (ou `feature/dev-02-checkin`) |

---

## 1. Problema e Objetivo de Produto

### Problema
Programas de fidelidade em shopping centers baseados em cadastro manual de notas fiscais geram filas, alto custo operacional e baixa adesão em visitas rápidas (como tomar um café ou passear). Por outro lado, um simples QR Code sem trava geográfica permitiria que usuários fotografassem a placa da loja e pontuassem de casa.

### Objetivo
Permitir que o visitante escaneie o QR Code oficial exposto no balcão das lojas e eventos do **Capim Dourado Shopping** diretamente pela câmera do navegador e receba seus pontos e carimbo instantaneamente, garantindo presença física real por meio de **geolocalização (Fórmula de Haversine em raio de 250 m)** e **limite de 1 check-in válido por estabelecimento por dia civil**.

---

## 2. Requisitos Funcionais da Feature

- **RF-04.1 (Leitura de QR Code Oficial):** Ler o token do QR Code da loja/evento pela câmera do navegador (`html5-qrcode`) ou via seletor de demonstração em ambiente de homologação.
- **RF-04.2 (Captura de Coordenadas GPS):** Capturar `latitude`, `longitude` e `accuracy` (precisão em metros) via HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`) no momento do check-in.
- **RF-04.3 (Validação Geográfica Haversine 250 m):** Calcular no servidor a distância esférica entre o visitante e a coordenada oficial do Capim Dourado Shopping (`-10.1845, -48.3337`), aprovando apenas leituras dentro do raio configurado (padrão `250m`).
- **RF-04.4 (Trava Diária por Estabelecimento):** Permitir no máximo **1 check-in válido por visitante, por loja/evento, por dia civil** no fuso horário de Palmas - TO (`America/Araguaina`, UTC-3), liberando check-ins em outras lojas no mesmo dia.
- **RF-04.5 (Auditoria Antifraude):** Registrar todas as tentativas de check-in — tanto aprovadas (`VALID`) quanto recusadas (`REJECTED_DISTANCE`, `REJECTED_DUPLICATE`, `REJECTED_QR`) — para auditoria de segurança.
- **RF-04.6 (Orquestração de Recompensa da Visita):** Ao aprovar o check-in, disparar atomicamente a concessão do carimbo digital (Feature 02), a avaliação de progresso das missões ativas (Feature 02) e o crédito dos pontos da visita no Ledger (Feature 03).

---

## 3. Histórias de Usuário

1. **Como visitante no balcão de uma loja parceira**, quero apontar a câmera do meu celular para o totem de QR Code e confirmar minha localização para ganhar imediatamente os pontos e o carimbo daquela loja.
2. **Como visitante fora do shopping**, quero receber uma mensagem clara informando a minha distância atual até o shopping e o limite de 250 m caso eu tente escanear um QR Code longe do empreendimento.
3. **Como visitante que já carimbou uma loja hoje**, quero ser avisado de que já pontuei naquele local hoje e ser convidado a visitar outras lojas parceiras do shopping.
4. **Como lojista e administração do shopping**, quero ter certeza de que ninguém pontua sem estar fisicamente no shopping nem repete leituras seguidas no mesmo balcão no mesmo dia.

---

## 4. Telas e Componentes Relacionados (Protótipo)

- **Tela `/checkin` (`src/app/(visitor)/checkin/page.tsx`):**
  - Moldura de leitura óptica do QR Code (`html5-qrcode`) + seletor rápido para simulação/apresentação à banca.
  - Botão de captura de GPS real do navegador e botões de simulação (*Dentro do Shopping ~12m* vs. *Fora do Geofence > 250m*).
  - Card de confirmação exibindo: nome da loja, distância calculada em metros, pontos ganhos, carimbo desbloqueado, missões atualizadas e novo saldo total.
- **Atalhos integrados nas demais telas:**
  - Botão central **"📷 Escanear"** na barra inferior do visitante e no Cartão de Membro (`prototipos/tela_03_meu_passaporte_cupons`).
  - Card **"Loja do Passaporte — Fazer Check-in (+pts)"** na página da loja (`prototipos/havanna_caf_ofertas_e_cupons`).

---

## 5. Critérios de Aceite

- [ ] **CA-01:** Leitura de QR Code de loja ativa dentro do raio de 250 m retorna HTTP `201 Created`, grava `CheckIn` com `status = 'VALID'`, gera 1 `Stamp` e credita os pontos da loja no Ledger.
- [ ] **CA-02:** Tentativa com coordenada acima de 250 m retorna HTTP `422 GEOFENCE_OUT_OF_RANGE` informando a distância exata calculada (`distanceMeters`) e grava tentativa com `status = 'REJECTED_DISTANCE'` e `pointsAwarded = 0`.
- [ ] **CA-03:** Segunda tentativa na mesma loja no mesmo dia civil (fuso de Palmas, UTC-3) retorna HTTP `409 DUPLICATE_DAILY_CHECKIN` e não credita novos pontos.
- [ ] **CA-04:** O mesmo visitante consegue fazer check-in válido em uma **segunda loja diferente** no mesmo dia.
- [ ] **CA-05:** QR Code inexistente ou de loja inativa retorna HTTP `404 INVALID_QR_TOKEN`.
