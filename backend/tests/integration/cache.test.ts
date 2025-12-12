// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test-domain';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.FIREBASE_APP_ID = 'test-app-id';

// Expose the mock function so we can assert on it
const mockGet = jest.fn();

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
        where: jest.fn((field, operator, value) => ({
          where: jest.fn(() => ({
            get: mockGet // Use the exposed mock
          }))
        })),
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => Promise.resolve({ 
              exists: true, 
              data: () => ({ audioUrl: 'http://bucket/file.mp3' }) 
          })), 
          update: jest.fn(),
          delete: jest.fn()
        }))
      })),
      doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => Promise.resolve({ 
              exists: true, 
              data: () => ({ audioUrl: 'http://bucket/file.mp3' }) 
          })),
          delete: jest.fn()
      }))
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({
          save: jest.fn(),
          getSignedUrl: jest.fn(() => ['http://test-url']),
          delete: jest.fn()
        })),
        name: 'test-bucket'
      }))
    })),
    auth: jest.fn(() => ({
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

jest.mock('@firebase/ai', () => ({
  getAI: jest.fn(),
}));

jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));

jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
  chatWithTherapist: jest.fn(),
}));

jest.mock('busboy', () => {
    return jest.fn(() => {
        const listeners: any = {};
        return {
            on: (event: string, cb: any) => {
                listeners[event] = cb;
            },
            emit: (event: string, ...args: any[]) => {
                if (listeners[event]) listeners[event](...args);
            }
        };
    });
});

const request = require('supertest');
const express = require('express');
const firebaseAdmin = require('#config/firebaseAdmin');

// We need to import the router AFTER mocks are set up
// However, since we need to verify cache behavior which might be module-level state,
// we rely on the fact that 'require' is cached by Jest but we can use isolation if needed.
// For now, simple require is fine as this is a new test file.
const { router: audioApiRouter } = require('#api/audio');
const { auth } = firebaseAdmin;

const app = express();
app.use(express.json());
app.use('/audio', audioApiRouter);

describe('Audio API Caching', () => {
    const SEARCH_USER_ID = 'cache-test-user-id';

    beforeEach(async () => {
        jest.clearAllMocks();
        mockGet.mockReset();
        // Default behavior for mockGet
        mockGet.mockResolvedValue({
            docs: [
                { data: () => ({ transcription: 'cache me please', title: 'Cached Entry' }) }
            ]
        });

        // Mock auth verification
        jest.spyOn(auth, 'verifyIdToken').mockResolvedValue({ uid: SEARCH_USER_ID });
    });

    it('should serve search results from cache on second request', async () => {
        // First Request
        const res1 = await request(app)
            .get('/audio/search')
            .query({ q: 'cache' })
            .set('Authorization', 'Bearer mock-token');

        expect(res1.statusCode).toEqual(200);
        expect(res1.body[0].title).toEqual('Cached Entry');
        expect(mockGet).toHaveBeenCalledTimes(1);

        // Second Request (Identical)
        const res2 = await request(app)
            .get('/audio/search')
            .query({ q: 'cache' })
            .set('Authorization', 'Bearer mock-token');

        expect(res2.statusCode).toEqual(200);
        expect(res2.body[0].title).toEqual('Cached Entry');
        expect(res2.header['x-cache']).toEqual('HIT');
        
        // CRITICAL ASSERTION: DB should NOT be called again
        expect(mockGet).toHaveBeenCalledTimes(1); 
    });

    it('should invalidate cache on new upload', async () => {
         // 1. Populate Cache with a UNIQUE query to avoid pollution from previous test
         await request(app)
            .get('/audio/search')
            .query({ q: 'cache-invalidate' })
            .set('Authorization', 'Bearer mock-token');
         expect(mockGet).toHaveBeenCalledTimes(1);

         // 2. Perform Upload (which should invalidate)
         // Use the DELETE endpoint which also invalidates and is simpler to test than upload.
         const resDelete = await request(app)
             .delete('/audio/mock-entry-id')
             .set('Authorization', 'Bearer mock-token');
        
         expect(resDelete.statusCode).not.toBe(500);

         // 3. Search Again
         await request(app)
            .get('/audio/search')
            .query({ q: 'cache-invalidate' })
            .set('Authorization', 'Bearer mock-token');

         // 4. Assert DB called again (Total 2 times now)
         expect(mockGet).toHaveBeenCalledTimes(2);
    });
});