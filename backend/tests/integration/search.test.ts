// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test-domain';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.FIREBASE_APP_ID = 'test-app-id';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
      applicationDefault: jest.fn()
    },
    firestore: jest.fn(() => ({
      collection: jest.fn(() => ({
        add: jest.fn(() => ({ id: 'mock-doc-id' })),
        get: jest.fn(() => ({ 
          empty: false, 
          forEach: jest.fn(),
          docs: [
            { data: () => ({ transcription: 'nature walk and trees' }) },
            { data: () => ({ transcription: 'nature hike in the mountains' }) }
          ]
        })),
        where: jest.fn((field, operator, value) => ({
          where: jest.fn(() => ({
            get: jest.fn(() => {
              // Mock search logic - return results that start with the search term
              if (value === 'nature') {
                return {
                  docs: [
                    { data: () => ({ transcription: 'nature walk and trees' }) },
                    { data: () => ({ transcription: 'nature hike in the mountains' }) }
                  ]
                };
              } else if (value === 'nomatch') {
                return { docs: [] };
              } else {
                return { docs: [] };
              }
            })
          }))
        })),
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn()
        }))
      })),
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn()
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        commit: jest.fn()
      })),
      listCollections: jest.fn(() => [] as any[])
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({
          save: jest.fn(),
          getSignedUrl: jest.fn(() => ['http://test-url'])
        })),
        getFiles: jest.fn(() => [[] as any[]]),
        deleteFiles: jest.fn()
      }))
    })),
    auth: jest.fn(() => ({
      listUsers: jest.fn(() => ({ users: [] as any[] })),
      deleteUsers: jest.fn(),
      verifyIdToken: jest.fn()
    }))
  }
}));

jest.mock('firebase-admin/app', () => ({
  applicationDefault: jest.fn()
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

// Mock Firebase AI modules
jest.mock('@firebase/ai', () => ({
  getAI: jest.fn(),
  getGenerativeModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        candidates: [{
          content: {
            parts: [{
              text: 'mock transcription'
            }]
          }
        }]
      }
    })
  }))
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn()
}));

// Mock the AI services
jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));

jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));

const request = require('supertest');
const express = require('express');
const firebaseAdmin = require('#config/firebaseAdmin');
const { router: audioApiRouter } = require('#api/audio');

// Extract db and auth from the mocked Firebase Admin
const { db, auth } = firebaseAdmin;

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/audio', audioApiRouter);

describe('Audio API Search Endpoint Integration', () => {
    const SEARCH_USER_ID = 'search-test-user-id';

    beforeEach(async () => {
        await clearFirestore();
        await clearAuth();
        jest.clearAllMocks();
        // Mock auth verification
        jest.spyOn(auth, 'verifyIdToken').mockResolvedValue({ uid: SEARCH_USER_ID } as any);
    });

    it('should return 400 if query parameter \'q\' is missing', async () => {
        const res = await request(app)
            .get('/audio/search')
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'Query parameter "q" is required and must be a non-empty string.' });
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app).get('/audio/search?q=test');
        expect(res.statusCode).toEqual(401);
    });

    it('should return audio entries matching the search query', async () => {
        // Explicitly update Firestore documents with specific transcriptions for search
        // The API uses a prefix search (starts-with), so the transcription must start with the query.
        const userAudioCollection = db.collection(`users/${SEARCH_USER_ID}/audioEntries`);
        await userAudioCollection.add({ transcription: 'nature walk and trees' });
        await userAudioCollection.add({ transcription: 'city buildings and cars' });
        await userAudioCollection.add({ transcription: 'nature hike in the mountains' });

        const res = await request(app)
            .get('/audio/search')
            .query({ q: 'nature' })
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(2);
        // The results might not be in order, so check for existence
        const returnedIds = res.body.map((entry: any) => entry.transcription);
        expect(returnedIds).toContain('nature walk and trees');
        expect(returnedIds).toContain('nature hike in the mountains');
    }, 20000); // Increased timeout for file operations and Firestore updates

    it('should return an empty array if no audio entries match the search query', async () => {
        // Manually add an entry to 'audioEntries' collection which the search endpoint queries
        const userAudioCollection = db.collection(`users/${SEARCH_USER_ID}/audioEntries`);
        await userAudioCollection.add({
            userId: SEARCH_USER_ID,
            title: 'No Match Test',
            transcription: 'unique transcription',
            tags: [],
            createdAt: new Date()
        });

        const res = await request(app)
            .get('/audio/search')
            .query({ q: 'nomatch' })
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    }, 15000);
});

// --- Emulator Cleanup Functions ---
const clearFirestore = async () => {
    const collections = await db.listCollections();
    for (const collection of collections) {
        const querySnapshot = await collection.get();
        if (querySnapshot.empty) continue;
        
        const batch = db.batch();
        for (const doc of querySnapshot.docs) {
             batch.delete(doc.ref);
        }
        await batch.commit();
    }
    // Also clear specific user subcollections if they aren't covered by listCollections (which lists root collections)
    // However, since we are creating dynamic paths, we might need to explicitly target them or use recursive delete logic.
    // For this specific test, we know the path:
    const searchUserEntries = await db.collection(`users/search-test-user-id/audioEntries`).get();
    if (!searchUserEntries.empty) {
        const batch = db.batch();
        searchUserEntries.forEach((doc: any) => batch.delete(doc.ref));
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
}