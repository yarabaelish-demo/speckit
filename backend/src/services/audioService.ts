import { db, storage } from '#config/firebaseAdmin';
import type { AudioEntry } from '#models/audioEntry';
import { transcribeAudio } from '#services/transcriptionService';
import { getAIResponse } from '#services/aiTherapistService';

export const uploadAudio = async (userId: string, fileBuffer: Buffer, title: string, tags: string[]): Promise<AudioEntry> => {
  const bucket = storage.bucket(); // Get the default bucket
  const fileName = `audio/${userId}/${Date.now()}`;
  const fileUpload = bucket.file(fileName);

  // Upload audio to Firebase Storage
  await fileUpload.save(fileBuffer);
  const [audioUrl] = await fileUpload.getSignedUrl({
    action: 'read',
    expires: '03-17-2026', // Set a far future expiry date for public access, adjust as needed
  });

  // Transcribe audio
  const gcsUri = `gs://${bucket.name}/${fileName}`;
  const transcription = await transcribeAudio(gcsUri);
  // const transcription = 'test transcription';

  // Get AI therapist response
  const aiResponse = await getAIResponse(transcription);
  // const aiResponse = 'test ai response';

  // Save audio entry metadata to Firestore
  const audioEntriesCollection = db.collection(`personalData/${userId}/audioEntries`);
  const newAudioEntry: Omit<AudioEntry, 'entryId'> = {
    userId,
    title,
    audioUrl,
    tags,
    transcription, // Fill with transcribed text
    aiResponse, // Fill with AI therapist response
    createdAt: new Date(),
  };
  const docRef = await audioEntriesCollection.add(newAudioEntry);

  return { ...newAudioEntry, entryId: docRef.id };
};

export const getAudioEntry = async (userId: string, entryId: string): Promise<AudioEntry | undefined> => {
  const audioEntryDocRef = db.doc(`personalData/${userId}/audioEntries/${entryId}`);
  const docSnap = await audioEntryDocRef.get();
  if (docSnap.exists) {
    return { ...docSnap.data() as Omit<AudioEntry, 'entryId'>, entryId: docSnap.id };
  }
  return undefined;
};

