// ==============================================================================
// CENÁRIOS E2E PLANEJADOS — JORNADA COMPLETA DO VISITANTE AO BALCÃO DO LOJISTA
// ==============================================================================

export const E2E_SCENARIOS = [
  '1. Visitante navega na Vitrine Pública sem login e filtra lojas por Gastronomia.',
  '2. Visitante cria conta com aceite LGPD e recebe sessão JWT em cookie HttpOnly.',
  '3. Visitante realiza check-in presencial validado por Haversine (<= 250m) e ganha pontos + carimbo.',
  '4. Visitante resgata recompensa no catálogo e recebe voucher com código único.',
  '5. Lojista valida e confirma o voucher no Portal do Lojista, atualizando a tela do visitante via SSE.',
];
