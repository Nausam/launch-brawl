import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;

export function getFirestoreDatabaseId() {
  const configured = process.env.FIRESTORE_DATABASE_ID?.trim();
  if (!configured || configured === "(default)" || configured === "default") return "launch-brawl";
  return configured;
}

export function getFirebaseAdminApp() {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    return cachedApp;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  cachedApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return cachedApp;
}

export function getAdminDb() {
  if (cachedDb) return cachedDb;
  const app = getFirebaseAdminApp();
  if (!app) return null;
  cachedDb = getFirestore(app, getFirestoreDatabaseId());
  try {
    cachedDb.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    if (!(error instanceof Error && /already been initialized/i.test(error.message))) throw error;
  }
  return cachedDb;
}

export function disableAdminDb() {
  // Kept as a compatibility hook for repositories. A transient Firestore
  // failure must never permanently disable the process or trigger fake data.
  cachedDb = null;
}

export function isFirestoreUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return code === 7 || code === "permission-denied" || /PERMISSION_DENIED|insufficient permissions/i.test(message);
}
