import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../serviceAccountKey.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://yara-speckit.firebaseio.com",
  storageBucket: "yara-speckit.firebasestorage.app"
});

export const auth = getAuth();
export const firestore = getFirestore();
export const storage = getStorage();
