# 🛍️ Passaporte Digital Gamificado — Plataforma de engajamento, experiências e fidelização de visitantes

> **Desafio  — Engajamento e Fidelização de Visitantes:** Transformar visitas pontuais ao shopping center em um relacionamento contínuo e recorrente através de um **Passaporte Digital Gamificado** (Web App PWA, sem necessidade de instalação). A plataforma funciona como um ecossistema de *Tenant Mix* com vitrine aberta para anúncios e promoções do dia, onde o visitante acumula carimbos e pontos ao escanear QR Codes nas lojas e eventos (com validação antifraude por geolocalização em raio de 250 m) e troca seus créditos diretamente por cupons de desconto criados pelos próprios lojistas. *"Cada visita vale algo, e a próxima vale mais."*

---

## 📋 Tarefas e Entregas

> **Referências de interface e Design System (*Aura Dourada Mobile*):** as telas seguem o protótipo oficial **Capim Dourado Shopping**, combinando o padrão de apps de **delivery** (carrossel horizontal de lojas parceiras, página dedicada da loja com ofertas do dia e resgate de cupons, filtros rápidos) e de **programas de pontos** (saldo dourado sempre visível, carteira de carimbos, missões periódicas, extrato e carteira de vouchers com atualização em tempo real via SSE). A identidade visual adota estética *Warm Editorial Mall* com paleta dourada (`#7a580f` / `#c59b4e`), verde esmeralda (`#1b6d24`) para validações/recompensas, fundo marfim (`#fcf9f8`) e tipografia `Playfair Display` + `Outfit`.

---

