import _admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Cast the default import to any to silence strict TS in Vercel's build.
const admin: any = _admin;

let adminApp: App | null = null;

interface AdminCredential {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) return '';
  // Support: (1) real newlines, (2) escaped \n newlines, (3) surrounding quotes from copy/paste in Vercel UI.
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

function resolveCredential(): AdminCredential {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson && serviceAccountJson.trim().length > 0) {
    let parsed: any;
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch (err) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. Paste the full service-account JSON object as a single string.'
      );
    }
    const projectId = parsed.project_id || parsed.projectId;
    const clientEmail = parsed.client_email || parsed.clientEmail;
    const privateKey = normalizePrivateKey(parsed.private_key || parsed.privateKey);
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT JSON is missing required fields (project_id, client_email, private_key).'
      );
    }
    return { projectId, clientEmail, privateKey };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const missing: string[] = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin credentials are not configured. Missing environment variable(s): ${missing.join(', ')}. ` +
      `Either set all three, or set FIREBASE_SERVICE_ACCOUNT to the JSON key.`
    );
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY appears malformed. It must contain "BEGIN PRIVATE KEY" and use \\n for newlines. ' +
      'The loader normalises \\n to real newlines via .replace(/\\\\n/g, "\\n").'
    );
  }

  return {
    projectId: projectId as string,
    clientEmail: clientEmail as string,
    privateKey,
  };
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = admin.apps;
  if (existing.length > 0) {
    adminApp = existing[0] as App;
    return adminApp as App;
  }

  const { projectId, clientEmail, privateKey } = resolveCredential();

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err);
    throw new Error(
      'Firebase Admin failed to initialise with the provided credentials. ' +
      'Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT).'
    );
  }

  return adminApp as App;
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}

export function getAdminDb() {
  return admin.firestore(getAdminApp());
}
