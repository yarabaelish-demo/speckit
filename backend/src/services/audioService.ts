import { firestore } from '../config/firebaseAdmin';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AudioEntry } from '../models/audioEntry';
import { transcribeAudio } from './transcriptionService';
import { getTherapistResponse } from './aiTherapistService';

export const uploadAudio = async (userId: string, file: File, title: string, tags: string[]): Promise<AudioEntry> => {
  const storage = getStorage();

  // Upload audio to Firebase Storage
  const audioRef = ref(storage, `audio/${userId}/${file.name}`);
  const snapshot = await uploadBytes(audioRef, file);
  const audioUrl = await getDownloadURL(snapshot.ref);

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
