# Dúvidas, Lacunas e Premissas Arquiteturais — Passaporte Digital Gamificado

Este documento registra todas as informações ausentes, decisões de negócio ainda abertas, dependências de fornecedores externos e premissas técnicas adotadas na fundação do projeto.

> **Diretriz Aplicada:** Nenhuma decisão de negócio indefinida foi inventada como definitiva. Sempre que uma regra dependia de definição externa, a arquitetura utilizou **interfaces desacopladas, parâmetros configuráveis e adaptadores mockados explícitos**, permitindo o início imediato do desenvolvimento pelas três frentes.

---

## Nota Técnica Inicial — Sincronização do Repositório Base e Protótipos

- **Situação Identificada:** O diretório local de trabalho (`c:\Users\Cristiano\Desktop\passaporteshopping`) encontrava-se inicialmente vazio e o ambiente de execução possui restrição de rede no sandbox (`SEC_E_UNTRUSTED_ROOT` / bloqueio de política para comandos externos), impedindo o `git clone` direto de `https://github.com/PmwMaster/Passaporte-Digital-Gamificado`.
- **Ação Tomada:** Toda a estrutura documental, os protótipos HTML de referência em `prototipos/` e a aplicação Next.js foram construídos fielmente a partir das especificações oficiais do Passaporte Capim Dourado (estética *Warm Editorial Mall*, paleta `#7a580f`, `#c59b4e`, `#1b6d24`, `#fcf9f8`, tipografias *Playfair Display* e *Outfit*, raio Haversine de 250m, validade de vouchers, SSE e divisão em 9 módulos). Assim que o repositório remoto for vinculado via `git remote add origin`, os arquivos poderão ser sincronizados diretamente.

---

## PRIORIDADE P0 — Bloqueia Decisões Fundamentais de Produção ou Integração Crítica

### P0-01: Definição do Provedor de Envio de OTP via WhatsApp
1. **Problema:** O requisito de Autenticação (Funcionalidade 02) prevê verificação OTP por telefone/WhatsApp, mas não há definição contratual sobre qual API será utilizada nem quem custeará o disparo por mensagem.
2. **Por que a decisão é necessária:** Cada provedor possui formato de webhook, custo por conversa iniciada (modelo Meta) e requisitos de aprovação de template diferentes.
3. **Alternativas possíveis:**
   - **A) Meta WhatsApp Cloud API Oficial:** Menor custo por mensagem, alta estabilidade, exige conta Meta Business verificada do shopping.
   - **B) Twilio Verify / Messaging:** Excelente SLA e SDK maduro, porém custo em dólar mais elevado.
   - **C) Gateways Nacionais (Z-API / Evolution API):** Rápida integração no Brasil, mas menor garantia oficial de SLA dependendo da modalidade.
4. **Recomendação técnica:** Utilizar a **Meta WhatsApp Cloud API Oficial** em produção e manter um **Adaptador OTP (`IOtpProvider`)** em `src/infrastructure/integrations/whatsapp-otp.adapter.ts` que, em desenvolvimento/MVP inicial, exibe o código OTP de 6 dígitos no log do servidor e em banner de ambiente de homologação.
5. **Status:** `PENDENTE`

---

### P0-02: Tratamento de Check-ins sem Permissão de GPS (Geolocalização Negada)
1. **Problema:** Visitantes podem negar a permissão da HTML5 Geolocation API no navegador mobile (iOS Safari / Android Chrome) ou estar em áreas internas do subsolo/piso com sinal de GPS degradado.
2. **Por que a decisão é necessária:** A regra principal exige validação Haversine num raio de 250m. Se o GPS for bloqueado pelo usuário, o sistema precisa saber se bloqueia totalmente o check-in ou se oferece validação alternativa presencial.
3. **Alternativas possíveis:**
   - **A) Bloqueio Estrito com Tutorial de Reativação:** Exigir obrigatoriamente a permissão de GPS e exibir guia passo a passo para habilitar no iOS/Android.
   - **B) QR Code Dinâmico Rotativo no Balcão + PIN do Operador:** Permitir que o operador da loja valide o check-in com um PIN caso o GPS do cliente falhe.
