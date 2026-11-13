# Tech Spec — Parte 3: Administração, PWA e Entrega Final

| Campo | Valor |
|---|---|
| **Status** | Planejado |
| **Depende de** | Parte 1 e Parte 2 |
| **Telas** | 05 Painel Administrativo do Shopping · banners da Tela 01 · banner de instalação PWA |
| **Protótipos** | `tela_05_painel_administrativo_do_shopping` / `tela_05_painel_administrativo_do_shopping_desktop`, `tela_01_vitrine_aberta(_desktop)` |

---

## 1. Objetivo

Entregar à administração do shopping o **controle do ecossistema** (lojas, credenciais, curadoria de ofertas, banners, QR Codes e geocerca) e a **visão de indicadores**; finalizar o produto como **PWA instalável**, publicado com HTTPS e pronto para a apresentação à banca.

## 2. Escopo

### Dentro do escopo
- Login de administrador (perfil `ADMIN`) e proteção da rota `/admin`.
- Dashboard: KPIs, pico de check-ins por hora, ranking de locais, resgates x utilizados, filtros (Hoje / 7 dias / Mês).
- **Fila de aprovação** de ofertas (`PENDENTE → ATIVA` ou `RECUSADA` com motivo) — ativa o fluxo de aprovação criado na Parte 2.
- Ordem e período dos banners da vitrine (Box 1 / Box 2).
- Gestão de lojas e contas de lojista (criar, ativar/desativar, redefinir senha/PIN do POS).
- Cadastro de locais e **gerador de QR Codes/totens** (PNG e PDF A4) com raio de geocerca (150 / 250 / 400 m).
- Ajuste de missões (pontos de bônus) e exportação CSV de cupons para auditoria.
- Botão **Seed de demonstração** (somente em ambiente de teste).
- PWA: `manifest`, ícones, service worker (cache do *app shell*), banner "Instalar" (Android) e instrução para iOS.
- Deploy, README final e roteiro de demonstração.

### Fora do escopo
- Notificações push, multi-shopping, integração financeira com o FPP.

## 3. Regras de negócio

| Código | Regra |
|---|---|
| RN-30 | Somente `ADMIN` acessa `/admin` e `/api/admin/*`. |
| RN-31 | Ofertas criadas pelo lojista entram como `PENDENTE` e só aparecem na vitrine após aprovação. |
| RN-32 | Recusa exige motivo, exibido ao lojista no painel. |
| RN-33 | Desativar uma loja oculta suas ofertas e bloqueia o login do lojista e o check-in do QR. |
| RN-34 | O QR contém apenas um token assinado do local (sem coordenadas ou pontos expostos). |
| RN-35 | **Taxa de retorno** = visitantes com check-in em ≥ 2 dias no período ÷ visitantes com check-in no período. |
| RN-36 | **Conversão de cupons** = vouchers utilizados ÷ vouchers resgatados no período. |
| RN-37 | Indicadores exibem apenas dados agregados (sem dados pessoais) — LGPD. |
| RN-38 | Seed de demonstração bloqueado quando `NODE_ENV=production` sem flag explícita. |

## 4. Modelo de dados (adições)

```prisma
model Banner {
  id        String   @id @default(cuid())
  posicao   String   // "B1" | "B2"
  ordem     Int
  titulo    String
  imagemUrl String
  ofertaId  String?
  inicioEm  DateTime
  fimEm     DateTime
  ativo     Boolean  @default(true)
}

model ConfigMissao {
  tipo        TipoMissao @id
  meta        Int
  bonusPontos Int
  ativa       Boolean    @default(true)
}

model LogAuditoria {
  id        String   @id @default(cuid())
  usuarioId String
  acao      String   // APROVAR_OFERTA, RECUSAR_OFERTA, REDEFINIR_POS...
  alvoId    String
  detalhes  String?
  criadoEm  DateTime @default(now())
}
```

