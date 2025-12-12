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
        // Since we mocked Busboy, we need to manually trigger the events it would emit
        // This is tricky with supertest + express + mocked busboy. 
        // We'll rely on the fact that `req.pipe(busboy)` is called.
        // But since we can't easily grab the busboy instance created inside the route, 
        // we'll simulate the "happy path" by mocking the Busboy constructor to return an object 
        // that immediately emits events when `pipe` or listeners are attached.
        
        // Actually, it's easier to verify that the endpoint returns 200 if we can get Busboy to finish.
        // We can use a special mock for this test that auto-emits 'finish' on instantiation/tick.
        
                        const busboyMock = require('busboy');
                        busboyMock.mockImplementation(() => {
                            const listeners: Record<string, Function> = {};
                            return {
                                on: (event: string, cb: any) => {
                                    listeners[event] = cb;
                                    // Trigger flow when 'finish' listener is attached (assuming it's the last one)
                                    // OR trigger explicitly.
                                    // Let's trigger the sequence when 'finish' is attached, 
                                    // effectively simulating "parsing started and completed".
                                    if (event === 'finish') {
                                        setTimeout(() => {
                                            // 1. Emit file
                                            if (listeners['file']) {
                                                listeners['file']('audio', { 
                                                    pipe: (stream: any) => {
                                                        stream.emit('finish');
                                                        return stream;
                                                    }
                                                }, { filename: 'test.mp3', mimeType: 'audio/mpeg', encoding: '7bit' });
                                            }
                                            // 2. Emit finish
                                            cb();
                                        }, 0);
                                    }
                                },
                                                write: jest.fn(),
                                                end: jest.fn(),
                                                emit: jest.fn(),
                                                removeListener: jest.fn(),
                                                once: jest.fn(),
                                            };
                                        });        const res = await request(app)
            .post('/audio/upload')
            .set('Authorization', 'Bearer mock-token')
            .set('Content-Type', 'multipart/form-data; boundary=boundary')
            .send('--boundary\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Title\r\n--boundary--');

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('Upload successful');
        
        // Verify interactions (wait a bit for async operations in the route)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(mockStorageUpload).toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalled(); // Firestore set
    });

    it('DELETE /audio/:entryId should delete file and doc', async () => {
        const res = await request(app)
            .delete('/audio/mock-entry-id')
            .set('Authorization', 'Bearer mock-token');

        expect(res.statusCode).toBe(200);
        expect(mockDelete).toHaveBeenCalled(); // Doc delete
        expect(mockStorageDelete).toHaveBeenCalled(); // File delete
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
});
