import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { db, storage, auth } from '#config/firebaseAdmin';
import { router as audioApiRouter } from '#api/audio';

// Mock the external services that are not part of this integration test
jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));
jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));

// Create a test Express app
const app = express();
app.use('/audio', audioApiRouter);

// --- Test Suite ---
describe('Audio API Search Endpoint Integration', () => {
    const SEARCH_USER_ID = 'search-test-user-id';

    beforeEach(async () => {
        await clearFirestore();
        await clearAuth();
        jest.clearAllMocks();
    });

    it('should return 400 if query parameter \'q\' is missing', async () => {
        const res = await request(app).get('/audio/search');

        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'Query parameter "q" is required.' });
    });

    it('should return audio entries matching the search query', async () => {
        // Explicitly update Firestore documents with specific transcriptions for search
        // The API uses a prefix search (starts-with), so the transcription must start with the query.
        await db.collection('audioEntries').add({ transcription: 'nature walk and trees' });
        await db.collection('audioEntries').add({ transcription: 'city buildings and cars' });
        await db.collection('audioEntries').add({ transcription: 'nature hike in the mountains' });

        const res = await request(app).get('/audio/search').query({ q: 'nature' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(2);
        // The results might not be in order, so check for existence
        const returnedIds = res.body.map((entry: any) => entry.transcription);
        expect(returnedIds).toContain('nature walk and trees');
        expect(returnedIds).toContain('nature hike in the mountains');
    }, 20000); // Increased timeout for file operations and Firestore updates

    it('should return an empty array if no audio entries match the search query', async () => {
        // Manually add an entry to 'audioEntries' collection which the search endpoint queries
        const docRef = await db.collection('audioEntries').add({
            userId: SEARCH_USER_ID,
            title: 'No Match Test',
            transcription: 'unique transcription',
            tags: [],
            createdAt: new Date()
        });

        const res = await request(app).get('/audio/search').query({ q: 'nomatch' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    }, 15000);
});

// --- Emulator Cleanup Functions ---
const clearFirestore = async () => {
    const collections = await db.listCollections();
    for (const collection of collections) {
        // This is a simplified cleanup. For nested collections, a recursive approach would be needed.
        const querySnapshot = await collection.get();
        if (querySnapshot.empty) {
            continue;
        }
        const batch = db.batch();
        querySnapshot.forEach((doc: { ref: FirebaseFirestore.DocumentReference<any, any>; }) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
};

const clearAuth = async () => {
    try {
        const { users } = await auth.listUsers();
        if (users.length > 0) {
            await auth.deleteUsers(users.map((u: { uid: any; }) => u.uid));
        }
    } catch (error) {
        console.error("Error clearing auth emulator", error)
    }
};

