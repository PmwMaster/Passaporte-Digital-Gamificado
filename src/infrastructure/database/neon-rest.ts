// ==============================================================================
// CLIENTE AUXILIAR NEON DATA API (POSTGREST) — INFRASTRUCTURE LAYER
// ==============================================================================
// Endpoint configurado: https://ep-ancient-sunset-bef18lgk.apirest.c-9.us-east-2.aws.neon.tech/neondb/rest/v1

export const NEON_REST_BASE_URL =
  process.env.NEON_DATA_API_URL ??
  'https://ep-ancient-sunset-bef18lgk.apirest.c-9.us-east-2.aws.neon.tech/neondb/rest/v1';

export async function queryNeonRestApi<T>(
  tablePath: string,
  bearerToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  const response = await fetch(`${NEON_REST_BASE_URL}/${tablePath.replace(/^\//, '')}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Neon Data API HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
