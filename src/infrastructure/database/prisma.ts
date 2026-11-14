// ==============================================================================
// COMPATIBILIDADE DE CAMADA DE DADOS — REDIRECIONA PARA O CLIENTE LEVE NEON HTTP
// ==============================================================================
// Mantido para retrocompatibilidade de imports. O projeto utiliza o driver HTTP
// oficial da Neon (@neondatabase/serverless) em `neon.ts` sem dependência de
// binários nativos do Prisma no build da Vercel.

export {
  getNeonSql,
  ensureNeonTables,
  isNeonConfigured,
} from './neon';
