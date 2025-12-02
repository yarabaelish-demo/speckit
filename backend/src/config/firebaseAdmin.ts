import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;
let auth: admin.auth.Auth;

function initializeFirebase() {
    if (!admin.apps || admin.apps.length === 0) {
        if (process.env.NODE_ENV === 'test') {
            process.env['GCLOUD_PROJECT'] = 'demo-project';
            process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
            process.env['FIREBASE_STORAGE_EMULATOR_HOST'] = 'localhost:9199';
            process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';

            admin.initializeApp({
                projectId: 'demo-project',
                storageBucket: 'demo-project.appspot.com',
                credential: applicationDefault()             
            });
        } else {
            admin.initializeApp({
                credential: applicationDefault(),
                storageBucket: `${process.env.GCLOUD_PROJECT}.appspot.com`
            });
        }
    }
}

initializeFirebase();

export function getDb() {
    if (!db) {
        db = admin.firestore();
    }
    return db;
}

export function getStorage() {
    if (!storage) {
        storage = admin.storage();
    }
    return storage;
}

export function getAuth() {
    if (!auth) {
        auth = admin.auth();
    }
    return auth;
}