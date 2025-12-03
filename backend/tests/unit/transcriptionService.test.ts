import { describe, expect, it, jest, afterEach } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storage } from '#config/firebaseAdmin'; // Real storage (emulator)
import type { FunctionCall, GenerateContentResult, InlineDataPart } from '@firebase/ai'; // Import GenerateContentResult type

// Mock AI dependencies using unstable_mockModule for ESM support
const mockGenerateContent = jest.fn<(...args: any[]) => Promise<GenerateContentResult>>();
const mockGetGenerativeModel = jest.fn(() => ({ generateContent: mockGenerateContent }));
const mockGetAI = jest.fn();
const mockInitializeApp = jest.fn();
const mockGoogleAIBackend = jest.fn();

// Setup mocks for AI
jest.unstable_mockModule('firebase/app', () => ({
  initializeApp: mockInitializeApp
}));
jest.unstable_mockModule('@firebase/ai', () => ({
  getAI: mockGetAI,
  getGenerativeModel: mockGetGenerativeModel,
  GoogleAIBackend: mockGoogleAIBackend
}));

// Dynamically import the service under test
const { transcribeAudio } = await import('#services/transcriptionService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_FILENAME = 'sample.m4a';
const AUDIO_FILE_PATH = path.join(__dirname, AUDIO_FILENAME);
const BUCKET_NAME = 'demo-project.appspot.com';

describe('transcriptionService Integration', () => {
  afterEach(async () => {
    jest.clearAllMocks();
    // Cleanup storage
    try {
        await storage.bucket(BUCKET_NAME).deleteFiles({ force: true });
    } catch (e) {
        console.warn('Failed to cleanup storage bucket', e);
    }
  });

  it('should download m4a from storage emulator and send to AI (Mocked)', async () => {
    // 1. Upload file to Storage Emulator
    if (!fs.existsSync(AUDIO_FILE_PATH)) {
        throw new Error(`Test file not found at ${AUDIO_FILE_PATH}`);
    }
    const fileContent = fs.readFileSync(AUDIO_FILE_PATH);
    const destination = `audio/${AUDIO_FILENAME}`;
    
    await storage.bucket(BUCKET_NAME).upload(AUDIO_FILE_PATH, {
        destination,
        metadata: { contentType: 'audio/mpeg' } 
    });

    const gcsUri = `gs://${BUCKET_NAME}/${destination}`;
    const mockResponseText = 'This is a mock transcription from Firebase AI.';

    // Mock AI response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockResponseText,
        inlineDataParts: function (): InlineDataPart[] | undefined {
          throw new Error('Function not implemented.');
        },
        functionCalls: function (): FunctionCall[] | undefined {
          throw new Error('Function not implemented.');
        },
        thoughtSummary: function (): string | undefined {
          throw new Error('Function not implemented.');
        }
      }
    });

    // 2. Call service
    const result = await transcribeAudio(gcsUri);

    // 3. Verify
    // Verify AI was called with the content downloaded from the emulator
    expect(mockGenerateContent).toHaveBeenCalledWith([
      "Transcribe what's said in this audio recording.",
      {
        inlineData: {
          data: fileContent.toString('base64'),
          mimeType: 'audio/mpeg'
        }
      }
    ]);

    expect(result).toBe(mockResponseText);
  });
});
