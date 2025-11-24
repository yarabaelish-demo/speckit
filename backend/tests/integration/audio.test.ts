import { jest } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock external services to avoid hitting real APIs during integration tests
jest.unstable_mockModule('../../src/services/transcriptionService.js', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));

jest.unstable_mockModule('../../src/services/aiTherapistService.js', () => ({
  getTherapistResponse: jest.fn(() => Promise.resolve('mock ai response')),
}));

const { default: app } = await import('../../src/app.js');

describe('Audio API', () => {
  it('should upload an audio file', async () => {
    const filePath = path.join(__dirname, 'test-audio.mp3');
    const fileBuffer = fs.readFileSync(filePath);

    const response = await request(app)
      .post('/api/audio/upload')
      .field('title', 'Test Audio from Integration Test')
      .field('tags', JSON.stringify(['integration', 'test']))
      .attach('audioFile', fileBuffer, 'test-audio.mp3');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('entryId');
    // Add more assertions as needed
  });

  it('should search for audio entries', async () => {
    const response = await request(app)
      .get('/api/audio/search?query=test');

    expect(response.status).toBe(200);
    // Add more assertions as needed
  });
});
