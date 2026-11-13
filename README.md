# 🛍️ Passaporte do Shopping

> *[Insira aqui a descrição do desafio / objetivo principal do projeto]*

---

## 📋 Tarefas e Entregas

> **Referências de interface:** as telas do visitante seguem o padrão de apps de **delivery** (carrossel de lojas, cards de oferta, filtro por loja, carrinho/checkout rápido) e de **programas de pontos** (saldo sempre visível, extrato, catálogo de troca, carteira de cupons). As regras de pontuação seguem a *Especificação Atualizada* (1 carimbo por local/dia, validação por GPS em raio de 250 m, Missões Explorador/Frequente/Evento).

---

- [ ] **Tela 01** — *[Tela inicial / Vitrine aberta]* — rota `/`

  **Objetivo:** atrair o visitante **sem exigir login**. Qualquer pessoa vê lojas, promoções, missões e cupons. O login só é pedido quando ele tenta pontuar ou resgatar.

  **Cabeçalho fixo (topo)**
  - Logo do shopping à esquerda.
  - À direita: botão **"Entrar"** (deslogado) **ou** chip de saldo **"⭐ 150 pts"** + avatar (logado). Tocar no saldo leva à Tela 03.
  - Barra de busca: *"Buscar loja, cupom ou promoção"*.

  **Carrossel de lojas (estilo delivery)**
  - Linha horizontal com logos redondas das lojas + nome abaixo, deslizável com o dedo.
  - Primeiro item fixo: **"Todas"**. Tocar em uma loja filtra os Boxes 1 e 3 para mostrar apenas ofertas daquela loja (item selecionado fica destacado).
  - Chips de categoria logo abaixo: *Alimentação · Moda · Lazer · Serviços · Eventos*.

  **Box 1 — Promoções do dia (carrossel automático)**
  - Banners que passam sozinhos a cada ~4 s, com **swipe manual** liberado (o auto-scroll pausa enquanto o usuário interage).
  - Indicadores de página (bolinhas) abaixo.
  - Cada banner: imagem, nome da loja, título da oferta, selo de custo **"80 pts"** ou **"Grátis hoje"**, e validade (*"até 18h"*).
  - Tocar no banner abre o **detalhe do cupom** (bottom sheet): descrição, regras, estoque restante (*"restam 12"*), botão **"Resgatar por 80 pts"**.

  **Box 2 — Anúncio principal (chamada para pontuar)**
  - Card grande e colorido: **"Escaneie o QR Code nas lojas e ganhe pontos!"**
  - Botão principal **"📷 Escanear agora"** → se deslogado, abre a Tela 02; se logado, abre o leitor de QR (câmera + GPS).
  - Abaixo, resumo das missões ativas com barra de progresso (ex.: *Explorador 1/3 locais esta semana · +50 pts*).

  **Box 3 — Ofertas com valor/preço (grade de cards)**
  - Grade de 2 colunas (mobile) / 4 colunas (desktop), estilo cardápio de delivery.
  - Card: foto, loja, título, **preço "de/por"** (ex.: ~~R$ 39,90~~ **R$ 29,90**) ou percentual (**-20%**), e custo em pontos quando houver.
  - Selos: **"Novo"**, **"Últimas unidades"**, **"Só hoje"**.

  **Chamada para instalar o web app (somente mobile)**
  - Banner discreto no rodapé: *"Adicione o Passaporte à sua tela inicial"* + botão **"Adicionar"** (PWA) e **"X"** para dispensar (não reaparece por 7 dias).
  - No iPhone, onde não existe o prompt automático, mostrar instrução: *Compartilhar → Adicionar à Tela de Início*.

  **Barra de navegação inferior (mobile)**
  - 🏠 Início · 🎟️ Cupons · 📷 Escanear (botão central em destaque) · 👤 Perfil.

  **Estados:** carregando (skeleton dos cards), sem ofertas na loja filtrada (*"Essa loja ainda não publicou ofertas hoje"*), sem conexão (aviso + botão tentar novamente).

---

