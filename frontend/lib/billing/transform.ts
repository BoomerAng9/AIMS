export interface BillingResponse {
  records: {
    id: string;
    eventType: string;
    description: string;
    tokens: number;
    cost: number;
    createdAt: string;
  }[];
  totals: {
    count: number;
    tokens: number;
    cost: number;
  };
  byType: {
    change_order: {
      count: number;
      tokens: number;
      cost: number;
    };
  };
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'recorded';
  eventType: string;
}

export function mapBillingRecordsToInvoices(billing?: BillingResponse): Invoice[] {
  return (billing?.records || []).map((record) => ({
    id: record.id,
    date: new Date(record.createdAt).toLocaleDateString(),
    amount: record.cost,
    status: 'recorded',
    eventType: record.eventType,
  }));
}