- [ ] **Tela 01** — *[Tela Inicial / Vitrine Aberta & Página da Loja Parceira]* — rotas `/` e `/loja/[slug]`

  **Objetivo:** atrair o visitante **sem exigir login**. Qualquer pessoa navega pelas lojas parceiras, promoções do dia, missões e recompensas do shopping. O login só é solicitado quando o visitante tenta pontuar (check-in) ou resgatar um voucher.

  **Cabeçalho fixo (topo)**
  - Emblema dourado e marca **Capim Dourado Shopping** (*Tocantins · Palmas*) à esquerda.
  - À direita: chip de saldo **"⭐ 150 pts"** + botão **"Entrar"** (ou avatar do titular quando logado).
  - Barra de busca unificada: *"Buscar lojas, cafés ou cupons..."* com botão de filtro rápido (`tune`).

  **Box 1 — Destaques do Dia (carrossel automático de banners)**
  - Banners promocionais com rotação automática (~4,5 s) e **swipe manual** com indicadores de página.
  - Exemplos do protótipo:
    - **Havanna Café:** *"Compre 1 Cappuccino, Ganhe 1 Alfajor"* — selo **`80 pts`** e validade **`⏰ Até 18h`**.
    - **Outback Steakhouse:** *"Bloomin' Onion Cortesia no Almoço"* — selo **`Grátis hoje`** e validade **`⏰ Até 15h`**.
    - **Cinemark:** *"50% OFF no Combo Mega + Pipoca"* — selo **`50 pts`** e validade **`⏰ Só hoje`**.
  - Tocar em qualquer banner abre um **bottom sheet de detalhes do benefício** com regras de uso, estoque disponível no dia e botão **"Resgatar Agora"**.

  **Box 2 — Passaporte Digital (chamada principal para pontuar + missão em destaque)**
  - Card escuro/dourado em destaque com selo **`PASSAPORTE DIGITAL`**: *"Escaneie o QR Code nas lojas e ganhe pontos!"*.
  - Botão principal **"📷 Escanear agora"** → se deslogado, abre a Tela 02; se logado, abre o leitor óptico de QR Code com validação de GPS (raio de 250 m).
  - Subcard integrado de **Missão Ativa**: **Missão Explorador** (*"1/3 locais visitados esta semana"*) + selo **`+50 pts`** e barra de progresso dourada.

  **Carrossel de Lojas Parceiras (estilo iFood / Delivery)**
  - Linha horizontal deslizável com avatares circulares das lojas e nome abaixo: **Todas** (item ativo em destaque), **Havanna**, **Outback**, **Cinemark**, **Renner**, **Zara**, **Boticário**.
  - Chips de categoria logo abaixo: **Todas** · **Alimentação** · **Moda** · **Lazer** · **Serviços** · **Eventos**.
  - Tocar em uma loja do carrossel abre a **Subtela da Loja Parceira** (ex.: *Havanna Café*).

  **Subtela 01.1 — Página da Loja Parceira (ex.: *Havanna Café — Ofertas e Cupons*)**
  - **Cabeçalho de navegação:** botão **Voltar** para a vitrine, botão **Favoritar** (`bookmark`) e **Compartilhar** (`share`).
  - **Hero Card da Loja:** foto de capa com selo **`● Aberto agora`**, logo circular sobreposta, nome da loja (**Havanna Café**), nota **`★ 4.9`**, localização e segmento (*"Piso L2 · Gastronomia & Cafeteria"*) e horário (*"Segunda a Domingo: 10h às 22h"*).
  - **Card "Loja do Passaporte" (Check-in Presencial):** destaca **"+10 pts por check-in presencial"** com botão **"📷 Fazer Check-in"** (que valida presença e muda para **"✓ Check-in Feito"**, somando +10 pts ao saldo).
  - **Abas/Chips internos da loja:** **Todas as Vantagens** · **🔥 Ofertas do Dia** · **⭐ Trocar por Pontos**.
  - **Seção 1 — 🔥 Ofertas do Dia (`Exclusivo na Loja`):**
    - Cards horizontais de ofertas diretas sem gasto de pontos, com selo de desconto (**`28% OFF`**, **`20% OFF`**, **`-40% 2º`**), tag **`Hoje`**, título, descrição, preço **"de/por"** (ex.: ~~R$ 34,90~~ **R$ 24,90**) e botão **"Regras >"** (abre modal com regulamento completo da promoção).
  - **Seção 2 — ⭐ Trocar por Pontos (Catálogo da Loja):**
    - Banner de saldo: **`SALDO DISPONÍVEL: 150 pontos`** + atalho **`Extrato`**.
    - Lista de recompensas da loja com custo em pontos, estoque em tempo real e ação:
      - *Cappuccino Tradicional* (**`80 pts`** · *14 restantes*) → botão verde **"Resgatar"** (gera voucher único `HVN-XXXX` em modal de confirmação e desconta os pontos).
      - *Pote Mini Alfajores* (**`120 pts`** · *5 restantes*) → botão verde **"Resgatar"**.
      - *Taça Dulce Furor* (**`180 pts`** · **`Faltam 30 pts`**) → card opaco com botão desabilitado **"🔒 Bloqueado"**.
    - Rodapé informativo da loja: *"Atenção: Vouchers resgatados têm validade estrita de 2 horas para ativação e validação no caixa do Havanna Café (Piso L2). Não acumulativo com outras promoções."*

  **Banner de instalação PWA & Barra de navegação inferior (mobile)**
  - Card flutuante: **"Passaporte Capim Dourado — Instale o Web App para acesso rápido"** com botão **"Instalar"** e **"✕"** para dispensar.
  - Barra inferior fixa com 5 atalhos: **Início** · **Cupons** · **📷 Escanear** (botão central dourado elevado) · **Passaporte** · **Perfil**.

---

