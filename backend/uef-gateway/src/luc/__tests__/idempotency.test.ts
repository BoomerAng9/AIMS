/**
 * LUC allocator — webhook idempotency (process each Stripe event once).
 */

import { LUC_EVENTS_SCHEMA_SQL } from '../schema';
import { SqlDb } from '../sqlite-ledger';
import { markEventProcessed, unmarkEvent } from '../idempotency';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (p: string) => SqlDb & { exec(s: string): void } };

function freshDb(): SqlDb {
  const db = new DatabaseSync(':memory:');
  db.exec(LUC_EVENTS_SCHEMA_SQL);
  return db;
}

describe('markEventProcessed', () => {
  it('first claim wins; duplicate delivery loses', () => {
    const db = freshDb();
    expect(markEventProcessed(db, 'evt_1')).toBe(true);
    expect(markEventProcessed(db, 'evt_1')).toBe(false); // dup — skip
    expect(markEventProcessed(db, 'evt_2')).toBe(true);
  });

  it('unmarkEvent releases the claim so a retry can re-process', () => {
    const db = freshDb();
    expect(markEventProcessed(db, 'evt_1')).toBe(true);
    expect(markEventProcessed(db, 'evt_1')).toBe(false);
    unmarkEvent(db, 'evt_1');
    expect(markEventProcessed(db, 'evt_1')).toBe(true);
  });
});
