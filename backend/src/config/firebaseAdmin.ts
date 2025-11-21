import * as admin from 'firebase-admin';

const serviceAccount = require('../../serviceAccountKey.json'); // You need to create this file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yara-speckit.firebaseio.com"
});

export const auth = admin.auth();
export const firestore = admin.firestore();
