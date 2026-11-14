# Passaporte Digital Gamificado —  Shopping (Palmas - TO)

Plataforma web responsiva (**PWA**) de fidelização, gamificação, check-ins presenciais por QR Code + Geolocalização (**Haversine 250m**) e resgate de recompensas em tempo real (**Server-Sent Events**) para o **Shopping**.

---

## 1. Documentação Arquitetural e de Produto (`docs/`)

Toda a documentação técnica, de produto e de governança entre os três desenvolvedores encontra-se estruturada na pasta `docs/`:

- [`docs/PRD.md`](./docs/PRD.md) — **Product Requirements Document**: Visão do produto, requisitos funcionais por módulo, requisitos não funcionais, histórias de usuário com critérios de aceitação e escopo do MVP.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — **Arquitetura Técnica**: Monolito modular em 5 camadas (Presentation, API, Application, Domain, Infrastructure), stack tecnológica e fluxo SSE.
- [`docs/DATABASE.md`](./docs/DATABASE.md) — **Modelagem de Dados**: Diagrama Entidade-Relacionamento (DER), descrição dos 13 domínios, compatibilidade SQLite/PostgreSQL e garantias transacionais ACID.
- [`docs/API_CONTRACTS.md`](./docs/API_CONTRACTS.md) — **Contratos de API**: Especificação detalhada dos endpoints REST e SSE compartilhados pelos três desenvolvedores.
- [`docs/BUSINESS_RULES.md`](./docs/BUSINESS_RULES.md) — **Regras de Negócio**: Fórmula de Haversine (raio de 250m), limite diário de check-in, ledger imutável de pontos, carimbos, missões e vouchers.
- [`docs/TEAM_DIVISION.md`](./docs/TEAM_DIVISION.md) — **Divisão de Trabalho (3 Devs / 9 Funcionalidades)**: Mapa de responsabilidades, *code ownership* por pasta, estratégia de branches e checklist de Pull Request.
- [`docs/DEVELOPMENT_GUIDE.md`](./docs/DEVELOPMENT_GUIDE.md) — **Guia de Desenvolvimento**: Como instalar, configurar variáveis de ambiente e executar localmente.
- [`docs/DUVIDAS_E_PREMISSAS.md`](./docs/DUVIDAS_E_PREMISSAS.md) — **Dúvidas e Decisões Pendentes (P0, P1 e P2)**: Mapeamento completo das definições comerciais/técnicas em aberto e recomendações arquiteturais.

---

## 2. Divisão das 9 Funcionalidades entre os 3 Desenvolvedores

| Desenvolvedor | Frente | Funcionalidades | Módulos (`src/modules/*`) |
| :--- | :--- | :--- | :--- |
| **Desenvolvedor 01** | Experiência do Visitante | **01.** Vitrine Pública e Lojas Parceiras<br>**02.** Autenticação e Cadastro (JWT + OTP + LGPD)<br>**03.** Passaporte e Perfil do Visitante | `storefront`<br>`authentication`<br>`visitor` |
| **Desenvolvedor 02** | Gamificação e Pontuação | **04.** Check-in e Validação por QR Code + GPS (Haversine 250m)<br>**05.** Gamificação, Carimbos e Missões<br>**06.** Sistema de Pontos e Extrato Auditável (Ledger) | `checkin`<br>`gamification`<br>`points` |
| **Desenvolvedor 03** | Comércio e Administração | **07.** Catálogo de Recompensas e Vouchers (SSE)<br>**08.** Portal do Lojista<br>**09.** Painel Administrativo | `rewards`<br>`merchant`<br>`administration` |

---

## 3. Identidade Visual Oficial (*Warm Editorial Mall*)

- **Paleta:** Dourado Escuro (`#7a580f`), Dourado Claro (`#c59b4e`), Verde Esmeralda (`#1b6d24`), Fundo Marfim (`#fcf9f8`).
- **Tipografia:** *Playfair Display* (títulos editoriais e cartão de membro) e *Outfit* (interface, formulários e indicadores).
- **Protótipo HTML de Referência:** Preservado em [`prototipos/index.html`](./prototipos/index.html).

---

## 4. Como Executar o Projeto Localmente

```bash
# 1. Preencha sua DATABASE_URL (pooled) e DIRECT_URL do Neon PostgreSQL no arquivo .env
# (Veja o modelo em .env.example)

# 2. Instale as dependências
npm install

# 3. Gere o Prisma Client e publique o schema PostgreSQL na sua branch do Neon
npx prisma generate
npx prisma db push

# 4. Inicie o WebApp Next.js
npm run dev
```

Acesse `http://localhost:3000` e utilize a barra superior para navegar entre todos os ambientes (Vitrine Pública, Login/Cadastro, Passaporte do Visitante, Check-in QR + GPS, Missões, Extrato, Recompensas, Carteira de Vouchers com SSE, Portal do Lojista e Painel Administrativo).