## 5. API (planejado)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/indicadores?periodo=` | KPIs, check-ins por hora, ranking de locais, conversão |
| GET | `/api/admin/ofertas/pendentes` | Fila de aprovação |
| POST | `/api/admin/ofertas/[id]/aprovar` · `/recusar` | Decisão com motivo + log de auditoria |
| GET/POST/PATCH | `/api/admin/lojas` | Gestão de lojas |
| POST | `/api/admin/lojas/[id]/credenciais` | Cria/redefine conta do lojista (PIN temporário) |
| GET/POST/PATCH | `/api/admin/banners` | Ordem e período dos banners |
| GET/POST/PATCH | `/api/admin/locais` | Locais, raio e pontos |
| GET | `/api/admin/locais/[id]/qrcode?formato=png\|pdf` | Gera arte do totem |
| GET/PATCH | `/api/admin/missoes` | Configuração das missões |
| GET | `/api/admin/export/cupons.csv` | Relatório de auditoria |
| POST | `/api/admin/seed` | Dados de demonstração (somente teste) |

> [!TIP]
> Os indicadores podem ser atualizados a cada 30 s (*polling*) no MVP. Reaproveitar o EventBus da Parte 2 para empurrar novos check-ins ao dashboard é uma evolução natural da tecnologia sorteada, mas não é obrigatória.

## 6. PWA

| Item | Especificação |
|---|---|
| Manifest | `app/manifest.ts` — nome "Passaporte Capim Dourado", `display: standalone`, `theme_color #7a580f`, `background_color #fcf9f8`, ícones 192/512 e *maskable* |
| Service worker | Cache do *app shell* e assets estáticos; rotas de API e SSE **sempre em rede** (nunca em cache) |
| Instalação | Captura `beforeinstallprompt` → botão "Instalar"; no iOS, instrução *Compartilhar → Adicionar à Tela de Início*; dispensa válida por 7 dias |
| Offline | Página "Sem conexão" com botão Tentar novamente |

## 7. Deploy e ambientes

| Ambiente | Banco | Hospedagem |
|---|---|---|
| Desenvolvimento | SQLite (`prisma/dev.db`) | `localhost` |
| Demonstração / Produção | PostgreSQL gerenciado | Servidor Node persistente com HTTPS (Render, Railway ou VPS) — requisito do SSE, câmera e GPS |

Variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`, `QR_SECRET`, `SHOPPING_LAT`, `SHOPPING_LNG`, `SEED_HABILITADO`.

## 8. Estrutura de pastas planejada (adições)

```text
src/
├── app/
│   ├── admin/(painel)/page.tsx           # Dashboard
│   ├── admin/(painel)/lojas/ · banners/ · qrcodes/ · missoes/
│   ├── manifest.ts
│   └── api/admin/*
├── components/admin/ (graficos, fila-aprovacao, gerador-totem)
├── server/services/ (indicadores, aprovacao, qrcode, exportacao)
└── public/ (icons/, sw.js)
```

## 9. Critérios de aceite

- [ ] Visitante ou lojista recebem 403 ao acessar `/admin`.
- [ ] Oferta nova do lojista só aparece na vitrine após aprovação; recusa mostra o motivo ao lojista.
- [ ] Admin cria loja + credencial e o lojista consegue entrar com ela.
- [ ] QR gerado (PNG/PDF) é lido pelo app e gera check-in respeitando o raio configurado.
- [ ] Dashboard bate com os dados do banco para o período filtrado.
- [ ] CSV exportado abre corretamente no Excel/Sheets (UTF-8 com BOM, separador `;`).
- [ ] App instalável no Android e com instrução no iOS; Lighthouse PWA sem erros críticos.
- [ ] Deploy público com HTTPS e SSE funcionando ponta a ponta.

## 10. Roteiro da demonstração para a banca (≈ 5 min)

1. **Admin:** mostra o dashboard, aprova uma oferta do Havanna Café e exibe o totem QR gerado.
2. **Visitante (celular do jurado):** abre a vitrine sem login → entra na loja → cria conta (+50 pts) → escaneia o totem (+10 pts, carimbo, missão avança).
3. **Resgate:** troca pontos pelo Cappuccino → voucher aparece em "Meus Cupons".
4. **Tempo real:** integrante como atendente valida o código no Painel do Lojista → **o celular do jurado muda sozinho para ✅ Utilizado**.
5. **Fechamento:** dashboard admin reflete o check-in e a conversão do cupom.

## 11. Checklist de entrega final

- [ ] README com descrição, arquitetura, tecnologias, telas e tecnologia sorteada
- [ ] Tech specs (este diretório) atualizados com o que foi realmente implementado
- [ ] Protótipos mobile e desktop em `/prototipos`
- [ ] Seed de demonstração e credenciais de teste documentadas
- [ ] Link do deploy e vídeo/GIF curto do fluxo de tempo real