- [ ] **Tela 02** — *[Autenticação do Visitante: Entrar, Criar Conta e Confirmação WhatsApp (OTP)]* — modal / fluxo de acesso

  **Objetivo:** autenticar ou cadastrar o visitante em poucos segundos com incentivo de boas-vindas e verificação antifraude via código de 6 dígitos no WhatsApp, devolvendo-o diretamente para a ação que tentou realizar.

  **Etapa 2A — Modal / Bottom Sheet "Entrar"**
  - Abre sobre a vitrine desfocada com aviso contextual: *"Entre para resgatar seus cupons e acumular pontos!"*.
  - Seletor segmentado no topo: **Entrar** | **Criar conta**.
  - Campos de login: **E-mail ou celular \*** e **Sua senha \*** (com botão 👁️ mostrar/ocultar e link **"Esqueci minha senha"**).
  - Botão principal dourado: **"Entrar no Passaporte →"**.
  - Login social rápido: botão **"Continuar com o Google"**.
  - Card educativo no rodapé (**"Como funciona seu Passaporte (Grátis)"**) em 3 passos visuais:
    1. **1. Escaneie** (*nas lojas do mall*)
    2. **2. Acumule** (*pontos e selos*)
    3. **3. Troque** (*por cortesias*)

  **Etapa 2B — Tela "Criar Conta / Cadastro"**
  - **Banner de incentivo no topo:** **`🎁 PRESENTE DE CHEGADA`** — *"Ganhe **+50 pontos dourados** logo no seu cadastro!"*.
  - Seletor segmentado: **Entrar** | **Criar conta** (ativo).
  - Formulário completo de cadastro:
    1. **Nome completo** (*Obrigatório*).
    2. **E-mail** (*Para receber vouchers*).
    3. **Telefone / WhatsApp** com prefixo fixo **`🇧🇷 +55`** e máscara automática `(63) 98412-3456`.
    4. **Senha** com botão mostrar/ocultar e **Indicador Visual de Força da Senha** em tempo real (`✓ Forte e segura`, barra tripla de progresso e 3 selos de validação: **`✓ +8 letras`**, **`✓ 1 número`**, **`✓ Especial (*#)`**).
    5. **Confirmar senha** com ícone de verificação imediata (`task_alt`).
  - **Consentimentos (LGPD):**
    - Checkbox obrigatório: *"Li e aceito os **Termos de Uso** e a **Política de Privacidade** do Passaporte Capim Dourado (LGPD)."*
    - Checkbox opcional: *"Quero receber ofertas relâmpago e novidades gastronômicas exclusivas das lojas do shopping por WhatsApp/E-mail."*
  - Botão principal: **"Criar conta e ganhar meu passaporte"** + link *"Já tem uma conta? Entrar agora →"*.

  **Etapa 2C — Tela de "Confirmação de Código WhatsApp (OTP)"**
  - Cabeçalho com botão voltar e selo **`🛡️ ACESSO SEGURO`**.
  - Emblema dourado com ícone de mensagem verificada e título **"Confirme seu número"**: *"Enviamos um código de 6 dígitos para o número **(63) 98412-3456** via WhatsApp para autenticar o seu Passaporte."* + botão **"✏️ Alterar número"**.
  - **Card Código de Verificação:**
    - Indicador de status (`● Aguardando dígitos` → `✓ Código completo`).
    - **6 campos numéricos individuais (OTP)** divididos em dois blocos (`3 + 3`) com avanço automático de foco, suporte a colar código completo (`paste`) e navegação por `Backspace`.
    - Cronômetro regressivo (**`⏱️ Reenviar código em 00:48`**) e botão **"↻ Reenviar código via WhatsApp"**.
  - Botão principal **"🛡️ Confirmar e Entrar"**, alternativa *"Não recebeu no WhatsApp? **Enviar por SMS ↗**"* e card de suporte **"Precisa de assistência? Concierge Capim Dourado"**.

---

