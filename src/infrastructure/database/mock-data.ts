// ==============================================================================
// DADOS DEMONSTRATIVOS OFICIAIS (MOCK STORE) — PASSE DOURADO SHOPPING
// ==============================================================================
// Utilizados para navegação funcional imediata das 9 funcionalidades sem exigir
// credenciais externas ou migração prévia obrigatória.

import {
  Campaign,
  CheckIn,
  Mission,
  Operator,
  PointTransaction,
  Reward,
  Stamp,
  Store,
  User,
  VisitorProfile,
  Voucher,
} from '@/shared/types/domain';

export const mockUsers: User[] = [
  {
    id: 'usr_visitor_01',
    name: 'Mariana Alves Tocantins',
    email: 'mariana.alves@exemplo.com.br',
    phone: '+5563992114455',
    role: 'VISITOR',
    isPhoneVerified: true,
    lgpdConsentAt: '2026-10-01T14:20:00.000Z',
    lgpdConsentVersion: '1.0',
    isActive: true,
    createdAt: '2026-10-01T14:20:00.000Z',
  },
  {
    id: 'usr_merchant_01',
    name: 'Roberto Mendes (Gerente Café Jalapão)',
    email: 'gerencia@cafejalapao.com.br',
    phone: '+5563999887766',
    role: 'MERCHANT',
    isPhoneVerified: true,
    lgpdConsentAt: '2026-09-15T10:00:00.000Z',
    lgpdConsentVersion: '1.0',
    isActive: true,
    createdAt: '2026-09-15T10:00:00.000Z',
  },
  {
    id: 'usr_admin_01',
    name: 'Diretoria Marketing Passe Dourado',
    email: 'admin@passedourado.com.br',
    phone: '+556332150000',
    role: 'ADMIN',
    isPhoneVerified: true,
    lgpdConsentAt: '2026-09-01T09:00:00.000Z',
    lgpdConsentVersion: '1.0',
    isActive: true,
    createdAt: '2026-09-01T09:00:00.000Z',
  },
];

export const mockVisitorProfile: VisitorProfile = {
  id: 'vis_01',
  userId: 'usr_visitor_01',
  visitorName: 'Mariana Alves Tocantins',
  memberCode: 'CD-2026-0148',
  level: 'BRONZE',
  currentPoints: 0,
  lifetimePoints: 0,
  totalCheckIns: 0,
  totalStamps: 0,
};

