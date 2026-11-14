// ==============================================================================
// SEED INICIAL DO NEON POSTGRESQL — PASSAPORTE DIGITAL CAPIM DOURADO SHOPPING
// ==============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed no Neon Serverless PostgreSQL...');

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
      description: 'Coordenadas oficiais e raio Haversine (250m) do Capim Dourado Shopping',
    },
  });

  // 2. Loja Parceira inicial
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

  // 3. Visitante Demo
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

  // 4. Lojista Demo
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

  // 5. Administrador Demo
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