- [ ] **Tela 03** — *[Meu Passaporte & Carteira de Cupons]* — rota `/passaporte` (exige login)

  **Objetivo:** centralizar a jornada gamificada do visitante — cartão de membro, carimbos colecionados, missões periódicas, catálogo de troca, carteira de cupons com baixa ao vivo e extrato detalhado.

  **Cartão de Membro "Passaporte Dourado" (topo)**
  - Card premium dourado com textura de filigrana: selo **`✦ Explorador Dourado`**, nome do titular (**Maria Oliveira**), saldo em destaque (**`150 Pontos`**) e botão rápido **"📷 Escanear QR"**.
  - Rodapé do cartão: indicador **`↗ +80 pts ganhos esta semana`** e badge **`Nível Ouro`**.

  **Navegação interna em 5 abas deslizáveis**
  - **Carimbos** · **Missões** · **Trocar Pontos** · **● Meus Cupons (1)** · **Extrato**.

  **1. Aba "Meus Cupons" (Carteira com Validação em Tempo Real via SSE)**
  - **Banner de status ao vivo:** **`⚡ CONECTADO AO CAIXA EM TEMPO REAL`** (*"Quando o atendente validar seu código, esta tela atualizará sozinha instantaneamente"*).
  - **Card de Voucher Ativo (ex.: *Havanna Café · Piso L2*):**
    - Cabeçalho com logo da loja, localização, badge verde **`● Pronto para uso`** e alerta **`⏰ Expira em 48min`**.
    - Benefício em destaque: **"Cappuccino Especial + Alfajor"** (*"Apresente este código ao caixa antes do pagamento"*).
    - **QR Code de alta densidade** com emblema central Capim Dourado + **Código do Voucher (`CAPIM-84920`)** com botão de copiar.
    - Status dinâmico: **`● Aguardando leitura do leitor óptico`** e botão de demonstração **"⚡ Simular Validação Instantânea no Caixa"**.
    - **⚡ Atualização automática (SSE):** assim que o caixa confirma a baixa na Tela 04, o card muda sozinho para **Utilizado** e exibe o modal comemorativo **"Validação Confirmada! Bom Apetite, Maria! O caixa do Havanna Café (POS #02) acabou de confirmar a leitura do seu voucher CAPIM-84920 às [hora]"**, creditando o carimbo da visita.

  **2. Aba "Carimbos" (Caderneta do Shopping)**
  - Progresso da coleção (ex.: *3 de 6 carimbos conquistados*) e aviso de regra antifraude: **"1 carimbo por local/dia · Raio GPS 250m"**.
  - Grade de selos carimbados (coloridos com data e `+10 pts`, como *Havanna Café*, *Praça de Alimentação*, *Cinemark*) e selos bloqueados/pendentes (*Outback*, *Renner*, *Evento Jazz*).

  **3. Aba "Missões"**
  - Cards com barra de progresso, prazo e recompensa:
    - **Explorador da Semana** (*Visite 3 locais diferentes até domingo* — `2/3` · **`+50 pts`**).
    - **Visitante Frequente** (*Visite o shopping em 2 dias diferentes no mês* — **`✓ Concluída · +100 pts`**).
    - **Cultura & Eventos** (*Faça 1 check-in em evento oficial no mês* — `0/1` · **`+30 pts`**).

  **4. Aba "Trocar Pontos" & 5. Aba "Extrato"**
  - Catálogo rápido de recompensas resgatáveis com 1 toque (descontando do saldo atual) e histórico cronológico de entradas (`+10 pts Check-in`, `+50 pts Bônus`) e saídas (`-80 pts Resgate Voucher`).

---

