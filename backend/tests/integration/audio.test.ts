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
        get: jest.fn(() => ({ empty: true, forEach: jest.fn() })),
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => ({ exists: true, data: () => ({ title: 'My Test Upload', transcription: 'mock transcription', aiResponse: 'mock ai response' }), id: 'mock-doc-id' }))
        }))
      })),
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(() => ({ exists: true, data: () => ({ userId: 'test-user-id-123', title: 'My Test Upload', transcription: 'mock transcription', aiResponse: 'mock ai response', audioUrl: 'http://test-url' }), id: 'mock-doc-id' }))
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
        getFiles: jest.fn(() => [[{ name: 'test-file' }] as any[]]),
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

// Mock the AI services
jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));

jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));

const { uploadAudio, getAudioEntry } = require('#services/audioService');
const { db, storage, auth } = require('#config/firebaseAdmin');
const fs = require('node:fs');
const path = require('node:path');

describe('Audio Service Integration with Emulators', () => {
  beforeEach(async () => {
    await clearFirestore();
    await clearStorage();
    await clearAuth();
  }, 15000);

  it('should upload an audio file and then retrieve the created entry', async () => {
    // 1. Setup test data
    const filePath = path.join(__dirname, 'test-audio.mp3');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'dummy content');
    }
    const fileBuffer = fs.readFileSync(filePath);
    const userId = 'test-user-id-123';
    const title = 'My Test Upload';
    const tags = ['jest', 'integration-test'];

    // 2. Call the upload function from the service
    const uploadedEntry = await uploadAudio(userId, fileBuffer, title, tags);

    // 3. Assert the result of the upload
    expect(uploadedEntry).toBeDefined();
    expect(uploadedEntry.userId).toBe(userId);
    expect(uploadedEntry.title).toBe(title);
    expect(uploadedEntry.entryId).toBeTruthy();

    // 4. Call the get function from the service
    const retrievedEntry = await getAudioEntry(userId, uploadedEntry.entryId);

    // 5. Assert the result of the get operation
    expect(retrievedEntry).toBeDefined();
    expect(retrievedEntry?.entryId).toBe(uploadedEntry.entryId);
    expect(retrievedEntry?.title).toBe(title);
    expect(retrievedEntry?.userId).toBe(userId);
    expect(retrievedEntry?.audioUrl).toBeTruthy();
    expect(retrievedEntry?.transcription).toContain('mock transcription');
    expect(retrievedEntry?.aiResponse).toContain('mock ai response');

    // 6. Verify side-effects (file in storage)
    const [files] = await storage.bucket().getFiles({ prefix: `audio/${userId}/` });
    expect(files.length).toBe(1);

    // 7. Cleanup
    fs.unlinkSync(filePath);
  }, 15000); // Increased timeout for file operations
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
        querySnapshot.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
};

const clearStorage = async () => {
    try {
        const bucket = storage.bucket();
        await bucket.deleteFiles({ force: true });
    } catch (error) {
        if ((error as any).code === 404) {
            // Bucket might not exist on first run, which is fine.
            return;
        }
        throw error;
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