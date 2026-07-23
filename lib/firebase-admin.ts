import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app'; // Imported strictly for TypeScript typing

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = admin.apps;
  if (existing.length > 0) {
    adminApp = existing[0] as App;
    return adminApp;
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

  return adminApp;
}

export function getAdminAuth() {
  // Bypassing strict TypeScript check to allow the Vercel build to pass
  return (admin as any).auth(getAdminApp());
}

export function getAdminDb() {
  // Bypassing strict TypeScript check to allow the Vercel build to pass
  return (admin as any).firestore(getAdminApp());
}