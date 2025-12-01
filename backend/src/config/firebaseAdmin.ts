import * as admin from 'firebase-admin';

const serviceAccount = require('../../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`
});

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();