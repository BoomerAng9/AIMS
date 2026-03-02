// Blockwise AI — A.I.M.S. Platform API Client
// Connects to LUC metering, Evidence Locker, and SDT services

const AIMS_API_URL = process.env.AIMS_API_URL || 'https://plugmein.cloud/api';
const AIMS_API_KEY = process.env.AIMS_API_KEY || '';

async function aimsRequest(path: string, body?: unknown) {
  const res = await fetch(`${AIMS_API_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AIMS_API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`A.I.M.S. API error: ${res.status} ${path}`);
  return res.json();
}

/** Meter a LUC usage event */
export async function meterLucUsage(key: string, amount: number, metadata?: Record<string, unknown>) {
  return aimsRequest('/luc/meter', { key, amount, metadata });
}

/** Store document in Evidence Locker */
export async function storeEvidence(title: string, content: string, contentType: string) {
  return aimsRequest('/evidence-locker/store', { title, content, contentType });
}

/** Generate a Secure Drop Token for document sharing */
export async function generateSdt(documentId: string, expiresIn: number = 7 * 24 * 60 * 60) {
  return aimsRequest('/sdt/generate', { documentId, expiresIn });
}

/** Get LUC quote for an operation */
export async function getLucQuote(operation: string) {
  return aimsRequest('/luc/quote', { operation });
}