4. **Recomendação técnica:** No MVP, adotar a **Alternativa A (Bloqueio Estrito com Tutorial Visual de Ativação de GPS)** para manter a segurança antifraude sem sobrecarregar o caixa da loja, tolerando imprecisão de rede móvel (`accuracy <= 150m`).
5. **Status:** `PENDENTE`

---

### P0-03: Prevenção contra Fraudes por Localização Simulada (Fake GPS / QR Compartilhado)
1. **Problema:** Usuários mal-intencionados podem fotografar o QR Code estático de uma loja para compartilhar em grupos ou utilizar aplicativos de *Mock Location* (Fake GPS) para pontuar de casa.
2. **Por que a decisão é necessária:** Fraudes em programas de fidelidade esgotam rapidamente o estoque de recompensas reais dos lojistas parceiros.
3. **Alternativas possíveis:**
   - **A) Validação Haversine + Trava de Velocidade Impossível (*Velocity Check*) + Limite Diário:** Verificar distância (250m), bloquear mais de 1 check-in por loja/dia, limitar intervalo mínimo entre check-ins seguidos (cooldown de 3 minutos) e inspecionar coerência de `accuracy` / `altitude`.
   - **B) Token QR Dinâmico (Totem Digital):** Exigir tela eletrônica na loja que muda o QR Code a cada 60 segundos (TOTP).
4. **Recomendação técnica:** Adotar a **Alternativa A** no MVP (pois os lojistas utilizarão displays impressos em acrílico no balcão), combinando Haversine 250m + limite de 1 check-in/loja/dia + *cooldown* entre leituras + possibilidade de regeneração rápida do `qrCodeToken` pelo Admin caso um QR vaze.
5. **Status:** `PENDENTE`

---

### P0-04: Controle de Estoque Simultâneo de Recompensas (*Race Condition*)
1. **Problema:** Duas ou mais pessoas podem tentar resgatar a última unidade de uma recompensa altamente desejada no mesmo segundo.
2. **Por que a decisão é necessária:** Evitar *overselling* (emitir mais vouchers do que o lojista se comprometeu a entregar) e evitar débito duplicado de pontos.
3. **Alternativas possíveis:**
   - **A) Transação ACID no Banco (`prisma.$transaction`) com `UPDATE ... WHERE availableStock > 0`:** Verifica a contagem de linhas afetadas antes de emitir o voucher.
   - **B) Lock Distribuído com Redis:** Maior complexidade de infraestrutura.
4. **Recomendação técnica:** Adotar a **Alternativa A** (Transação atômica condicional no PostgreSQL/SQLite via Prisma + chave de idempotência na requisição), que resolve 100% da concorrência sem adicionar Redis à stack inicial.
5. **Status:** `PENDENTE (Premissa A já estruturada no código)`

---

## PRIORIDADE P1 — Necessária antes da Finalização de cada Módulo

### P1-01: Obrigatoriedade ou Opcionalidade do Login Social com Google / Neon Auth no MVP
1. **Problema:** A Funcionalidade 02 menciona "possibilidade de login social", mas não define se é bloqueante para o lançamento do MVP.
2. **Atualização Técnica (Neon Auth Configurado):** Foi fornecido o endpoint oficial de **Neon Auth & JWKS** do projeto (`https://ep-ancient-sunset-bef18lgk.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json`), já configurado em `.env` e integrado em `src/infrastructure/authentication/neon-auth.ts`.
3. **Recomendação técnica:** Utilizar o fluxo JWT `HttpOnly` em conjunto com o verificador JWKS do **Neon Auth**, que facilita a ativação imediata de provedores OAuth (como Google) diretamente pelo painel do Neon sem infraestrutura extra.
4. **Status:** `CONFIGURADO COM NEON AUTH JWKS`

---

