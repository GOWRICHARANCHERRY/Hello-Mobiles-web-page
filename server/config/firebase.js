import { initializeApp } from 'firebase-admin';
import { cert } from 'firebase-admin/app';

let firebaseApp = null;

export function initFirebase() {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (serviceAccount.project_id && serviceAccount.private_key) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin initialized');
  } else {
    console.log('Firebase Admin not configured (using dev mode)');
  }

  return firebaseApp;
}

export async function verifyFirebaseToken(idToken) {
  if (!firebaseApp) {
    // Dev mode: decode without verification
    console.log('⚠️  Firebase token not verified (dev mode)');
    return null;
  }
  const decoded = await firebaseApp.auth().verifyIdToken(idToken);
  return decoded;
}
