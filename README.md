# 🌟 Passe Dourado Shopping — Passaporte Digital Gamificado
> **Projeto Desenvolvido para o HackaRun 2026 • Capim Dourado Shopping (Palmas - TO)**  
> 🔗 **MVP em Produção na Vercel:** [https://passaporteshopping.vercel.app](https://passaporteshopping.vercel.app)

---

## 📌 Links Rápidos para Avaliação (Entrega Final)
* 📄 **[Resumo Executivo para Avaliadores (1 Página)](./RESUMO_AVALIADORES.md)**
* 🎬 **[Roteiro do Vídeo de Apresentação (90 Segundos)](./ROTEIRO_VIDEO_90S.md)**
* 📐 **[Documentação de Arquitetura e Engenharia](./docs/ARCHITECTURE.md)**
* 📑 **[Product Requirements Document (PRD)](./docs/PRD.md)**
* 🗄️ **[Modelagem do Banco de Dados Neon](./docs/DATABASE.md)**
* ⚖️ **[Regras de Negócio e Fórmulas de Geofence](./docs/BUSINESS_RULES.md)**

---

## 1️⃣ MVP Funcional & Ambientes do Sistema

O produto foi integralmente construído e publicado na nuvem com banco de dados serverless ativo. Você pode testar todas as jornadas do sistema:

| Módulo / Ambiente | Rota | Descrição Funcional |
| :--- | :--- | :--- |
| **Passaporte do Visitante** | [`/passaporte`](https://passaporteshopping.vercel.app/passaporte) | Níveis (*Bronze, Prata, Ouro, Diamante*), carimbos por categoria e validação direta WhatsApp. |
| **Check-in Presencial QR + GPS** | [`/checkin`](https://passaporteshopping.vercel.app/checkin) | Leitor de câmera ao vivo, geofence de 250m e totens oficiais das lojas com QR Code de balcão. |
| **Catálogo de Recompensas** | [`/recompensas`](https://passaporteshopping.vercel.app/recompensas) | Resgate de vantagens usando o saldo de pontos com débito automático no banco. |
| **Carteira de Vouchers (SSE)** | [`/vouchers`](https://passaporteshopping.vercel.app/vouchers) | Vouchers com QR Code e cronômetro de validade (2h), com baixa em tempo real. |
| **Extrato Contábil Auditável** | [`/extrato`](https://passaporteshopping.vercel.app/extrato) | Livro-razão contábil listando todas as movimentações e saldos do visitante. |
| **Portal do Lojista** | [`/lojista`](https://passaporteshopping.vercel.app/lojista) | Terminal para validação de vouchers dos clientes no caixa da loja com câmera. |
| **Painel Administrativo** | [`/admin`](https://passaporteshopping.vercel.app/admin) | Indicadores gerenciais, auditoria, ajuste de raio geográfico e exportação de relatórios. |
| **Login & Cadastro (+50 pts)** | [`/login`](https://passaporteshopping.vercel.app/login) | Cadastro sem fricção com +50 pontos de boas-vindas e sessão JWT segura. |

---

## 2️⃣ Arquitetura do Repositório

O projeto segue arquitetura limpa em camadas orientada a domínios modulares (*Domain-Driven Monolith*):

```
passaporteshopping/
├── src/
│   ├── app/                         # Next.js 15 App Router (Páginas e APIs Serverless)
│   │   ├── (auth)/                  # Autenticação (Login, Cadastro, OTP)
│   │   ├── (visitor)/               # Área do Visitante (Passaporte, Checkin, Extrato, Vouchers)
│   │   ├── admin/                   # Painel do Shopping
│   │   ├── lojista/                 # Terminal de Validação do Lojista
│   │   └── api/                     # Endpoints REST e Realtime SSE
│   ├── components/                  # Componentes de UI e Experiência do Usuário
│   │   ├── auth/                    # Portal de Acesso e Formulários
│   │   ├── layout/                  # Barra Superior e Navegação Global
│   │   └── shared/                  # Passaporte, Totem QR Code, Scanner de Câmera e WhatsApp Card
│   ├── infrastructure/              # Adaptadores de Nuvem e Banco de Dados
│   │   ├── authentication/          # Sessão JWT e Cookies HttpOnly
│   │   ├── database/                # Conexão HTTP Neon Serverless PostgreSQL
│   │   └── integrations/            # Mensageria e Conexões Externas
│   ├── modules/                     # Regras de Negócio e Casos de Uso
│   │   ├── authentication/          # Registro e Verificação de Usuários
│   │   ├── checkin/                 # Validação QR Code e Cerca Virtual (Haversine)
│   │   ├── gamification/            # Regras de Carimbos e Níveis
│   │   ├── points/                  # Ledger Imutável de Créditos e Débitos
│   │   ├── rewards/                 # Catálogo e Emissão de Vouchers
│   │   └── visitor/                 # Agregação do Passaporte do Visitante
│   └── shared/                      # Constantes, Schemas Zod e Tipagens TypeScript
├── docs/                            # Documentação Técnica e de Produto Completa
├── scripts/                         # Scripts de Testes de Conexão e Verificação
└── RESUMO_AVALIADORES.md            # Resumo Executivo Oficial para a Banca
```

---

## 3️⃣ Tecnologias Incorporadas

* **Next.js 15 (App Router & Serverless Functions):** Renderização híbrida SSR/Static com Server Actions.
* **React 19 & TypeScript:** Tipagem estrita de ponta a ponta sem tipos `any` inseguros.
* **Neon Serverless PostgreSQL (`@neondatabase/serverless`):** Banco de dados relacional em nuvem com driver HTTP leve, sem gargalos de conexão e com garantias ACID.
* **HTML5-QRCode & QRCode.js:** Leitura de QR Code em tempo real pela câmera do aparelho e geração visual de totens de balcão.
* **Server-Sent Events (SSE):** Conexão unidirecional em tempo real para sincronização instantânea entre visitante e caixa da loja.
* **Geolocalização (Fórmula de Haversine):** Cálculo de distância esférica na Terra para garantir presença a menos de 250m do shopping.
* **Tailwind CSS (Warm Editorial Mall):** Identidade visual exclusiva nas cores Dourado Escuro (`#7a580f`), Dourado Claro (`#c59b4e`), Verde Esmeralda (`#1b6d24`) e Marfim (`#fcf9f8`).

---

## 4️⃣ Instruções de Execução Local

Siga os passos abaixo para clonar, configurar e executar o projeto na sua máquina:

### Pré-requisitos
* **Node.js:** Versão 20.x ou superior (testado com Node.js 24).
* **NPM:** Gerenciador de pacotes padrão.

### Passo a Passo

```bash
# 1. Clone o repositório
git clone https://github.com/pmwmaster/passaporteshopping.git
cd passaporteshopping

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Copie o arquivo de exemplo:
cp .env.example .env
# (O .env já contém credenciais do Neon PostgreSQL e configurações padrão pré-configuradas)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build de Produção Local
Para simular a compilação exata da Vercel:
```bash
npm run build
npm run start
```

---

## 5️⃣ Credenciais de Teste / Demonstração

Para facilitar a avaliação da banca, você pode criar uma conta nova em 10 segundos ou utilizar as contas demonstrativas já preparadas:

* **Visitante:** `mariana.alves@exemplo.com.br` | Senha: `Password@2026`
* **Lojista (Café Jalapão):** `gerencia@cafejalapao.com.br` | Senha: `Password@2026`
* **Administração do Shopping:** `admin@passedourado.com.br` | Senha: `Password@2026`
