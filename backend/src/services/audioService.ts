import { firestore, storage } from '@config/firebaseAdmin';
import { AudioEntry } from '@models/audioEntry';
import { transcribeAudio } from '@services/transcriptionService';
import { getTherapistResponse } from '@services/aiTherapistService';

export const uploadAudio = async (userId: string, file: File, title: string, tags: string[]): Promise<AudioEntry> => {
  const bucket = storage.bucket(); // Get the default bucket
  const fileName = `audio/${userId}/${file.name}`;
  const fileUpload = bucket.file(fileName);

  // Upload audio to Firebase Storage
  await fileUpload.save(file.data, { 
    metadata: { contentType: file.type }
  });
  const [audioUrl] = await fileUpload.getSignedUrl({
    action: 'read',
    expires: '03-17-2025', // Set a far future expiry date for public access, adjust as needed
  });

  // Transcribe audio
  const transcription = await transcribeAudio(audioUrl);

  // Get AI therapist response
  const aiResponse = await getTherapistResponse(transcription);

  // Save audio entry metadata to Firestore
  const audioEntriesCollection = firestore.collection(`personalData/${userId}/audioEntries`);
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
  const audioEntryDocRef = firestore.doc(`personalData/${userId}/audioEntries/${entryId}`);
  const docSnap = await audioEntryDocRef.get();
  if (docSnap.exists) {
    return { ...docSnap.data() as Omit<AudioEntry, 'entryId'>, entryId: docSnap.id };
  }
  return undefined;
};