- [ ] **Tela 02** — *[Login / Cadastro / Logout]* — modal/bottom sheet sobre a Tela 01

  **Objetivo:** criar conta ou entrar em poucos segundos, sem tirar o usuário do contexto (ele volta para a ação que tentou fazer).

  **Abertura**
  - Aparece como **bottom sheet** no mobile e modal central no desktop.
  - Mensagem de contexto conforme a origem: *"Entre para ganhar seus pontos"* (veio do escanear) ou *"Entre para resgatar este cupom"* (veio de um cupom).
  - Duas abas no topo: **Entrar** | **Criar conta**.

  **Aba "Entrar"**
  - Campo **E-mail ou telefone** (detecta o formato e aplica máscara `(63) 99999-9999` quando for telefone).
  - Campo **Senha** com ícone 👁️ mostrar/ocultar.
  - Link **"Esqueci minha senha"** (fluxo de redefinição — previsto nos próximos passos).
  - Botão **"Entrar"** (desabilitado até os campos estarem válidos; mostra spinner ao enviar).
  - Erro genérico: *"E-mail/telefone ou senha incorretos"* (não revela qual dos dois está errado).

  **Aba "Criar conta"**
  - **Nome**, **E-mail ou telefone**, **Senha** (mín. 8 caracteres, com indicador de força) e **Confirmar senha**.
  - Checkbox obrigatório: *"Li e aceito os Termos de Uso e a Política de Privacidade"* (links abrem em nova aba) — exigência da LGPD.
  - Checkbox opcional: *"Quero receber ofertas do shopping"*.
  - Botão **"Criar conta e ganhar meu passaporte"**.
  - Erro de duplicidade: *"Este e-mail/telefone já está cadastrado. Deseja entrar?"* (troca para a aba Entrar com o campo preenchido).

  **Após sucesso**
  - Toast *"Bem-vindo(a), Maria! 🎉"*; o cabeçalho passa a mostrar o saldo.
  - O usuário retorna **automaticamente à ação pendente** (abre o leitor de QR ou finaliza o resgate do cupom).
  - Primeiro acesso: mini-tutorial em 3 cards deslizáveis (*Escaneie → Acumule → Troque*).

  **Logout**
  - Em **Perfil → Sair**, com confirmação *"Deseja sair da sua conta?"*.
  - Remove o token de sessão e volta para a vitrine aberta (Tela 01).

  **Perfil (acessível pelo avatar)**
  - Nome, e-mail/telefone, alterar senha, preferências de notificação, **excluir minha conta** (LGPD) e Sair.

---

- [ ] **Tela 03** — *[Cupons e pontos / Meu Passaporte]* — rota `/passaporte` (exige login)

  **Objetivo:** concentrar tudo o que o visitante tem: saldo, carimbos, missões e cupons — no padrão de apps de pontos.

  **Cartão de saldo (topo)**
  - Card destacado em formato de "passaporte": **saldo atual em pontos**, nome do visitante e botão **"📷 Escanear QR Code"**.
  - Linha abaixo: *"+80 pts ganhos esta semana"*.

  **Abas**

  **1. Carimbos (carteira de carimbos)**
  - Grade com os locais do shopping em formato de **selo/carimbo**: colorido = já visitado hoje/esta semana; cinza = ainda não visitado.
  - Cada carimbo mostra nome do local, tipo (loja/alimentação/evento) e pontos que vale.
  - Regra visível: *"1 carimbo por local por dia — volte amanhã para pontuar de novo"*.

  **2. Missões**
  - Lista de cards com barra de progresso e prazo:
    - **Explorador** — visitar 3 locais diferentes na semana → **+50 pts** (ex.: 2/3, *termina domingo*).
    - **Frequente** — visitar o shopping em 2 dias diferentes no mês → **+100 pts**.
    - **Evento** — 1 check-in em evento no mês → **+30 pts**.
  - Missão concluída: selo **"✓ Concluída"** e animação de confete ao receber o bônus.

  **3. Trocar pontos (catálogo)**
  - Mesma grade de cupons da vitrine, com filtros: **Até 50 pts · 50–100 · 100+**, por loja e por categoria.
  - Cards com saldo insuficiente ficam opacos com o texto *"Faltam 30 pts"*.
  - **Fluxo de resgate (estilo checkout de delivery):**
    1. Toca no cupom → bottom sheet com regras, validade e estoque.
    2. Resumo: *Saldo atual 150 → Custo 80 → Saldo após 70*.
    3. Botão **"Confirmar troca"** → tela de sucesso e o cupom vai para "Meus cupons".

  **4. Meus cupons (carteira)**
  - Subabas: **Ativos · Utilizados · Expirados**.
  - Cupom ativo aberto em tela cheia para mostrar no caixa:
    - Logo e nome da loja, benefício, **QR Code + código de 6 dígitos** do voucher.
    - Validade e regras de uso.
    - Instrução: *"Mostre esta tela ao atendente"*.
    - Brilho da tela aumentado e elemento animado (relógio em tempo real) para dificultar o uso de print.
  - **⚡ Tempo real:** com o cupom aberto, a tela fica "escutando" o servidor. Quando o atendente confirma o uso (Tela 04), **a tela do cliente muda sozinha, sem recarregar**: fundo verde, ✅ **"Cupom utilizado em Havanna Café às 14:32"**, QR Code e código ficam bloqueados/riscados e o cupom passa para **Utilizados**.
  - Se a conexão cair, a tela mostra *"Reconectando…"* e, ao voltar, busca o status atual do cupom.

  **5. Extrato**
  - Linha do tempo de movimentações: **+10 Carimbo — Praça de Alimentação**, **+50 Bônus Missão Explorador**, **−80 Cupom Outback**, com data e hora.
  - Filtros: Ganhos | Gastos | Todos.

  **Leitor de QR Code (sobreposição da câmera)**
  - Câmera em tela cheia com moldura de mira; botão de lanterna.
  - Ao ler: *"Verificando sua localização…"* (solicita permissão de GPS na primeira vez, com explicação do porquê).
  - **Sucesso:** animação de carimbo + *"+10 pts — Havanna Café"* + progresso da missão atualizado.
  - **Erros tratados:**
    - Fora do raio: *"Você precisa estar no shopping para pontuar."*
    - Já carimbado hoje: *"Você já carimbou este local hoje. Volte amanhã!"*
    - GPS negado: instrução para liberar a localização nas configurações do navegador.
    - QR inválido: *"Este QR Code não pertence ao Passaporte do Shopping."*

