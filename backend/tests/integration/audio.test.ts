import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'http';

// Mock the services BEFORE they are imported by the app
jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));
jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));


// Mocks for Firebase Admin SDK
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  where: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  add: jest.fn(),
};

// Setup chainability and return values
mockFirestore.collection.mockReturnValue(mockFirestore);
mockFirestore.doc.mockReturnValue(mockFirestore);
mockFirestore.where.mockReturnValue(mockFirestore);
mockFirestore.set.mockResolvedValue(undefined);
mockFirestore.update.mockResolvedValue(undefined);
mockFirestore.add.mockResolvedValue({ id: 'mockEntryId' });
mockFirestore.get.mockResolvedValue({ docs: [{ data: () => ({ /* default mock data */ }) }] });

const mockStorage = {
  bucket: jest.fn(() => ({
    file: jest.fn(() => ({
      save: jest.fn(() => Promise.resolve()),
      getSignedUrl: jest.fn(() => Promise.resolve(['http://test.com/audio.mp3'])),
    })),
    upload: jest.fn(() => Promise.resolve()),
    name: 'test-bucket',
  })),
};

jest.unstable_mockModule('firebase-admin', () => ({
  __esModule: true,
  default: {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    firestore: () => mockFirestore,
    storage: () => mockStorage,
    auth: () => ({}),
    apps: [{}], // Prevent real initialization by making apps array non-empty
  }
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import the app *after* mocks are set up
const { default: app } = await import('../../dist/app.js');

let server: http.Server;

describe('Audio API', () => {
  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload an audio file', async () => {
    const filePath = path.join(__dirname, 'test-audio.mp3');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'dummy content');
    }
    const fileBuffer = fs.readFileSync(filePath);

    const response = await request(server)
      .post('/api/audio/upload')
      .field('title', 'Test Audio from Integration Test')
      .field('tags', 'integration,test')
      .attach('audio', fileBuffer, 'test-audio.mp3');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Upload successful, processing audio in the background.');

    // Clean up the test file
    fs.unlinkSync(filePath);
  }, 10000); // Increase timeout to 10 seconds

  it('should search for audio entries', async () => {
    const mockAudioEntry = {
      entryId: 'searchEntry1',
      userId: 'testUser',
      title: 'Searchable Audio',
      audioUrl: 'http://test.com/search-audio.mp3',
      tags: ['search', 'example'],
      transcription: 'This audio is searchable by keyword.',
      aiResponse: 'AI analysis.',
      createdAt: new Date().toISOString(),
    };

    mockFirestore.get.mockResolvedValueOnce({
        docs: [{ data: () => mockAudioEntry }],
    });

    const response = await request(server)
      .get('/api/audio/search?q=keyword');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([mockAudioEntry]);
  }, 30000);
});
