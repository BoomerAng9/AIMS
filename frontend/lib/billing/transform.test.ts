import { describe, expect, it } from 'vitest';
import { mapBillingRecordsToInvoices, type BillingResponse } from './transform';

describe('mapBillingRecordsToInvoices', () => {
  it('returns empty list for undefined billing data', () => {
    expect(mapBillingRecordsToInvoices(undefined)).toEqual([]);
  });

  it('maps API records to invoice rows with recorded status', () => {
    const billing: BillingResponse = {
      records: [
        {
          id: 'bill-1',
          eventType: 'change_order',
          description: 'Change Order',
          tokens: 42,
          cost: 1.25,
          createdAt: '2026-03-17T10:00:00.000Z',
        },
      ],
      totals: { count: 1, tokens: 42, cost: 1.25 },
      byType: { change_order: { count: 1, tokens: 42, cost: 1.25 } },
    };

    const invoices = mapBillingRecordsToInvoices(billing);
    expect(invoices).toHaveLength(1);
    expect(invoices[0].id).toBe('bill-1');
    expect(invoices[0].eventType).toBe('change_order');
    expect(invoices[0].status).toBe('recorded');
    expect(invoices[0].amount).toBe(1.25);
  });
});
