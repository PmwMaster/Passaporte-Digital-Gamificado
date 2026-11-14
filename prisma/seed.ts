// ==============================================================================
// SEED INICIAL DO NEON POSTGRESQL — PASSAPORTE DIGITAL CAPIM DOURADO SHOPPING
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed no Neon Serverless PostgreSQL (neondb)...');

  const defaultHash = await bcrypt.hash('Password@2026', 10);

  // 1. Configuração global de Geofence (250m) do Capim Dourado Shopping
  await prisma.systemConfig.upsert({
    where: { key: 'SHOPPING_GEOFENCE' },
    update: {},
    create: {
      key: 'SHOPPING_GEOFENCE',
      value: JSON.stringify({
        latitude: -10.1845,
        longitude: -48.3337,
        radiusMeters: 250,
      }),
      description:
        'Coordenadas oficiais e raio Haversine (250m) do Capim Dourado Shopping',
    },
  });

  // 2. Lojas Parceiras iniciais
  const cafeJalapao = await prisma.store.upsert({
    where: { slug: 'cafe-jalapao-gourmet' },
    update: {},
    create: {
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
  });

  const atelierOuro = await prisma.store.upsert({
    where: { slug: 'atelier-ouro-do-cerrado' },
    update: {},
    create: {
      slug: 'atelier-ouro-do-cerrado',
      name: 'Atelier Ouro do Cerrado',
      category: 'MODA',
      floor: 'Piso 1 • Ala Norte',
      unitNumber: 'L-118',
      description:
        'Joias autorais em capim dourado legítimo, bolsas artesanais e acessórios exclusivos de alta curadoria.',
      qrCodeToken: 'QR-CD-STORE-02-VERIFIED',
      checkInPoints: 60,
      latitude: -10.18452,
      longitude: -48.33371,
      isFeatured: true,
      isActive: true,
    },
  });

  await prisma.store.upsert({
    where: { slug: 'gelateria-sol-de-palmas' },
    update: {},
    create: {
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
  });

  // 3. Recompensa inicial na loja Café Jalapão
  await prisma.reward.upsert({
    where: { id: 'rew_seed_01' },
    update: {},
    create: {
      id: 'rew_seed_01',
      storeId: cafeJalapao.id,
      title: 'Espresso Duplo + Pão de Queijo Recheado',
      description:
        'Degustação especial preparada por barista com grãos selecionados e pão de queijo artesanal na chapa.',
      rules:
        'Válido para consumo presencial na loja em até 2 horas após a emissão do voucher.',
      pointsCost: 160,
      initialStock: 50,
      availableStock: 18,
      maxPerVisitor: 2,
      voucherValidityHours: 2,
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  });

  // 4. Campanha inicial aprovada
  await prisma.campaign.upsert({
    where: { slug: 'temporada-ouro-do-cerrado' },
    update: {},
    create: {
      storeId: atelierOuro.id,
      title: 'Temporada Ouro do Cerrado • Pontos em Dobro',
      slug: 'temporada-ouro-do-cerrado',
      description:
        'Realize check-in nas lojas participantes e acumule selos especiais no seu Passaporte Digital.',
      bonusMultiplier: 2.0,
      status: 'APPROVED',
      startsAt: new Date('2026-11-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  // 5. Visitante Demo
  await prisma.user.upsert({
    where: { email: 'mariana.alves@exemplo.com.br' },
    update: {},
    create: {
      name: 'Mariana Alves Tocantins',
      email: 'mariana.alves@exemplo.com.br',
      phone: '+5563992114455',
      passwordHash: defaultHash,
      role: 'VISITOR',
      isPhoneVerified: true,
      lgpdConsentAt: new Date(),
      lgpdConsentVersion: '1.0',
      visitorProfile: {
        create: {
          memberCode: 'CD-2026-0148',
          level: 'GOLD',
          currentPoints: 640,
          lifetimePoints: 1420,
          totalCheckIns: 14,
          totalStamps: 9,
        },
      },
    },
  });

  // 6. Lojista Demo
  await prisma.user.upsert({
    where: { email: 'gerencia@cafejalapao.com.br' },
    update: {},
    create: {
      name: 'Roberto Mendes (Gerente Café Jalapão)',
      email: 'gerencia@cafejalapao.com.br',
      phone: '+5563999887766',
      passwordHash: defaultHash,
      role: 'MERCHANT',
      isPhoneVerified: true,
      lgpdConsentAt: new Date(),
      lgpdConsentVersion: '1.0',
      merchant: {
        create: {
          storeId: cafeJalapao.id,
          cnpj: '12.345.678/0001-90',
          jobTitle: 'Gerente Geral',
          isApproved: true,
        },
      },
    },
  });

  // 7. Administrador Demo
  await prisma.user.upsert({
    where: { email: 'admin@capimdouradoshopping.com.br' },
    update: {},
    create: {
      name: 'Diretoria Marketing Capim Dourado',
      email: 'admin@capimdouradoshopping.com.br',
      phone: '+556332150000',
      passwordHash: defaultHash,
      role: 'ADMIN',
      isPhoneVerified: true,
      lgpdConsentAt: new Date(),
      lgpdConsentVersion: '1.0',
      administrator: {
        create: {
          department: 'Marketing & Operações',
          permissionLevel: 'SUPER_ADMIN',
        },
      },
    },
  });

  console.log('Seed concluído com sucesso no Neon PostgreSQL!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