- [ ] **Tela 04** — *[Portal e Painel do Lojista — Acesso, Validação de Caixa e Ofertas]* — rotas `/lojista/login` e `/lojista`

  **Objetivo:** oferecer um portal exclusivo para as operações do shopping (*Tenant Mix*) autenticarem seus terminais de caixa, darem baixa instantânea em vouchers dos clientes e gerenciarem suas próprias ofertas do dia e cupons.

  **Etapa 4A — Tela de Login do Lojista (`/lojista/login`)**
  - Identidade corporativa Capim Dourado Shopping com badge **`🛡️ PORTAL DO LOJISTA & CAIXA`** e título **"Acesso do Lojista"**.
  - **Formulário de autenticação empresarial:**
    - **CNPJ da Operação** (`Formato Oficial` com máscara automática `00.000.000/0001-00` e ícone verde de validação).
    - **Senha de Acesso** com botão mostrar/ocultar e link **"Esqueci a senha"** (abre modal de *Recuperação de Acesso* orientando o Responsável Legal a acionar o SAC Operacional / Administração).
    - Checkbox **"Lembrar este dispositivo no caixa"** (`⚡ Rápido`).
    - Botão principal **"🏪 Acessar Painel do Lojista →"** e opção de acesso rápido **"👆 Entrar com Touch ID / Face ID"**.
  - **Card de Credenciamento Comercial:** informa que o acesso é exclusivo para operações credenciadas pela Administração do Shopping, com botões diretos para **Ramal `(63) 3215-9000 (Ramal 204)`** e **`admin@capimdourado.com.br`**.
  - Rodapé com selo **`🔒 Conexão Segura SSL 256-bit`** e link *"É um cliente ou visitante? **Voltar ao Passaporte**"*

  **Etapa 4B — Painel Operacional do Lojista (`/lojista`)**
  - **Cabeçalho da operação:** logo e nome da loja (**Havanna Café** · *Piso L2*), status **`● POS Ativo`**, identificação do operador (**`Caixa 01 · Lucas R.`**) e barra técnica **`⚡ Sincronizado SSE / POS · Terminal Integrado v2.4`**.
  - **KPIs do Turno (3 cards rápidos):**
    - **Resgatados:** `18` (*Hoje na loja*)
    - **No Caixa:** `14` (**`78% Taxa de baixa`**)
    - **Check-ins:** `42` (*QR na bancada*)
  - **Módulo Principal — Validar Cupom / Passe:**
    - Botão de destaque **"📷 Escanear QR Code do Cliente"** (*"Abre câmera ou leitor óptico USB"*).
    - Campo manual para digitação do código (**`CAPIM-84920`**) + botão **"⚡ Verificar"**.
    - **Card de Conferência ("✓ VOUCHER VÁLIDO — Cód: 84920"):** exibe o item (*Cappuccino Especial + Alfajor Clássico*), pontos debitados (`80 pts`), titular (**Maria Oliveira** · *Passaporte Dourado*), validade (`Expira em 48min`), aviso de disparo SSE em tempo real e botão verde **"✓ Confirmar Uso e Baixar Cupom"**.
  - **Gestão de Campanhas na Loja & Últimos Atendimentos:**
    - Botão **"+ Oferta Express"** (abre modal para criar promoção do dia ou cupom por pontos com título, custo, estoque e validade).
    - Abas **Ativas (3)** · **Agendadas (1)** · **Encerradas**, com controle de estoque em barra e ações rápidas (**Pausar**, **Editar**, **+Estoque**).
    - Lista de **Últimos Atendimentos** com horário, código validado e status **`✓ Baixado`**.
  - **Barra inferior do lojista:** **Validar** · **Ofertas** · **Histórico** · **Loja**.

---

