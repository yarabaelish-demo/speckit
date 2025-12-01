import { jest } from '@jest/globals';

// Define mocks first
const mockFile = {
  save: jest.fn(() => Promise.resolve()),
  getSignedUrl: jest.fn(() => Promise.resolve(['http://test.com/audio.mp3'])),
};

const mockBucket = {
  file: jest.fn(() => mockFile),
  name: 'test-bucket',
};

const mockStorage = {
  bucket: jest.fn(() => mockBucket),
};

const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
};

// Mock modules using unstable_mockModule for ESM support
jest.unstable_mockModule('@config/firebaseAdmin.js', () => ({
  __esModule: true,
  firestore: mockFirestore,
  storage: mockStorage,
  auth: {},
}));

jest.unstable_mockModule('@services/transcriptionService.js', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('test transcription')),
}));

jest.unstable_mockModule('@services/aiTherapistService.js', () => ({
  getTherapistResponse: jest.fn(() => Promise.resolve('test ai response')),
}));

// Import modules dynamically after mocking
const { uploadAudio, getAudioEntry } = await import('@services/audioService.js');
const { db, storage } = await import('@config/firebaseAdmin.js');
const { transcribeAudio } = await import('@services/transcriptionService.js');
const { getAIResponse } = await import('@services/aiTherapistService.js');

describe('audioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations if needed
    (storage.bucket as jest.Mock).mockReturnValue(mockBucket);
  });

  it('should upload audio and create an entry', async () => {
    const userId = 'testUser';
    const fileBuffer = Buffer.from('audio data');
    const title = 'Test Audio';
    const tags = ['tag1', 'tag2'];

    const addMock = jest.fn(() => Promise.resolve({ id: 'testEntryId' }));
    const collectionMock = { add: addMock };
    (db.collection as jest.Mock).mockReturnValue(collectionMock);

    const result = await uploadAudio(userId, fileBuffer, title, tags);

    expect(storage.bucket).toHaveBeenCalled();
    expect(mockBucket.file).toHaveBeenCalledWith(expect.stringMatching(/audio\/testUser\/\d+/));
    expect(mockFile.save).toHaveBeenCalledWith(fileBuffer);
    expect(mockFile.getSignedUrl).toHaveBeenCalled();
    expect(transcribeAudio).toHaveBeenCalledWith(expect.stringMatching(/^gs:\/\/test-bucket\/audio\/testUser\/\d+$/));
    expect(getAIResponse).toHaveBeenCalledWith('test transcription');
    expect(db.collection).toHaveBeenCalledWith(`personalData/${userId}/audioEntries`);
    expect(addMock).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      title,
      audioUrl: 'http://test.com/audio.mp3',
      tags,
      transcription: 'test transcription',
      aiResponse: 'test ai response',
    }));
    expect(result).toEqual(expect.objectContaining({ entryId: 'testEntryId' }));
  });

  it('should get an audio entry by ID', async () => {
    const userId = 'testUser';
    const entryId = 'testEntryId';

    const getMock = jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        userId: 'testUser',
        title: 'Test Audio',
        audioUrl: 'http://test.com/audio.mp3',
        tags: ['tag1', 'tag2'],
        transcription: 'test transcription',
        aiResponse: 'test ai response',
        createdAt: new Date(),
      }),
      id: 'testEntryId',
    }));
    const docMock = { get: getMock };
    (db.doc as jest.Mock).mockReturnValue(docMock);

    const result = await getAudioEntry(userId, entryId);

    expect(db.doc).toHaveBeenCalledWith(`personalData/${userId}/audioEntries/${entryId}`);
    expect(getMock).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ entryId }));
  });
});
