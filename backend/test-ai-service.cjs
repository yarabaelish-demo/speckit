const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the compiled JavaScript modules
const { storage } = require('./dist/config/firebaseAdmin.js');
const { transcribeAudio } = require('./dist/services/transcriptionService.js');

const AUDIO_FILENAME = 'sample.m4a';
const AUDIO_FILE_PATH = path.join(__dirname, 'tests/unit/sample.m4a');
const BUCKET_NAME = process.env.GCLOUD_PROJECT ? `${process.env.GCLOUD_PROJECT}.firebasestorage.app` : 'yara-speckit.firebasestorage.app';
const REMOTE_PATH = `system-tests/${Date.now()}-${AUDIO_FILENAME}`;

async function testAIService() {
    console.log('\n=== Firebase AI Logic vs Gemini API Test ===');
    console.log(`GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
    console.log(`FIREBASE_API_KEY: ${process.env.FIREBASE_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET'}`);
    console.log('==========================================\n');

    try {
        // 1. Check if file exists
        if (!fs.existsSync(AUDIO_FILE_PATH)) {
            throw new Error(`Test file not found at ${AUDIO_FILE_PATH}. Please ensure it exists.`);
        }

        console.log(`📤 Uploading ${AUDIO_FILENAME} to GCS...`);

        // 2. Upload to Real Storage
        const [file] = await storage.bucket(BUCKET_NAME).upload(AUDIO_FILE_PATH, {
            destination: REMOTE_PATH,
            metadata: { contentType: 'audio/m4a' }
        });

        console.log(`✅ File uploaded successfully`);

        const gcsUri = `gs://${BUCKET_NAME}/${REMOTE_PATH}`;

        // 3. Call Transcription Service
        console.log(`🤖 Testing AI transcription service...`);
        const transcription = await transcribeAudio(gcsUri);

        console.log(`📝 Transcription Result: "${transcription}"`);
        console.log(`📏 Transcription Length: ${transcription.length} characters`);

        if (transcription && transcription !== 'No text in response.' && transcription.length > 0) {
            console.log('\n🎉 SUCCESS: AI transcription is working!');
        } else {
            console.log('\n⚠️  WARNING: Transcription returned empty or default response');
        }

        // 4. Cleanup
        console.log('\n🧹 Cleaning up...');
        await storage.bucket(BUCKET_NAME).file(REMOTE_PATH).delete();
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        
        // Cleanup on failure
        try {
            await storage.bucket(BUCKET_NAME).file(REMOTE_PATH).delete();
            console.log('🧹 Cleanup completed after error');
        } catch (cleanupError) {
            console.warn('⚠️  Failed to cleanup:', cleanupError.message);
        }
        
        throw error;
    }
}

testAIService().catch(error => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
});