- [ ] **Tela 05** — *[Painel Administrativo do Shopping]* — rota `/admin` (acesso restrito à Administração)

  **Objetivo:** entregar à administração do shopping a visão executiva em tempo real do programa de fidelidade, curadoria do *Tenant Mix*, aprovação de campanhas, gestão de credenciais de lojistas e emissão de totens QR Code com geocerca.

  **Cabeçalho Executivo & Filtros de Período**
  - Identificação **Capim Dourado · ADMIN GERAL — Dashboard Indicadores** e barra de status **`● SISTEMA OPERACIONAL · SSE ATIVO · Tempo Real`**.
  - Filtros rápidos de período (**Hoje** | **Últimos 7d** | **Este Mês**) + botão **`⚡ SEED MOCK`** para popular dados de demonstração para a banca avaliadora.

  **KPIs Executivos & Conversão de Resgates**
  - Grade de 4 indicadores principais:
    1. **Cadastrados:** `14.820` (`↗ +12,4% vs mês ant.`)
    2. **Ativos (7d):** `3.490` (**`Retorno: 41%`**)
    3. **Check-ins Dia:** `684` (`Pico: 19h–20h`)
    4. **Conversão:** `77,7%` (`692 / 890 cupons`)
  - Card de **Resgates com Queima no PDV:** barra comparativa entre cupons **Liquidados no caixa (692)** e **Em aberto (198)**.

  **Análise de Fluxo & Ranking de Locais**
  - **Gráfico de Pico de Check-ins por Horário (`10h` às `22h`):** barras verticais destacando os horários nobres de fluxo no mall (`12h–14h` almoço e `19h–21h` jantar/lazer).
  - **Top Locais Frequentados:** ranking em tempo real com barra de proporção (*1. Praça de Alimentação — 248 check-ins*, *2. Havanna Café (L2) — 164 check-ins*, *3. Cinemark — 119 check-ins*, *4. Outback Steakhouse — 92 check-ins*).

  **Curadoria da Vitrine & Fila de Aprovação (Governança do Shopping)**
  - **Fila de Aprovação (`2 pendentes`):** cards de ofertas submetidas pelos lojistas (ex.: *Outback Steakhouse — Chopp Brahma 50% OFF*, *Boticário — Brinde Malbec 10ml*) com botões **"✓ Aprovar Oferta"** e **"✕ Recusar"** (solicita motivo da recusa para o lojista).
  - **Vitrine Aberta — Ordem dos Banners:** controle de ordenação (`↑` / `↓`) dos destaques `B1` e `B2` exibidos na Tela 01.

  **Gestão de Lojas & Credenciais de Caixa**
  - Botão **"+ Nova Loja"** (cadastra operação, segmento/piso e usuário de acesso) e busca instantânea por nome, piso ou login.
  - Lista de operações credenciadas (*Havanna Café*, *Outback*, *Cinemark*) com status ativo e botão **"Redefinir POS"** (gera PIN temporário de 6 dígitos para o terminal da loja).

  **Gerador de Totens Oficiais QR Code & Raio de Geocerca (GPS)**
  - Pré-visualização do **Totem Oficial Capim Dourado (`+10 Pts`)** pronto para impressão.
  - Seletor do **Raio de Validação GPS (Haversine):** **`150m`** · **`250m (Padrão)`** · **`400m`**.
  - Botões de exportação gráfica: **"📄 Baixar PDF (A4)"** e **"🖼️ Baixar PNG Totem"**.
  - Card de **Exportação de Auditoria:** botão **"📥 Exportar Relatório Geral de Cupons (CSV)"** para conciliação financeira e auditoria do FPP (Fundo de Promoção e Propaganda).

---

## 📄 Documentação Inicial do Projeto

### 💻 Linguagem de Programação
* **TypeScript**

### 🏗️ Arquitetura Proposta
* **Arquitetura Monolítica Modular Full-Stack (baseada em Next.js App Router):** A aplicação centraliza front-end e back-end em uma única base de código TypeScript, dividida em quatro camadas lógicas:
  * **Camada de Apresentação (UI / Client Components):** Interfaces responsivas e PWA divididas por perfil de acesso (Vitrine Aberta, Passaporte do Visitante, Portal do Lojista e Painel Administrativo do Shopping).
  * **Camada de API e Tempo Real (Next.js Route Handlers):** Endpoints RESTful para autenticação, check-in e gestão de ofertas, combinados com canais persistentes de **Server-Sent Events (SSE)** para comunicação unidirecional em tempo real entre o caixa do lojista e a tela do cliente.
  * **Camada de Serviços e Regras de Negócio (Domain Services):** Módulos isolados responsáveis pelo cálculo de perímetro geográfico (Fórmula de Haversine para trava de GPS), apuração automática de missões periódicas (semanal/mensal), controle atômico de estoque de cupons e emissão/baixa de vouchers.
  * **Camada de Persistência (ORM + Banco Relacional):** Modelagem relacional com integridade referencial para isolamento multi-loja (*Tenant Mix*), histórico de transações (extrato) e auditoria de uso de cupons.

