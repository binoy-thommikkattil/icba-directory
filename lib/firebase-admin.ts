import { cert, getApp, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'icba-directory-admin';

let adminApp: App | null = null;

interface AdminCredential {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function normalizePrivateKey(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let key = raw.trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseServiceAccountJson(rawJson: string): AdminCredential {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson) as Record<string, unknown>;
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON. Paste the full service-account JSON object as a single string.'
    );
  }

  const projectId = readString(parsed.project_id) || readString(parsed.projectId);
  const clientEmail = readString(parsed.client_email) || readString(parsed.clientEmail);
  const privateKey = normalizePrivateKey(parsed.private_key || parsed.privateKey);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT JSON is missing required fields (project_id, client_email, private_key).'
    );
  }

  return { projectId, clientEmail, privateKey };
}

function assertCredentialShape(credential: AdminCredential) {
  const missing: string[] = [];
  if (!credential.projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!credential.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!credential.privateKey) missing.push('FIREBASE_PRIVATE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin credentials are not configured. Missing environment variable(s): ${missing.join(', ')}. ` +
      'Either set all three, or set FIREBASE_SERVICE_ACCOUNT to the JSON key.'
    );
  }

  if (!credential.clientEmail.includes('@')) {
    throw new Error('FIREBASE_CLIENT_EMAIL appears malformed. It must be the service account client_email value.');
  }

  if (!credential.privateKey.includes('BEGIN PRIVATE KEY') || !credential.privateKey.includes('END PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY appears malformed. It must include BEGIN/END PRIVATE KEY and use literal \\n escapes in Vercel.'
    );
  }
}

function resolveCredential(): AdminCredential {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const credential = serviceAccountJson && serviceAccountJson.trim().length > 0
    ? parseServiceAccountJson(serviceAccountJson)
    : {
        projectId: readString(process.env.FIREBASE_PROJECT_ID) || readString(process.env.GOOGLE_CLOUD_PROJECT),
        clientEmail: readString(process.env.FIREBASE_CLIENT_EMAIL),
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      };

  assertCredentialShape(credential);
  return credential;
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  try {
    adminApp = getApp(ADMIN_APP_NAME);
    return adminApp;
  } catch {
    // Named app does not exist yet; initialize it below with validated creds.
  }

  const { projectId, clientEmail, privateKey } = resolveCredential();

  try {
    const serviceAccount: ServiceAccount = { projectId, clientEmail, privateKey };
    adminApp = initializeApp({ credential: cert(serviceAccount), projectId }, ADMIN_APP_NAME);
    return adminApp;
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err);
    throw new Error(
      'Firebase Admin failed to initialise with the provided credentials. ' +
      'Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT).'
    );
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
