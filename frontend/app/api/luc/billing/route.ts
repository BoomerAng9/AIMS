/**
 * LUC Billing API - Change Order Tracking
 *
 * Receives change order billing events and updates the usage ledger.
 * This integrates with the LUC ADK billing engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/require-role';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ChangeOrderBillingEvent {
  type: 'change_order';
  orderId: string;
  sessionId: string;
  userId: string;
  department: string;
  inputCount: number;
  inputTypes: string[];
  tokenEstimate: number;
  costEstimate: number;
  waitDuration: number;
  priority: string;
  timestamp: string;
}

interface BillingRecord {
  id: string;
  userId: string;
  sessionId: string;
  eventType: string;
  description: string;
  tokens: number;
  cost: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// In-memory store for demo (use database in production)
const billingLedger: BillingRecord[] = [];

// ─────────────────────────────────────────────────────────────
// POST - Record Billing Event
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const event: ChangeOrderBillingEvent = await request.json();
    event.userId = auth.user.email;

    // Validate required fields
    if (!event.orderId || !event.userId || !event.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, userId, sessionId' },
        { status: 400 }
      );
    }

    // Create billing record
    const record: BillingRecord = {
      id: `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: 'change_order',
      description: `Change Order: ${event.inputCount} input(s) from ${event.department}`,
      tokens: event.tokenEstimate,
      cost: event.costEstimate,
      metadata: {
        orderId: event.orderId,
        department: event.department,
        inputTypes: event.inputTypes,
        waitDuration: event.waitDuration,
        priority: event.priority,
      },
      createdAt: new Date(event.timestamp),
    };

    billingLedger.push(record);

    // Calculate session totals
    const sessionRecords = billingLedger.filter(
      r => r.sessionId === event.sessionId
    );
    const sessionTotal = {
      totalRecords: sessionRecords.length,
      totalTokens: sessionRecords.reduce((sum, r) => sum + r.tokens, 0),
      totalCost: sessionRecords.reduce((sum, r) => sum + r.cost, 0),
    };

    console.log('[LUC Billing] Recorded:', {
      recordId: record.id,
      ...sessionTotal,
    });

    return NextResponse.json({
      success: true,
      recordId: record.id,
      session: sessionTotal,
    });
  } catch (error) {
    console.error('[LUC Billing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record billing event' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GET - Get Billing Summary
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const requestedUserId = searchParams.get('userId');
    const userId = auth.user.role === 'OWNER' || auth.user.role === 'ADMIN'
      ? requestedUserId
      : auth.user.email;

    let records = billingLedger;

    if (sessionId) {
      records = records.filter(r => r.sessionId === sessionId);
    }

    if (userId) {
      records = records.filter(r => r.userId === userId);
    }

    // Calculate totals
    const summary = {
      records: records.map(r => ({
        id: r.id,
        eventType: r.eventType,
        description: r.description,
        tokens: r.tokens,
        cost: r.cost,
        createdAt: r.createdAt,
      })),
      totals: {
        count: records.length,
        tokens: records.reduce((sum, r) => sum + r.tokens, 0),
        cost: records.reduce((sum, r) => sum + r.cost, 0),
      },
      byType: {
        change_order: {
          count: records.filter(r => r.eventType === 'change_order').length,
          tokens: records
            .filter(r => r.eventType === 'change_order')
            .reduce((sum, r) => sum + r.tokens, 0),
          cost: records
            .filter(r => r.eventType === 'change_order')
            .reduce((sum, r) => sum + r.cost, 0),
        },
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[LUC Billing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get billing summary' },
      { status: 500 }
    );
  }
}