---

- [ ] **Tela 04** — *[Painel do Lojista]* — rota `/lojista` (login próprio de cada loja)

  **Objetivo:** dar autonomia para cada loja publicar suas ofertas e cupons e validar os vouchers no caixa — no modelo de painel de parceiros de apps de delivery.

  **Login do lojista**
  - Usuário da loja + senha (contas criadas pela administração do shopping na Tela 05).

  **Dashboard (início)**
  - Cards: **cupons resgatados hoje**, **cupons utilizados no caixa**, **taxa de uso** (utilizados ÷ resgatados), **check-ins no QR da loja** hoje/semana.
  - Lista das ofertas ativas com status e estoque restante.

  **Validar cupom (ação principal — botão grande no topo)**
  - Opção 1: **escanear o QR Code** do cupom na tela do cliente.
  - Opção 2: **digitar o código de 6 dígitos**.
  - Resultado imediato:
    - ✅ **Válido** — mostra benefício, nome do cliente e botão **"Confirmar uso"** → status muda para *utilizado* e **o celular do cliente é atualizado na hora** (⚡ tempo real). O painel exibe *"Cliente notificado ✓"*.
    - ❌ **Já utilizado** — mostra data/hora do uso anterior.
    - ❌ **De outra loja / expirado / inexistente** — mensagem clara para o atendente.
  - Pensado para o caixa: botões grandes, poucos toques, funciona no celular do atendente.

  **Minhas ofertas e cupons (CRUD)**
  - Lista com filtros: **Ativas · Agendadas · Encerradas**.
  - Botão **"+ Nova oferta"** abre formulário:
    - **Tipo:** *Promoção do dia* (aberta, sem custo em pontos) ou *Cupom por pontos*.
    - Título, descrição, imagem (upload), preço "de/por" ou percentual de desconto.
    - Custo em pontos (se for cupom), **estoque máximo**, limite por cliente.
    - **Período de validade** (data/hora de início e fim) e regras de uso.
    - **Pré-visualização** de como o card aparecerá na vitrine.
  - Ações em cada oferta: editar, pausar/ativar, duplicar, encerrar.
  - Obs.: ofertas podem passar por **aprovação do shopping** antes de ir ao ar (padrão visual/regras do empreendimento).

  **Histórico**
  - Tabela de cupons resgatados/utilizados com data, código, oferta e status; exportar CSV.

  **Perfil da loja**
  - Logo, nome, categoria, piso/localização e horário (exibidos no carrossel da vitrine).

---

- [ ] **Tela 05** — *[Painel Administrativo do Shopping]* — rota `/admin` (senha de administrador)

  **Objetivo:** visão gerencial do programa e controle sobre lojas, conteúdo e QR Codes.

  **Dashboard de indicadores**
  - Cards: **visitantes cadastrados**, **ativos nos últimos 7 dias**, **taxa de retorno**, **check-ins do dia**, **cupons resgatados x utilizados**.
  - Gráficos: check-ins por hora (horários de pico), check-ins por dia (últimos 30 dias), **ranking de locais mais visitados**, ranking de lojas por cupons utilizados.

  **Gestão de lojas**
  - Cadastrar/editar loja (nome, logo, categoria, piso), **criar login do lojista**, ativar/desativar.

  **Gestão de anúncios e banners**
  - Definir banners da vitrine (Box 1 e Box 2), ordem de exibição e período.
  - **Fila de aprovação** das ofertas enviadas pelos lojistas (aprovar/reprovar com motivo).

  **Locais e QR Codes** (gerador — rota `/qrcodes`)
  - Cadastrar locais (loja, evento, praça de alimentação) com pontos por carimbo.
  - Gerar e **baixar/imprimir** o QR Code de cada local (PNG/PDF), com nome e instrução *"Escaneie e ganhe pontos"*.

  **Missões e regras**
  - Visualizar/ajustar missões (pontos de bônus, período) e o raio de validação do GPS.

  **Cupons resgatados**
  - Lista geral com filtros por loja, status e período; exportar CSV.

  **Demonstração**
  - Botão **"Popular dados de demonstração"** (visitantes fictícios, anúncios e cupons) — usar apenas em ambiente de teste.


---

## 📄 Documentação Inicial do Projeto

### 💻 Linguagem de Programação
* **TypeScript**

### 🏗️ Arquitetura Proposta
* *[Descreva aqui a arquitetura do sistema — ex.: MVC, Clean Architecture, Feature-based, Serverless, etc.]*

### 🚀 Plataformas e Tecnologias Adotadas
* **Framework Principal:** Next.js
* **Outras Tecnologias:** *[Ex.: React, Tailwind CSS, TyperScript, etc.]*

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
