/**
 * Shared Firebase Admin SDK initialization
 * All modules import from here instead of using stubs.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function initFirebase(): Firestore {
  if (getApps().length === 0) {
    // Determine credentials source
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Explicit credentials from environment
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'ai-managed-services',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle newline escaping in env vars
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Service account key file
      app = initializeApp({
        credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
      });
    } else {
      // Default credentials (GCP environment / emulator)
      app = initializeApp();
    }
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  return db;
}

// Initialize on import
db = initFirebase();

export { db, FieldValue };
export default db;
