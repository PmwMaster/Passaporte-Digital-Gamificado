# Guia de Desenvolvimento — Passaporte Digital Gamificado

## 1. Pré-requisitos do Ambiente (WebApp + Neon PostgreSQL)

- **Node.js:** `v20.x` ou superior (validado em `v24.15.0`)
- **Gerenciador de Pacotes:** `npm` (`v10+` ou `v11+`)
- **Banco de Dados Oficial:** **Neon Serverless PostgreSQL** (`provider = "postgresql"`)
- **Formato da Aplicação:** **WebApp Responsivo (Mobile-First + PWA)** acessível direto pelo navegador do smartphone (visitantes/lojistas) e desktop (lojistas/admin).

---

## 2. Configuração Rápida (Quick Start com Neon PostgreSQL)

1. **Configure suas strings de conexão do Neon no arquivo `.env`:**
   No painel do [Neon Console](https://console.neon.tech), copie as duas URLs da sua branch de banco de dados e preencha no `.env`:
   - `DATABASE_URL`: String com **Pooled connection** (`...-pooler.../neondb?sslmode=require&pgbouncer=true&connect_timeout=15`)
   - `DIRECT_URL`: String com **Direct connection** (`.../neondb?sslmode=require`)

2. **Instale as dependências do projeto:**
   ```bash
   npm install
   ```

3. **Gere o Prisma Client e sincronize o schema PostgreSQL no Neon:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Execute o servidor de desenvolvimento do WebApp:**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação no navegador:**
   - **Vitrine Pública (Dev 01):** `http://localhost:3000/`
   - **Autenticação / Cadastro (Dev 01):** `http://localhost:3000/login` e `http://localhost:3000/cadastro`
   - **Passaporte do Visitante (Dev 01 / Dev 02):** `http://localhost:3000/passaporte`
   - **Check-in QR Code + GPS (Dev 02):** `http://localhost:3000/checkin`
   - **Missões & Carimbos (Dev 02):** `http://localhost:3000/missoes`
   - **Extrato de Pontos (Dev 02):** `http://localhost:3000/extrato`
   - **Catálogo de Recompensas & Vouchers (Dev 03):** `http://localhost:3000/recompensas` e `http://localhost:3000/vouchers`
   - **Portal do Lojista (Dev 03):** `http://localhost:3000/lojista`
   - **Painel Administrativo (Dev 03):** `http://localhost:3000/admin`

---

## 3. Uso de Dados Mockados vs. Banco de Dados Real

Nesta primeira etapa de fundação arquitetural:
- Todas as páginas e Route Handlers funcionam imediatamente utilizando o repositório demonstrativo estruturado em `src/infrastructure/database/mock-data.ts`, que preserva os dados, fluxos e identidade visual *Warm Editorial Mall* sem exigir integrações externas ativas.
- Os contratos de domínio (`src/shared/types/domain.ts`), schemas de validação Zod (`src/shared/schemas/api.schemas.ts`) e regras de domínio (`src/modules/*/domain/`) já estão implementados com a lógica real (incluindo o cálculo matemático de Haversine, avaliação de progresso de missões e invariantes do ledger de pontos).
- Quando cada desenvolvedor iniciar a persistência definitiva de suas 3 funcionalidades, basta substituir a chamada do repositório em memória pelo `prismaClient` em `src/infrastructure/database/prisma.ts`, mantendo os casos de uso (`application/`) e as rotas (`app/api/`) intactos.

---

## 4. Regras de Estilo e Identidade Visual (Warm Editorial Mall)

Toda nova tela ou componente deve seguir rigorosamente os tokens de design configurados em `src/styles/globals.css` e `tailwind.config.ts`:

| Token | Cor Hex | Uso Principal |
| :--- | :--- | :--- |
| `brand-gold-dark` | `#7a580f` | Botões primários, títulos de destaque, bordas nobres do passaporte |
| `brand-gold-light` | `#c59b4e` | Gradientes dourados, selos conquistados, detalhes editoriais |
| `brand-emerald` | `#1b6d24` | Indicadores de sucesso, check-in validado, vouchers ativos, saldo positivo |
| `brand-ivory` | `#fcf9f8` | Fundo principal da aplicação (Warm Ivory) |
| `font-serif` | `Playfair Display` | Títulos editoriais, cabeçalhos de páginas, nome no Cartão de Membro |
| `font-sans` | `Outfit` | Textos corridos, botões, tabelas, badges, formulários e métricas |

---

## 5. Convenções de Código nas 5 Camadas

1. **Presentation (`src/app`, `src/components`):** Componentes React focados em UX, estados de interface e acessibilidade. Sem regras de negócio embutidas.
2. **API (`src/app/api`):** Route Handlers enxutos que validam o input via Zod e delegam para `src/modules/<modulo>/application/`.
3. **Application (`src/modules/<modulo>/application`):** Casos de uso orientados às histórias do PRD.
4. **Domain (`src/modules/<modulo>/domain`):** Funções e classes puras facilmente testáveis com testes unitários (`tests/unit`).
5. **Infrastructure (`src/infrastructure`):** Prisma, JWT, SSE e adaptadores externos.
