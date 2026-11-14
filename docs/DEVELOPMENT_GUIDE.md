# Guia de Desenvolvimento — Passaporte Digital Gamificado

## 1. Pré-requisitos do Ambiente (WebApp + Neon PostgreSQL)

- **Node.js:** `v20.x` ou superior (validado em `v24.15.0`)
- **Gerenciador de Pacotes:** `npm` (`v10+` ou `v11+`)
- **Banco de Dados Oficial:** **Neon Serverless PostgreSQL** (`provider = "postgresql"`)
- **Formato da Aplicação:** **WebApp Responsivo (Mobile-First + PWA)** acessível direto pelo navegador do smartphone (visitantes/lojistas) e desktop (lojistas/admin).

---

## 2. Configuração Rápida (Quick Start com Cliente Leve Neon HTTP — Zero Prisma Build)

Para garantir máxima velocidade de entrega e builds instantâneos na Vercel (sem depender de binários nativos do Prisma), o projeto utiliza o **driver oficial HTTP da Neon (`@neondatabase/serverless`)** em `src/infrastructure/database/neon.ts`, com criação automática de tabelas (`CREATE TABLE IF NOT EXISTS`) na primeira requisição.

1. **Configure sua string de conexão do Neon no arquivo `.env` (ou copie de `.env.example`):**
   - `DATABASE_URL`: String de conexão do Neon PostgreSQL (`postgresql://...`)
   - `NEON_DATA_API_URL`: Endpoint REST PostgREST da Neon

2. **Instale as dependências do projeto (sem etapa de `prisma generate`):**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento do WebApp (ou acesse direto na Vercel):**
   ```bash
   npm run dev
   ```
   - **Ambiente Oficial de Produção (Vercel):** `https://passaporteshopping.vercel.app`

4. **Como fazer consultas SQL no Neon em qualquer módulo (`src/infrastructure/database/neon.ts`):**
   ```ts
   import { ensureNeonTables, getNeonSql } from '@/infrastructure/database/neon';

   await ensureNeonTables();
   const sql = getNeonSql();
   const rows = await sql`SELECT * FROM app_users WHERE email = ${email}`;
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
