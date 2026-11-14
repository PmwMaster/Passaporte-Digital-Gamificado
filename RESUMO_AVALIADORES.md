# 🏆 RESUMO EXECUTIVO DO PROJETO — HACKARUN
> **Documento oficial de 1 página para leitura prévia dos avaliadores**  
> **MVP em Produção:** [https://passaporteshopping.vercel.app](https://passaporteshopping.vercel.app)

---

### 1. Nome do Projeto
**Passaporte Digital Passe Dourado Shopping**

---

### 2. Problema Identificado
Os shopping centers enfrentam o **"ponto cego" do varejo físico**: diariamente, milhares de pessoas circulam pelos corredores, mas a administração não sabe quem são 90% desses visitantes, qual o canal de contato direto com eles nem seus hábitos de consumo. Aplicativos tradicionais de shopping falharam porque exigem downloads pesados na App Store/Play Store (alta barreira de entrada). Como consequência, o shopping perde a capacidade de reengajamento, os lojistas sofrem com fluxo ocioso e não há incentivo para o visitante explorar diferentes pisos e categorias de lojas (*cross-shopping*).

---

### 3. Público-Alvo
* **Visitantes & Clientes:** Frequentadores do shopping que buscam recompensas, descontos e experiências exclusivas com zero atrito de instalação.
* **Lojistas Parceiros:** Marcas que precisam atrair clientes diretamente para suas vitrines e validar benefícios no caixa de forma rápida e segura.
* **Administração & Marketing do Shopping:** Gestores que necessitam de base de dados proprietária qualificada (LGPD), inteligência de tráfego e métricas comprovadas para os lojistas.

---

### 4. Solução Proposta
Uma plataforma web responsiva (**PWA**) instantânea que roda diretamente no navegador do smartphone, transformando a ida ao shopping em uma jornada gamificada. Ao visitar lojas parceiras fisicamente, o cliente realiza check-ins via QR Code + Geolocalização (cerca virtual de 250m), acumula carimbos digitais no seu passaporte, sobe de categoria e troca seus pontos por vouchers com cronômetro de validade nos lojistas participantes.

---

### 5. Descrição do Produto (MVP Desenvolvido)
O produto está **100% funcional e publicado em nuvem**, cobrindo o ciclo completo:
* **Autenticação Descomplicada:** Cadastro instantâneo com crédito imediato de **+50 pontos de boas-vindas**.
* **Validação Anti-Fraude via WhatsApp:** Botão de ativação em 1 toque diretamente no canal oficial do shopping (`(63) 99114-2038`), comprovando que o visitante é real e impedindo contas fakes.
* **Check-in Presencial com Câmera & Geofence:** Leitor de QR Code integrado pela câmera do celular com validação matemática de geolocalização (Fórmula de Haversine dentro do raio de 250m do shopping).
* **Totens Oficiais de Balcão:** Gerador visual de QR Codes oficiais prontos para os balcões das lojas.
* **Passaporte Gamificado:** Sistema de carimbos por categoria (Gastronomia, Moda, Lazer, Tecnologia) e níveis progressivos (*Bronze, Prata, Ouro e Diamante*).
* **Catálogo de Recompensas & Vouchers com Urgência:** Resgate de vantagens com geração de voucher com QR Code e validade de 2 horas.
* **Portal do Lojista & Validação em Tempo Real:** Leitor do lojista (`/lojista`) com baixa instantânea via *Server-Sent Events (SSE)*.
* **Extrato Contábil & Painel Administrativo:** Livro-razão auditável de pontos (`/extrato`) e painel de gestão com auditoria e exportação CSV (`/admin`).

---

### 6. Tecnologias Utilizadas
* **Frontend & Backend:** Next.js 15 (App Router, Serverless Functions, Server Actions), React 19, TypeScript.
* **Estilização & UX:** Tailwind CSS com identidade editorial de luxo (*Warm Editorial Mall*).
* **Banco de Dados em Nuvem:** Neon Serverless PostgreSQL com driver HTTP nativo de alta performance e persistência ACID.
* **Recursos de Hardware:** HTML5-QRCode (leitor de câmera em tempo real), Geolocation API (GPS do dispositivo).
* **Comunicação em Tempo Real & Mensageria:** Server-Sent Events (SSE) para baixa instantânea de vouchers e deep links de ativação direta via WhatsApp.
* **Deploy & Infraestrutura:** Vercel Edge Network com SSL, CDN global e auto-scaling.

---

### 7. Diferencial e Inovação
1. **Zero Fricção (Sem App Store):** Nenhum download obrigatório; o visitante acessa via QR Code e já está usando.
2. **Proteção Anti-Fraude Proprietária:** A validação parte do WhatsApp real do cliente, eliminando bots e custos com SMS de gateway.
3. **Presença Física Mandatória:** O cliente só pontua se estiver fisicamente a menos de 250 metros da loja.
4. **Mecânica de Cross-Shopping:** Missões que premiam o cliente que consome em categorias distintas no mesmo dia.

---

### 8. Viabilidade e Aplicação no Shopping
* **Pronto para Implantação Imediata:** Solução desenvolvida para o contexto real do **Capim Dourado Shopping (Palmas - TO)**.
* **Custo Quase Zero de Infraestrutura:** Arquitetura Serverless que só consome recursos quando utilizada, sem servidores ociosos.
* **Monetização para o Shopping:** O shopping pode comercializar missões patrocinadas, destaque para novas lojas na vitrine e dados analíticos de consumo.
