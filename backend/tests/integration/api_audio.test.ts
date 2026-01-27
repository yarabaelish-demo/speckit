// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test-domain';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.FIREBASE_APP_ID = 'test-app-id';

// Mocks
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockAdd = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockStorageDelete = jest.fn();
const mockStorageUpload = jest.fn();
const mockVerifyIdToken = jest.fn();

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
        add: mockAdd.mockResolvedValue({ id: 'mock-doc-id' }),
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            get: mockGet
          }))
        })),
        doc: jest.fn(() => ({
          set: mockSet,
          get: mockGet,
          update: mockUpdate,
          delete: mockDelete
        }))
      })),
      doc: jest.fn(() => ({
          set: mockSet,
          get: mockGet,
          update: mockUpdate,
          delete: mockDelete
      }))
    })),
    storage: jest.fn(() => ({
      bucket: jest.fn(() => ({
        file: jest.fn(() => ({
          save: jest.fn(),
          getSignedUrl: jest.fn(() => ['http://test-url']),
          delete: mockStorageDelete
        })),
        upload: mockStorageUpload,
        name: 'test-bucket'
      }))
    })),
    auth: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken
    }))
  }
}));

jest.mock('firebase-admin/app', () => ({
  applicationDefault: jest.fn()
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

jest.mock('#services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('mock transcription')),
}));

jest.mock('#services/aiTherapistService', () => ({
  getAIResponse: jest.fn(() => Promise.resolve('mock ai response')),
  chatWithTherapist: jest.fn().mockResolvedValue('Therapist says hello'),
}));

// Mock Busboy to simulate file upload
jest.mock('busboy', () => {
    return jest.fn((options) => {
        const listeners: any = {};
        return {
            on: (event: string, cb: any) => {
                listeners[event] = cb;
            },
            emit: (event: string, ...args: any[]) => {
                if (listeners[event]) listeners[event](...args);
            },
            // Simulate piping
            pipe: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        };
    });
});

// Mock fs to avoid actual file system writes during busboy simulation
const mockFsUnlinkSync = jest.fn();
jest.mock('fs', () => ({
    createWriteStream: () => {
        const listeners: Record<string, Function> = {};
        const streamMock = {
            on: (event: string, cb: any) => { 
                listeners[event] = cb;
                if(event === 'finish') setTimeout(cb, 0); // Auto-finish for test
                return streamMock;
            },
            emit: (event: string, ...args: any[]) => {
                if (listeners[event]) listeners[event](...args);
            },
            write: jest.fn(),
            end: jest.fn()
        };
        return streamMock;
    },
    unlinkSync: mockFsUnlinkSync,
    existsSync: jest.fn(() => true),
    readFileSync: jest.fn(() => Buffer.from('dummy')),
}));

const request = require('supertest');
const express = require('express');
const { router: audioApiRouter } = require('#api/audio');

const app = express();
app.use(express.json());
app.use('/audio', audioApiRouter);

describe('Audio API Endpoints', () => {
    const TEST_USER_ID = 'api-test-user-id';

    beforeEach(async () => {
        jest.clearAllMocks();
        mockVerifyIdToken.mockResolvedValue({ uid: TEST_USER_ID });
        
        // Default doc().get() mock return
        mockGet.mockResolvedValue({
            exists: true,
            data: () => ({
                audioUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/audio%2Ffile.mp3?alt=media',
                userId: TEST_USER_ID 
            }),
            docs: [] 
        });
    });

    it('POST /audio/upload should process file upload', async () => {
        const busboyMock = require('busboy');
        busboyMock.mockImplementation(() => {
            const listeners: Record<string, Function> = {};
            return {
                on: (event: string, cb: any) => {
                    listeners[event] = cb;
                    if (event === 'finish') {
                        setTimeout(() => {
                            // Emit title field
                            if (listeners['field']) {
                                listeners['field']('title', 'Test Title');
                            }
                            // 1. Emit file
                            if (listeners['file']) {
                                listeners['file']('audio', { 
                                    pipe: (stream: any) => {
                                        stream.emit('finish');
                                        return stream;
                                    }
                                }, { filename: 'test.mp3', mimeType: 'audio/mpeg', encoding: '7bit' });
                            }
                            cb(); // Trigger finish
                        }, 0);
                    }
                },
                write: jest.fn(),
                end: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                once: jest.fn(),
            };
        });        

        const res = await request(app)
            .post('/audio/upload')
            .set('Authorization', 'Bearer mock-token')
            .set('Content-Type', 'multipart/form-data; boundary=boundary')
            .send('--boundary\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Title\r\n--boundary--');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('Upload successful');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(mockStorageUpload).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalled();
    });

    it('POST /audio/upload should return 400 if title is missing', async () => {
        const busboyMock = require('busboy');
        busboyMock.mockImplementation(() => {
            const listeners: Record<string, Function> = {};
            return {
                on: (event: string, cb: any) => {
                    listeners[event] = cb;
                    if (event === 'finish') {
                        setTimeout(() => {
                            if (listeners['file']) {
                                listeners['file']('audio', { 
                                    pipe: (stream: any) => {
                                        stream.emit('finish');
                                        return stream;
                                    }
                                }, { filename: 'test.mp3', mimeType: 'audio/mpeg', encoding: '7bit' });
                            }
                            cb(); // Trigger finish to run validation logic
                        }, 0);
                    }
                },
                write: jest.fn(),
                end: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                once: jest.fn(),
            };
        });        

        const res = await request(app)
            .post('/audio/upload')
            .set('Authorization', 'Bearer mock-token')
            .set('Content-Type', 'multipart/form-data; boundary=boundary')
            .send('--boundary\r\nContent-Disposition: form-data; name="tags"\r\n\r\ntag1,tag2\r\n--boundary--');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Title is required');
    });

    it('POST /audio/upload should return 400 if title is empty', async () => {
        const busboyMock = require('busboy');
        busboyMock.mockImplementation(() => {
            const listeners: Record<string, Function> = {};
            return {
                on: (event: string, cb: any) => {
                    listeners[event] = cb;
                    if (event === 'finish') {
                        setTimeout(() => {
                            if (listeners['file']) {
                                listeners['file']('audio', { 
                                    pipe: (stream: any) => {
                                        stream.emit('finish');
                                        return stream;
                                    }
                                }, { filename: 'test.mp3', mimeType: 'audio/mpeg', encoding: '7bit' });
                            }
                            cb(); // Trigger finish to run validation logic
                        }, 0);
                    }
                },
                write: jest.fn(),
                end: jest.fn(),
                emit: jest.fn(),
                removeListener: jest.fn(),
                once: jest.fn(),
            };
        });        

        const res = await request(app)
            .post('/audio/upload')
            .set('Authorization', 'Bearer mock-token')
            .set('Content-Type', 'multipart/form-data; boundary=boundary')
            .send('--boundary\r\nContent-Disposition: form-data; name="title"\r\n\r\n \r\n--boundary--');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Title is required');
    });

    it('GET /audio/search should return 400 if query parameter "q" is missing', async () => {
        const res = await request(app)
            .get('/audio/search')
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Query parameter "q" is required');
    });

    it('GET /audio/search should return 400 if query parameter "q" is empty', async () => {
        const res = await request(app)
            .get('/audio/search')
            .query({ q: ' ' })
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Query parameter "q" is required');
    });

    it('DELETE /audio/:entryId should delete file and doc', async () => {
        const res = await request(app)
            .delete('/audio/mock-entry-id')
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toBe(200);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockStorageDelete).toHaveBeenCalled();
    });

    it('DELETE /audio/:entryId should return 400 if entryId is missing or empty', async () => {
        const res = await request(app)
            .delete('/audio/%20') 
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Entry ID is required');
    });

    it('POST /audio/:entryId/chat should return AI response', async () => {
        const res = await request(app)
            .post('/audio/mock-entry-id/chat')
            .set('Authorization', 'Bearer mock-token')
            .send({
                message: 'Hello',
                history: [{ role: 'user', text: 'Hi' }]
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.response).toBe('Therapist says hello');
    });

    it('POST /audio/:entryId/chat should return 400 if message is missing', async () => {
        const res = await request(app)
            .post('/audio/mock-entry-id/chat')
            .set('Authorization', 'Bearer mock-token')
            .send({
                history: [{ role: 'user', text: 'Hi' }]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Message is required');
    });

    it('POST /audio/:entryId/chat should return 400 if message is empty', async () => {
        const res = await request(app)
            .post('/audio/mock-entry-id/chat')
            .set('Authorization', 'Bearer mock-token')
            .send({
                message: ' ',
                history: [{ role: 'user', text: 'Hi' }]
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Message is required');
    });

    it('POST /audio/:entryId/chat should return 400 if history is not an array', async () => {
        const res = await request(app)
            .post('/audio/mock-entry-id/chat')
            .set('Authorization', 'Bearer mock-token')
            .send({
                message: 'Hello',
                history: 'not-an-array'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('History must be an array');
    });
});