export const mockStores: Store[] = [
  {
    id: 'store_01',
    slug: 'cafe-jalapao-gourmet',
    name: 'Café Jalapão Gourmet',
    category: 'GASTRONOMIA',
    floor: 'Piso 2 • Praça Central',
    unitNumber: 'L-204',
    description:
      'Cafés especiais torrados na hora, pão de queijo artesanal e doces inspirados nos sabores do Cerrado tocantinense.',
    qrCodeToken: 'QR-CD-STORE-01-VERIFIED',
    checkInPoints: 40,
    latitude: -10.18448,
    longitude: -48.33368,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'store_02',
    slug: 'atelier-ouro-do-cerrado',
    name: 'Atelier Ouro do Cerrado',
    category: 'MODA',
    floor: 'Piso 1 • Ala Norte',
    unitNumber: 'L-118',
    description:
      'Joias autorais em ouro artesanal legítimo, bolsas artesanais e acessórios exclusivos de alta curadoria.',
    qrCodeToken: 'QR-CD-STORE-02-VERIFIED',
    checkInPoints: 60,
    latitude: -10.18452,
    longitude: -48.33371,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'store_03',
    slug: 'gelateria-sol-de-palmas',
    name: 'Gelateria Sol de Palmas',
    category: 'GASTRONOMIA',
    floor: 'Piso 2 • Praça de Alimentação',
    unitNumber: 'Q-219',
    description:
      'Gelatos italianos artesanais com sabores clássicos e frutas nativas como buriti, cajá e murici.',
    qrCodeToken: 'QR-CD-STORE-03-VERIFIED',
    checkInPoints: 35,
    latitude: -10.18445,
    longitude: -48.33362,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'store_04',
    slug: 'spa-botanico-araguaia',
    name: 'Spa Botânico Araguaia',
    category: 'BELEZA',
    floor: 'Piso 1 • Ala Sul',
    unitNumber: 'L-142',
    description:
      'Cosméticos naturais, aromaterapia, quick massage e rituais relaxantes para visitantes do shopping.',
    qrCodeToken: 'QR-CD-STORE-04-VERIFIED',
    checkInPoints: 50,
    latitude: -10.18455,
    longitude: -48.33375,
    isFeatured: false,
    isActive: true,
  },
  {
    id: 'store_05',
    slug: 'cine-passe-dourado-vip',
    name: 'Cine Passe Dourado Premier',
    category: 'LAZER',
    floor: 'Piso 2 • Ala Leste',
    unitNumber: 'L-250',
    description:
      'Salas de cinema de última geração com projeção laser, som imersivo e bomboniere gourmet.',
    qrCodeToken: 'QR-CD-STORE-05-VERIFIED',
    checkInPoints: 70,
    latitude: -10.18442,
    longitude: -48.33365,
    isFeatured: true,
    isActive: true,
  },
  {
    id: 'store_06',
    slug: 'tech-house-palmas',
    name: 'Tech House Palmas',
    category: 'TECNOLOGIA',
    floor: 'Piso 1 • Corredor Principal',
    unitNumber: 'L-109',
    description:
      'Smartphones, áudio premium, acessórios originais e assistência expressa especializada.',
    qrCodeToken: 'QR-CD-STORE-06-VERIFIED',
    checkInPoints: 45,
    latitude: -10.18449,
    longitude: -48.33369,
    isFeatured: false,
    isActive: true,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp_01',
    title: 'Temporada Ouro do Cerrado • Pontos em Dobro na Gastronomia',
    slug: 'temporada-ouro-do-cerrado',
    description:
      'Realize check-in nos cafés e restaurantes participantes de sexta a domingo e acumule selos especiais no seu Passaporte Digital.',
    bonusMultiplier: 2.0,
    status: 'APPROVED',
    startsAt: '2026-11-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.000Z',
  },
  {
    id: 'cmp_02',
    storeId: 'store_02',
    storeName: 'Atelier Ouro do Cerrado',
    title: 'Coleção Festas Passe Dourado',
    slug: 'colecao-festas-passe-dourado',
    description:
      'Visite o Atelier no Piso 1, conquiste o carimbo exclusivo de Moda Autoral e ganhe +60 pontos imediatos.',
    bonusMultiplier: 1.5,
    status: 'APPROVED',
    startsAt: '2026-11-10T00:00:00.000Z',
    endsAt: '2026-12-24T23:59:59.000Z',
  },
  {
    id: 'cmp_03',
    storeId: 'store_04',
    storeName: 'Spa Botânico Araguaia',
    title: 'Semana Relax Araguaia (Aguardando Moderação)',
    slug: 'semana-relax-araguaia',
    description: 'Bônus de +100 pontos para check-in em procedimentos de bem-estar.',
    bonusMultiplier: 1.5,
    status: 'PENDING_APPROVAL',
    startsAt: '2026-11-20T00:00:00.000Z',
    endsAt: '2026-11-30T23:59:59.000Z',
  },
];

export const mockStamps: Stamp[] = [];

export const mockMissions: Mission[] = [
  {
    id: 'mis_01',
    code: 'DAILY_CHECKIN_01',
    title: 'Presença Dourada do Dia',
    description: 'Realize 1 check-in presencial em qualquer loja parceira hoje.',
    frequency: 'DAILY',
    targetType: 'CHECKIN_COUNT',
    targetCount: 1,
    currentCount: 0,
    rewardPoints: 30,
    status: 'IN_PROGRESS',
    periodKey: '2026-11-14',
  },
  {
    id: 'mis_02',
    code: 'WEEKLY_GASTRO_03',
    title: 'Rota Gastronômica de Palmas',
    description: 'Visite 3 operações de Gastronomia & Cafés durante a semana.',
    frequency: 'WEEKLY',
    targetType: 'CATEGORY_VARIETY',
    targetCategory: 'GASTRONOMIA',
    targetCount: 3,
    currentCount: 0,
    rewardPoints: 120,
    status: 'IN_PROGRESS',
    periodKey: '2026-W46',
  },
  {
    id: 'mis_03',
    code: 'MONTHLY_EXPLORER_05',
    title: 'Embaixador Passe Dourado',
    description: 'Colecione 5 carimbos de lojas diferentes no mês de novembro.',
    frequency: 'MONTHLY',
    targetType: 'CHECKIN_COUNT',
    targetCount: 5,
    currentCount: 0,
    rewardPoints: 250,
    status: 'IN_PROGRESS',
    periodKey: '2026-11',
  },
];

