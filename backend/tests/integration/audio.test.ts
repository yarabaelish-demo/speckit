import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, storage, auth } from '#config/firebaseAdmin';

// ESM Mocking
jest.unstable_mockModule('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));
jest.unstable_mockModule('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));

// Dynamic imports for modules under test are required after unstable_mockModule
const { uploadAudio, getAudioEntry } = await import('#services/audioService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Test Suite ---
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
        querySnapshot.forEach(doc => {
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
