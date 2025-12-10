import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { storage } from '#config/firebaseAdmin';
import dotenv from 'dotenv';

// Load environment variables from .env BEFORE any service imports
dotenv.config();

// Import transcribeAudio AFTER dotenv config runs
import { transcribeAudio } from '#services/transcriptionService';

const AUDIO_FILENAME = 'sample.m4a';
const AUDIO_FILE_PATH = path.join(__dirname, '../unit/sample.m4a'); 

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

  it('should upload audio to REAL GCS and attempt transcription using Firebase AI', async () => {
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
    
    try {
      const transcription = await transcribeAudio(gcsUri);
      console.log('Transcription Result:', transcription);

      // 4. Assertions for successful transcription
      expect(transcription).toBeDefined();
      expect(transcription).not.toBe('No text in response.');
      expect(transcription.length).toBeGreaterThan(0);
      
      console.log('✅ Firebase AI transcription successful');
    } catch (error) {
      console.log('Transcription error:', error);
      
      // Check if this is a configuration issue rather than a code issue
      if (error instanceof Error) {
        if (error.message.includes('Service AI is not available')) {
          console.log('⚠️  Firebase AI Logic is not enabled for this project');
          console.log('This is a configuration issue, not a code issue');
          // Mark test as pending/skipped rather than failed
          pending('Firebase AI Logic not enabled - this is a configuration issue');
        } else if (error.message.includes('API_KEY_SERVICE_BLOCKED') || error.message.includes('403')) {
          console.log('⚠️  API access is blocked - this is a configuration issue');
          console.log('Firebase AI or Gemini API needs to be enabled in the project');
          // Mark test as pending/skipped rather than failed
          pending('API access blocked - this is a configuration issue');
        } else {
          // This is a real error that should fail the test
          throw error;
        }
      } else {
        throw error;
      }
    }

  }, 120000); // 2 minutes timeout for real API
});
