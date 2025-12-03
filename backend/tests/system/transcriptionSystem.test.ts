import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storage } from '#config/firebaseAdmin';
import dotenv from 'dotenv';

// Load environment variables from .env BEFORE any service imports
dotenv.config();

// Dynamically import transcribeAudio AFTER dotenv config runs
const { transcribeAudio } = await import('#services/transcriptionService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_FILENAME = 'sample.m4a';
const AUDIO_FILE_PATH = path.resolve(__dirname, '../unit/sample.m4a'); 

const BUCKET_NAME = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.firebasestorage.app` : 'yara-speckit.firebasestorage.app'; // Assuming default bucket name convention
const REMOTE_PATH = `system-tests/${Date.now()}-${AUDIO_FILENAME}`;

describe('Transcription System Test (Real Services)', () => {
  
  beforeAll(() => {
    console.log('\n--- System Test Environment Variables ---');
    console.log(`GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
    console.log(`FIREBASE_API_KEY: ${process.env.FIREBASE_API_KEY ? '*****' : 'NOT SET'}`);
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '*****' : 'NOT SET'}`);
    console.log('---------------------------------------\n');

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not set. System test may fail to upload to GCS.');
    }
    if (!process.env.FIREBASE_API_KEY) {
        console.warn('WARNING: FIREBASE_API_KEY not set. System test may fail to call Firebase AI.');
    }
  });

  afterAll(async () => {
    // Cleanup the uploaded file from GCS
    console.log('\n--- Cleaning up System Test file from GCS ---');
    try {
      await storage.bucket(BUCKET_NAME).file(REMOTE_PATH).delete();
      console.log(`Deleted ${REMOTE_PATH} from ${BUCKET_NAME}.`);
    } catch (error) {
      console.warn(`Failed to delete ${REMOTE_PATH} from ${BUCKET_NAME}:`, error);
    }
    console.log('-----------------------------------------------\n');
  });

  it('should upload audio to REAL GCS and transcribe it using Firebase/Vertex AI', async () => {
    // 1. Check if file exists
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
        throw new Error(`Test file not found at ${AUDIO_FILE_PATH}. Please ensure it exists.`);
    }

    console.log(`Uploading ${AUDIO_FILENAME} to real bucket: ${BUCKET_NAME}/${REMOTE_PATH}...`);

    // 2. Upload to Real Storage
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
    expect(transcription).not.toBe('No text in response.');
    expect(transcription.length).toBeGreaterThan(0);
    // You can add specific content checks here if you know the content of sample.m4a
    // e.g., expect(transcription.toLowerCase()).toContain('some expected word');

  }, 120000); // 2 minutes timeout for real API
});
