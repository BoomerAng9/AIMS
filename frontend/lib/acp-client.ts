/**
 * ACP Client — sends authenticated requests to the UEF Gateway via /api/acp
 *
 * The server-side API route enforces the authenticated userId from the session,
 * but we still pass it here for audit trail transparency.
 */
export async function sendACPRequest(
  message: string,
  intent: string = 'CHAT',
) {
  const res = await fetch('/api/acp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, intent }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `ACP Error: ${res.status}`);
  }

  return await res.json();
}