### 🚀 Plataformas e Tecnologias Adotadas
* **Framework Principal:** Next.js
* **Outras Tecnologias:**
  * **Interface e Estilização:** React, Tailwind CSS, PWA (Manifest + Service Worker para instalação na tela inicial) e HTML5 Geolocation API (`navigator.geolocation`).
  * **Comunicação em Tempo Real:** Server-Sent Events (SSE) nativo via Web Streams API no servidor e `EventSource` no cliente.
  * **Banco de Dados e ORM:** SQLite (desenvolvimento/MVP) / PostgreSQL (produção) gerenciados via Prisma ORM.
  * **Segurança e Autenticação:** JWT (JSON Web Tokens) com cookies `HttpOnly`, hash de senhas com `bcryptjs` e validação de esquemas com `Zod`.
  * **Leitura e Geração de QR Codes:** `html5-qrcode` (leitura via câmera no navegador) e `qrcode` (geração de vouchers e placas das lojas).

### 🎲 Incorporação da Tecnologia / Prática Sorteada
**Tecnologia sorteada:** 🔴 **Backend e Dados — Dados em tempo real** (*"A tela atualiza sozinha quando o dado muda"*).

**Aplicação na solução: Baixa do cupom ao vivo (atendente → celular do cliente)**

Quando o atendente da loja valida o cupom no Painel do Lojista (Tela 04), a carteira do cliente (Tela 03) muda **sozinha e na mesma hora** de *Ativo* para ✅ *Utilizado*, sem o cliente tocar em nada nem recarregar a página.

**Por que essa escolha**
- **Prova clara do requisito:** a ação acontece em um dispositivo (celular do atendente) e a tela muda em outro (celular do cliente).
- **Já faz parte do escopo:** usa o fluxo de resgate e validação de cupom que o sistema já precisa ter.
- **Reforça o antifraude:** um print do cupom não muda de status; só a tela real do app mostra a confirmação, e o cupom fica bloqueado para reuso.
- **Experiência do cliente:** confirmação imediata e transparente no caixa.

**Fluxo**
1. O cliente abre o cupom ativo na carteira (Tela 03) → a página abre uma conexão em tempo real com o servidor para aquele voucher.
2. O atendente escaneia o QR ou digita o código de 6 dígitos no Painel do Lojista (Tela 04) e toca em **"Confirmar uso"**.
3. O servidor valida (cupom da loja, status *ativo*), grava `status = utilizado` de forma atômica (impede uso duplo em dois caixas) e publica o evento `cupom_utilizado`.
4. O servidor envia o evento **apenas para o cliente dono do cupom** → a tela dele atualiza na hora.

**Implementação (dentro das tecnologias do projeto: Next.js + TypeScript + React)**
- **Server-Sent Events (SSE)** em um *Route Handler* do Next.js (ex.: `GET /api/cupons/[codigo]/eventos`), retornando `Content-Type: text/event-stream`.
  - A comunicação é só do servidor para a tela, então SSE é mais simples que WebSocket e não exige biblioteca extra.
- No cliente, um componente React usa `EventSource` e atualiza o estado do cupom ao receber `cupom_utilizado`. O `EventSource` reconecta sozinho se a conexão cair; ao reconectar, a tela consulta o status atual.
- A rota de validação (`POST /api/lojista/validar`) publica o evento em um emissor de eventos no servidor, que repassa para a conexão SSE do cupom correspondente.
- **Segurança:** a conexão SSE exige o token de sessão do usuário e só entrega eventos de cupons que pertencem a ele.

> ⚠️ **Hospedagem:** SSE precisa de um servidor Node.js que mantenha a conexão aberta (`next start` em Render, Railway, VPS etc.). Em ambiente *serverless* (ex.: Vercel), as conexões longas são encerradas; nesse caso seria necessário um serviço de tempo real externo.

**Roteiro da demonstração:** o jurado resgata um cupom no celular e o deixa aberto na tela → outro integrante, como "atendente", valida o código no Painel do Lojista → o celular do jurado muda para ✅ *Utilizado* na frente da banca.
