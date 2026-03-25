/**
 * InsForge Bridge for AIMS Event API
 * Mirrors data to InsForge/Stitch for ecosystem-wide consistency.
 * The MyClaw spoke API writes directly to InsForge; this bridge ensures
 * AIMS hub also has synchronized access for admin dashboards and analytics.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const insforgeUrl = process.env.INSFORGE_URL || 'https://api.insforge.dev/v1/your-project';
const insforgeKey = process.env.INSFORGE_ANON_KEY || '';

let insforge: SupabaseClient | null = null;

function getInsforge(): SupabaseClient {
  if (!insforge) {
    insforge = createClient(insforgeUrl, insforgeKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    });
  }
  return insforge;
}

export async function syncRegistrationToInsforge(registration: {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  paymentStatus: string;
  source?: string;
}) {
  try {
    const client = getInsforge();
    await client.from('event_registrations').upsert({
      id: registration.id,
      name: registration.name,
      email: registration.email,
      ticketType: registration.ticketType,
      payment_status: registration.paymentStatus,
      source: registration.source || 'aims-direct',
      synced_from: 'aims-hub',
      synced_at: new Date().toISOString()
    }, { onConflict: 'id' });

    // Log stitch trace
    await client.from('acheevy_traces').insert({
      trace_id: `aims-sync-${registration.id}-${Date.now()}`,
      engine: 'aims-insforge-bridge',
      action: 'event.registration.sync',
      payload: JSON.stringify(registration),
      resolution: `AIMS hub synced registration ${registration.id}`,
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[insforge-bridge] Sync failed:', err.message);
  }
}

export async function syncSponsorToInsforge(sponsor: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  tierInterest: string;
  status?: string;
}) {
  try {
    const client = getInsforge();
    await client.from('sponsor_inquiries').upsert({
      id: sponsor.id,
      company_name: sponsor.companyName,
      contact_name: sponsor.contactName,
      email: sponsor.email,
      tier_interest: sponsor.tierInterest,
      status: sponsor.status || 'new',
      synced_from: 'aims-hub',
      synced_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (err: any) {
    console.error('[insforge-bridge] Sponsor sync failed:', err.message);
  }
}

export async function getInsforgeEventStats() {
  try {
    const client = getInsforge();
    const [regs, paid, sponsors] = await Promise.all([
      client.from('event_registrations').select('*', { count: 'exact', head: true }),
      client.from('event_registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'completed'),
      client.from('sponsor_inquiries').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalRegistrations: regs.count || 0,
      paidRegistrations: paid.count || 0,
      sponsorInquiries: sponsors.count || 0,
      source: 'insforge'
    };
  } catch (err: any) {
    console.error('[insforge-bridge] Stats query failed:', err.message);
    return null;
  }
}
