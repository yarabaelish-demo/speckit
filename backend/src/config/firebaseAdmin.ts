import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';

// Prevent Firebase initialization during tests
if (process.env.NODE_ENV !== 'test') {
  if (!admin.apps || admin.apps.length === 0) { // Check if admin.apps is defined before accessing its length
    admin.initializeApp({
      credential: applicationDefault(),
      storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`
    });
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();