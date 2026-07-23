import _admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Cast the entire default import to 'any' at the top level to silence Vercel's strict compiler
const admin: any = _admin;

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = admin.apps;
  if (existing.length > 0) {
    adminApp = existing[0] as App;
    return adminApp as App; // Fix: Explicitly tell TS this is not null
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
      projectId,
    });
  } else if (projectId && clientEmail && privateKey) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    adminApp = admin.initializeApp({ projectId });
  }

  return adminApp as App; // Fix: Explicitly tell TS this is not null
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

export function getAdminDb() {
  return admin.firestore(getAdminApp());
}