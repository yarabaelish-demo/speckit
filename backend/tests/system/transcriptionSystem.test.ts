import { describe, expect, it, beforeAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storage } from '#config/firebaseAdmin';
import { transcribeAudio } from '#services/transcriptionService';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We'll reuse the sample audio file from the unit test folder if available, or assume it's there
const AUDIO_FILENAME = 'sample.m4a';
// Adjust path to point to where the sample audio is located (relative to this test file)
const AUDIO_FILE_PATH = path.resolve(__dirname, '../unit/sample.m4a'); 

const BUCKET_NAME = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.firebasestorage.app` : 'yara-speckit.firebasestorage.app'; // Assuming default bucket name convention
const REMOTE_PATH = `system-tests/${Date.now()}-${AUDIO_FILENAME}`;

describe('Transcription System Test (Real Services)', () => {
  
  beforeAll(() => {
    // Ensure we are NOT using the storage emulator for this test if we want real storage
    // However, #config/firebaseAdmin might initialize with emulators if NODE_ENV=test.
    // We might need to force it to use real credentials or ensure setupEnv.js is NOT loaded for this specific test run
    // or override the env vars here.
    
    // IMPORTANT: This test expects valid GOOGLE_APPLICATION_CREDENTIALS to be set in .env
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not set. System test may fail.');
    }
  });

  it('should upload audio to REAL GCS and transcribe it using Firebase/Vertex AI', async () => {
    // 1. Check if file exists
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
        // Fallback: Create a dummy file if sample.mp3 is missing, though real transcription will fail to produce meaningful text.
        // Better to throw.
        throw new Error(`Test file not found at ${AUDIO_FILE_PATH}. Please run unit tests first to download it.`);
    }

    console.log(`Uploading ${AUDIO_FILENAME} to real bucket: ${BUCKET_NAME}...`);

    // 2. Upload to Real Storage
    // Note: We use the admin SDK. If NODE_ENV=test, firebaseAdmin.ts might use the emulator.
    // We need to ensure we are hitting real storage.
    // If the test runner loaded setupEnv.js, STORAGE_EMULATOR_HOST is set.
    // We can try to unset it for this test, but the admin app might be already initialized.
    // For a true system test, we usually run with a different NODE_ENV (e.g. NODE_ENV=system) or just rely on the fact
    // that we want to test the *service* which uses the initialized app.
    
    // If we want to force real storage, we might need to initialize a separate app or assume the environment is configured for it.
    // Let's assume we run this test with `NODE_ENV=system` or similar where setupEnv.js is NOT loaded.
    
    const [file] = await storage.bucket(BUCKET_NAME).upload(AUDIO_FILE_PATH, {
        destination: REMOTE_PATH,
        metadata: { contentType: 'audio/m4a' }
    });

    console.log(`File uploaded to ${file.name}.`);

    const gcsUri = `gs://${BUCKET_NAME}/${REMOTE_PATH}`;

    // 3. Call Transcription Service
    console.log(`Calling transcribeAudio with ${gcsUri}...`);
    const transcription = await transcribeAudio(gcsUri);

    console.log('Transcription Result:', transcription);

    // 4. Assertions
    expect(transcription).toBeDefined();
    expect(transcription).not.toBe('No transcription available.');
    expect(transcription.length).toBeGreaterThan(0);
    console.log(transcription);
    
    // 5. Cleanup
    console.log('Cleaning up...');
    await file.delete();
  }, 120000); // 2 minutes timeout for real API
});