### P1-02: Fluxo de Validação e Credenciamento Inicial dos Lojistas
1. **Problema:** Como os lojistas e seus operadores de caixa recebem o primeiro acesso ao Portal do Lojista?
2. **Por que a decisão é necessária:** Define se haverá uma tela pública de auto-cadastro de lojista ("Quero ser loja parceira") ou se o credenciamento é fechado pela Administração do shopping.
3. **Alternativas possíveis:**
   - **A) Credenciamento Fechado via Painel Admin (Módulo 09):** A administração do shopping cadastra a loja e gera as credenciais iniciais do Lojista (`MERCHANT`), que por sua vez pode cadastrar seus Operadores (`OPERATOR`).
   - **B) Auto-cadastro Público de Lojista com fila de aprovação pelo Admin.**
4. **Recomendação técnica:** Adotar a **Alternativa A** no MVP por segurança (apenas lojas reais com contrato ativo no Capim Dourado Shopping devem existir na base).
5. **Status:** `PENDENTE`

---

### P1-03: Governança de Criação e Aprovação de Campanhas e Recompensas
1. **Problema:** Quem pode criar campanhas promocionais e recompensas, e quem deve aprová-las antes de irem ao ar na Vitrine Pública?
2. **Por que a decisão é necessária:** Conecta diretamente a Funcionalidade 08 (Portal do Lojista), Funcionalidade 09 (Painel Administrativo) e Funcionalidade 01 (Vitrine).
3. **Alternativas possíveis:**
   - **A) Dupla Governança:** Lojistas criam ofertas/recompensas da sua loja com status `PENDING_APPROVAL`; Administradores criam campanhas globais do shopping e aprovam/rejeitam as submissões dos lojistas.
   - **B) Publicação Direta pelo Lojista sem moderação prévia.**
4. **Recomendação técnica:** Adotar a **Alternativa A (Moderação pelo Admin)** para proteger o padrão editorial e comercial do shopping.
5. **Status:** `PENDENTE`

---

### P1-04: Regra Definitiva de Expiração dos Vouchers (2 Horas vs. Configurável por Loja)
1. **Problema:** Existe referência ao prazo de validade de **2 horas** para utilização do voucher após o resgate, mas dúvidas se esse prazo é fixo para todo o shopping ou configurável por loja/recompensa.
2. **Por que a decisão é necessária:** Impacta o modelo de dados (`Reward.voucherValidityHours`), a experiência do visitante (que pode resgatar em casa antes de ir ao shopping vs. resgatar já dentro do shopping) e a devolução ou não de pontos em caso de expiração.
3. **Alternativas possíveis:**
   - **A) Padrão de 2 horas (`voucherValidityHours = 2`), porém parametrizável por recompensa (ex.: 2h para gastronomia imediata, 24h ou 48h para varejo/serviços).**
   - **B) Prazo fixo global de 2 horas para qualquer voucher sem exceção.**
4. **Recomendação técnica:** Implementar a **Alternativa A** no banco (`voucherValidityHours` com valor default `2`), além de definir se um voucher expirado estorna ou não os pontos ao visitante (recomendação: alertar antes do resgate que o voucher tem validade de 2h para uso presencial).
5. **Status:** `PENDENTE`

---

### P1-05: Dados Pessoais do Visitante Efetivamente Armazenados (Minimização LGPD)
1. **Problema:** Definir se o CPF será exigido no cadastro do visitante ou apenas Nome, E-mail e Telefone.
2. **Por que a decisão é necessária:** O princípio da necessidade da LGPD (Art. 6º, III) exige coletar o mínimo de dados pessoais necessários para a finalidade.
3. **Alternativas possíveis:**
   - **A) Coleta Mínima no Cadastro:** Nome, E-mail, Telefone Celular e Senha (sem CPF obrigatório no cadastro inicial; CPF solicitado apenas se houver sorteio regulamentado ou recompensa de alto valor).
   - **B) Exigir CPF obrigatório de todos os visitantes no cadastro.**
