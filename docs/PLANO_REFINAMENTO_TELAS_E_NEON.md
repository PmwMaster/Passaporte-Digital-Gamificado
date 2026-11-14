# Plano de Refinamento Tela a Tela & Conexão Real (Neon PostgreSQL)

> **Diagnóstico Realista:**
> Atualmente o WebApp está no ar na Vercel (`https://passaporteshopping.vercel.app`), mas **apenas o módulo de Autenticação** grava no Neon PostgreSQL. As demais telas (`/`, `/passaporte`, `/checkin`, `/missoes`, `/extrato`, `/recompensas`, `/vouchers`, `/lojista`, `/admin`) ainda leem arrays estáticos em memória (`mock-data.ts`) direto no navegador.
> Por isso:
> 1. Se você faz check-in em `/checkin`, o saldo não sobe de verdade quando você recarrega `/passaporte` ou `/recompensas`.
> 2. Se você resgata um voucher em `/recompensas`, ele não aparece persistido para o lojista dar baixa em `/lojista`.
> 3. Se o Admin cria uma loja ou aprova uma oferta em `/admin`, ela não aparece na Vitrine (`/`) após atualizar a página.
> 4. O menu superior mostra todas as telas misturadas (Visitante, Lojista e Admin ao mesmo tempo), gerando ambiguidade sobre "quem sou eu no sistema agora".

---

## Arquitetura da Solução (Conexão 100% Funcional no Neon via HTTP)

Unificaremos todas as tabelas e sementes iniciais (`seed`) diretamente em `src/infrastructure/database/neon.ts` usando `@neondatabase/serverless` para que **100% das telas leiam e gravem no banco Neon PostgreSQL**:

- `app_users` e `app_visitor_profiles` (Usuários, Nível Bronze/Prata/Ouro, Saldo de Pontos real)
- `app_stores` (Lojas Parceiras, Piso, Categoria, Pontos por Check-in, Token QR Code)
- `app_campaigns` (Campanhas Sazonais e Multiplicadores)
- `app_rewards` (Recompensas/Ofertas, Custo em Pontos, Estoque Real, Status de Aprovação)
- `app_check_ins` e `app_stamps` (Check-ins presenciais validados e Carimbos conquistados)
- `app_point_transactions` (Extrato contábil real de cada crédito e débito)
- `app_vouchers` (Cupons emitidos no resgate e validados/baixados pelo Lojista)
- `app_settings` (Coordenadas GPS e Raio de Geofence editável pelo Admin)

---

## Roteiro de Refinamento Tela por Tela (4 Blocos Rápidos)

### 🔹 Bloco 1: Barra de Navegação Inteligente + Autenticação (`/login`, `/cadastro`, `/verificar-otp`)
- **O que está ambíguo hoje:** O topo mostra botões de Visitante, Lojista e Admin todos juntos, sem mostrar quem está logado, qual o saldo atual de pontos do cliente ou um botão claro de "Sair / Trocar Perfil".
- **Como vai ficar:**
  - `TopEnvironmentBar` passa a buscar `/api/auth/me` automaticamente: mostra o **nome do usuário logado**, o **papel atual** (`Visitante • 640 pts`, `Lojista`, `Admin`), destaca as telas daquele perfil e oferece um seletor rápido de demonstração + botão de Logout.
  - Fluxo `/cadastro` → `/verificar-otp` → `/passaporte` cria o usuário no Neon com +50 pts e já entra logado.

### 🔹 Bloco 2: Vitrine Pública (`/`, `/lojas/[slug]`) + Painel Admin (`/admin`) Conectados no Neon
- **O que está ambíguo hoje:** A Home (`/`) lê lojas estáticas do `mock-data.ts`. Se o Admin cadastra uma loja nova em `/admin`, ela some ao dar F5.
- **Como vai ficar:**
  - `GET /api/stores` e `GET /api/stores/[slug]` passam a consultar a tabela `app_stores`, `app_campaigns` e `app_rewards` no Neon (com seed automático das lojas do Passe Dourado na primeira execução).
  - Visual da Vitrine (`/`) refinado com cards visuais ricos (fotos/ícones de categoria, piso, selo de pontos, busca instantânea e filtro de categorias).
  - Quando o Admin cria uma loja em `/admin` ou aprova uma oferta, ela grava em `app_stores` / `app_rewards` no Neon e aparece imediatamente na Vitrine Pública (`/`).

### 🔹 Bloco 3: Jornada Completa do Visitante (`/passaporte`, `/checkin`, `/missoes`, `/extrato`) no Neon
- **O que está ambíguo hoje:** Fazer check-in em `/checkin` não atualiza de forma persistente os carimbos em `/passaporte`, as barras de progresso em `/missoes` nem o extrato em `/extrato`.
- **Como vai ficar:**
  - **Tela `/checkin`:** Câmera real (`html5-qrcode`) + seletor de QR Code da loja + botão GPS real/simulado. Ao confirmar o check-in, grava em `app_check_ins`, `app_stamps` e `app_point_transactions` no Neon, e soma os pontos em `app_visitor_profiles` (atualizando o nível Bronze → Prata → Ouro se atingir a meta).
  - **Tela `/passaporte`:** Lê os dados reais do visitante no Neon, exibe o Cartão de Membro dourado com QR Code real, carimbos reais conquistados e vouchers ativos.
  - **Telas `/missoes` e `/extrato`:** Calculam o progresso das missões e listam o histórico de transações reais gravadas no Neon.

### 🔹 Bloco 4: Ciclo de Recompensas (`/recompensas`, `/vouchers`) ↔ Portal do Lojista (`/lojista`) no Neon
- **O que está ambíguo hoje:** Resgatar uma recompensa em `/recompensas` só altera o estado local da página. Quando você abre `/vouchers` ou `/lojista`, o voucher recém-criado não está lá.
- **Como vai ficar:**
  - **Tela `/recompensas`:** Lista as ofertas `APPROVED` do banco Neon e o saldo real do visitante. Ao clicar em **"Resgatar Agora"**, desconta os pontos do visitante no Neon, reduz `available_stock` em `app_rewards`, grava o novo voucher (`VCH-CD-XXXX`) em `app_vouchers` e leva o usuário para `/vouchers`.
  - **Tela `/vouchers`:** Exibe os vouchers reais do visitante vindos do Neon (`ACTIVE` e `USED`) com **QR Code real escaneável** e código copiável com 1 clique.
  - **Tela `/lojista`:** O lojista digita (ou clica num voucher ativo da fila da loja) e dá **"Confirmar Utilização no Balcão"**: o status muda para `USED` no Neon (`app_vouchers`), atualizando a carteira do visitante e os indicadores da loja.
