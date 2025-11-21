import { uploadAudio, getAudioEntry } from '../services/audioService';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { transcribeAudio } from '../services/transcriptionService';
import { getTherapistResponse } from '../services/aiTherapistService';

// Mock Firebase modules
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  addDoc: jest.fn(() => Promise.resolve({ id: 'testEntryId' })),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
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
  })),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve({ ref: {} })),
  getDownloadURL: jest.fn(() => Promise.resolve('http://test.com/audio.mp3')),
}));

jest.mock('../services/transcriptionService', () => ({
  transcribeAudio: jest.fn(() => Promise.resolve('test transcription')),
}));

jest.mock('../services/aiTherapistService', () => ({
  getTherapistResponse: jest.fn(() => Promise.resolve('test ai response')),
}));

describe('audioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload audio and create an entry', async () => {
    const userId = 'testUser';
    const file = new File(['audio data'], 'audio.mp3', { type: 'audio/mp3' });
    const title = 'Test Audio';
    const tags = ['tag1', 'tag2'];

    const result = await uploadAudio(userId, file, title, tags);

    expect(getStorage).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith(expect.anything(), `audio/${userId}/${file.name}`);
    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), file);
    expect(getDownloadURL).toHaveBeenCalled();
    expect(transcribeAudio).toHaveBeenCalledWith('http://test.com/audio.mp3');
    expect(getTherapistResponse).toHaveBeenCalledWith('test transcription');
    expect(getFirestore).toHaveBeenCalled();
    expect(collection).toHaveBeenCalledWith(expect.anything(), `personalData/${userId}/audioEntries`);
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
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

    const result = await getAudioEntry(userId, entryId);

    expect(getFirestore).toHaveBeenCalled();
    expect(doc).toHaveBeenCalledWith(expect.anything(), `personalData/${userId}/audioEntries`, entryId);
    expect(getDoc).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ entryId }));
  });
});
