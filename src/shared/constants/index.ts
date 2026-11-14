// ==============================================================================
// CONSTANTES COMPARTILHADAS — PASSAPORTE DIGITAL PASSE DOURADO SHOPPING
// ==============================================================================

export const SHOPPING_CONFIG = {
  name: 'Passe Dourado Shopping',
  city: 'Palmas - TO',
  timezone: 'America/Araguaia',
  officialWhatsApp: '5563991142038',
  officialWhatsAppDisplay: '(63) 99114-2038',
  defaultCoordinates: {
    latitude: -10.1845,
    longitude: -48.3337,
  },
  defaultGeofenceRadiusMeters: 250,
  defaultVoucherValidityHours: 2,
} as const;

export const VISUAL_TOKENS = {
  aesthetic: 'Warm Editorial Mall',
  colors: {
    goldDark: '#7a580f',
    goldLight: '#c59b4e',
    emerald: '#1b6d24',
    ivory: '#fcf9f8',
    ink: '#1f1a14',
    muted: '#6e6253',
  },
  fonts: {
    heading: 'Playfair Display',
    body: 'Outfit',
  },
} as const;

export const STORE_CATEGORIES = [
  { id: 'TODOS', label: 'Todas as Categorias' },
  { id: 'GASTRONOMIA', label: 'Gastronomia & Cafés' },
  { id: 'MODA', label: 'Moda & Acessórios' },
  { id: 'BELEZA', label: 'Beleza & Bem-Estar' },
  { id: 'LAZER', label: 'Cinema & Lazer' },
  { id: 'SERVICOS', label: 'Serviços & Conveniência' },
  { id: 'TECNOLOGIA', label: 'Tecnologia & Eletrônicos' },
] as const;

export const PASSPORT_LEVELS = {
  BRONZE: {
    id: 'BRONZE',
    label: 'Bronze Cerrado',
    minLifetimePoints: 0,
    nextLevelPoints: 500,
  },
  SILVER: {
    id: 'SILVER',
    label: 'Prata Araguaia',
    minLifetimePoints: 500,
    nextLevelPoints: 1200,
  },
  GOLD: {
    id: 'GOLD',
    label: 'Ouro Passe Dourado',
    minLifetimePoints: 1200,
    nextLevelPoints: 3000,
  },
  DIAMOND: {
    id: 'DIAMOND',
    label: 'Diamante Embaixador',
    minLifetimePoints: 3000,
    nextLevelPoints: 5000,
  },
} as const;