export const mockPointTransactions: PointTransaction[] = [];

export const mockRewards: Reward[] = [
  {
    id: 'rew_01',
    storeId: 'store_01',
    storeName: 'Café Jalapão Gourmet',
    storeFloor: 'Piso 2 • L-204',
    title: 'Espresso Duplo + Pão de Queijo Recheado',
    description:
      'Degustação especial preparada por barista com grãos selecionados e pão de queijo artesanal na chapa.',
    rules: 'Válido para consumo presencial na loja em até 2 horas após a emissão do voucher.',
    pointsCost: 160,
    initialStock: 50,
    availableStock: 18,
    maxPerVisitor: 2,
    voucherValidityHours: 2,
    approvalStatus: 'APPROVED',
    isActive: true,
  },
  {
    id: 'rew_02',
    storeId: 'store_03',
    storeName: 'Gelateria Sol de Palmas',
    storeFloor: 'Piso 2 • Q-219',
    title: 'Upgrade para Gelato Coppa Grande (Sabores do Cerrado)',
    description:
      'Na compra de um gelato pequeno, apresente seu voucher para receber o tamanho Coppa Grande.',
    rules: 'Apresente o QR Code ao operador de caixa antes do fechamento do pedido.',
    pointsCost: 180,
    initialStock: 80,
    availableStock: 34,
    maxPerVisitor: 3,
    voucherValidityHours: 2,
    approvalStatus: 'APPROVED',
    isActive: true,
  },
  {
    id: 'rew_03',
    storeId: 'store_02',
    storeName: 'Atelier Ouro do Cerrado',
    storeFloor: 'Piso 1 • L-118',
    title: 'Porta-Cartões Artesanal em Passe Dourado + R$ 40 OFF',
    description:
      'Mimo exclusivo confeccionado por artesãos do Jalapão em compras acima de R$ 180.',
    rules: 'Limitado a 1 resgate por CPF/Passaporte durante a temporada.',
    pointsCost: 320,
    initialStock: 25,
    availableStock: 9,
    maxPerVisitor: 1,
    voucherValidityHours: 24,
    approvalStatus: 'APPROVED',
    isActive: true,
  },
  {
    id: 'rew_04',
    storeId: 'store_05',
    storeName: 'Cine Passe Dourado Premier',
    storeFloor: 'Piso 2 • L-250',
    title: 'Combo Pipoca Manteiga + Refrigerante 500ml Cortesia',
    description:
      'Resgate seu combo cortesia para acompanhar sua sessão no Cine Passe Dourado Premier.',
    rules: 'Válido todos os dias na bomboniere mediante apresentação do voucher ativo.',
    pointsCost: 280,
    initialStock: 40,
    availableStock: 14,
    maxPerVisitor: 2,
    voucherValidityHours: 2,
    approvalStatus: 'APPROVED',
    isActive: true,
  },
];

export const mockVouchers: Voucher[] = [];

export const mockCheckIns: CheckIn[] = [];

export const mockOperators: Operator[] = [
  {
    id: 'op_01',
    userId: 'usr_merchant_01',
    operatorName: 'Roberto Mendes (Balcão 01)',
    storeId: 'store_01',
    storeName: 'Café Jalapão Gourmet',
    badgeNumber: 'OP-JALAPAO-01',
    canManageOffers: true,
    isActive: true,
  },
];