4. **Recomendação técnica:** Adotar a **Alternativa A** para reduzir a fricção de cadastro e o risco jurídico sob a LGPD, mantendo telefone único verificado para evitar contas duplicadas.
5. **Status:** `PENDENTE`

---

### P1-06: Níveis de Permissão (RBAC) e Operadores de Loja
1. **Problema:** Detalhar o que diferencia um usuário `MERCHANT` (Gerente/Proprietário da loja) de um `OPERATOR` (Caixa/Atendente) e os níveis de `ADMIN`.
2. **Por que a decisão é necessária:** Impedir que um operador temporário de balcão altere estoques ou exclua ofertas da loja.
3. **Alternativas possíveis:**
   - **A) Hierarquia em 4 Papéis (`VISITOR`, `OPERATOR`, `MERCHANT`, `ADMIN`):**
     - `VISITOR`: Usa o passaporte, faz check-in e resgata vouchers.
     - `OPERATOR`: Apenas valida e confirma baixa de vouchers da sua loja.
     - `MERCHANT`: Tudo que o `OPERATOR` faz + cria ofertas, gerencia estoque e vê indicadores da loja.
     - `ADMIN`: Governança global do shopping.
4. **Recomendação técnica:** Adotar a **Alternativa A**, já refletida nas entidades `User`, `Merchant`, `Operator` e `Administrator`.
5. **Status:** `PENDENTE`

---

## PRIORIDADE P2 — Pode ser Decidida Durante o Desenvolvimento

### P2-01: Prazo de Validade e Expiração dos Pontos Acumulados
1. **Problema:** Os pontos acumulados pelo visitante expiram após determinado período (ex.: 6 ou 12 meses) ou ao final de uma campanha anual?
2. **Por que a decisão é necessária:** Define se será necessário um *cron job* de expiração de saldo no Módulo 06.
3. **Alternativas possíveis:**
   - **A) Validade de 12 meses a partir da data do crédito (FIFO).**
   - **B) Pontos válidos enquanto a temporada anual do Passaporte Capim Dourado estiver vigente.**
4. **Recomendação técnica:** No MVP, manter os pontos válidos durante toda a temporada vigente e registrar `createdAt` em cada `PointTransaction` para permitir expiração FIFO futura sem migração destrutiva.
5. **Status:** `PENDENTE`

---

### P2-02: Estratégia de Banco de Dados, Deploy do WebApp e Conexão SSE
1. **Problema:** Definir o administrador do banco PostgreSQL e onde o WebApp Next.js será hospedado em produção.
2. **Decisão Definida pelo Product Owner / Tech Lead:**
   - **Banco de Dados Definido:** **Neon Serverless PostgreSQL** (`provider = "postgresql"`), configurado com `DATABASE_URL` (pooled via PgBouncer) e `DIRECT_URL` (direta para migrações Prisma), permitindo inclusive o uso de *Neon Branches* para os 3 desenvolvedores.
   - **Formato Definido:** **WebApp Responsivo (Mobile-First + PWA)** executado diretamente no navegador mobile e desktop.
3. **Ponto Restante de Hospedagem do Servidor WebApp:** Escolher apenas o provedor de compute do WebApp Next.js (ex.: Railway, Render ou Vercel) conectado ao Neon PostgreSQL.
4. **Status:** `PARCIALMENTE DEFINIDO (Banco Neon PostgreSQL + WebApp Confirmados)`

---

### P2-03: Serviço de Notificações Transacionais (E-mail e Push)
1. **Problema:** Qual serviço será usado para e-mails de recuperação de senha e alertas de campanha?
2. **Por que a decisão é necessária:** Necessário para fechar o fluxo real de "Esqueci minha senha".
3. **Alternativas possíveis:**
   - **A) Resend (API moderna para Next.js com tier gratuito generoso).**
   - **B) AWS SES / SendGrid.**
4. **Recomendação técnica:** Utilizar **Resend** encapsulado em `src/infrastructure/integrations/mailer.adapter.ts`.
5. **Status:** `PENDENTE`
