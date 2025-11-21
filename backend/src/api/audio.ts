import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { uploadAudio } from '../services/audioService';
import { auth } from 'firebase-admin';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { AudioEntry } from '../models/audioEntry';

const audioRouter = Router();

audioRouter.use(fileUpload());

audioRouter.post('/upload', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // Assume a single file upload named 'audioFile'
  const audioFile = req.files.audioFile as fileUpload.UploadedFile;
  const { title, tags } = req.body;

  // Get user ID from authenticated context (Firebase Admin SDK needed for proper auth handling)
  // For now, using a placeholder userId
  const userId = 'testUser'; // Replace with actual authenticated user ID

  try {
    const audioEntry = await uploadAudio(userId, audioFile.data, title, JSON.parse(tags));
    res.status(201).json(audioEntry);
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).send('Error uploading audio.');
  }
});

audioRouter.get('/search', async (req, res) => {
  const { query: searchQuery } = req.query;
  const userId = 'testUser'; // Replace with actual authenticated user ID

  if (!searchQuery) {
    return res.status(400).send('Search query is required.');
  }

  try {
    const firestore = getFirestore();
    const audioEntriesRef = collection(firestore, `personalData/${userId}/audioEntries`);
    const q = query(audioEntriesRef, where('transcription', 'array-contains', searchQuery.toString().toLowerCase()));
    const querySnapshot = await getDocs(q);

    const results: AudioEntry[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ ...doc.data() as Omit<AudioEntry, 'entryId'>, entryId: doc.id });
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching audio entries:', error);
    res.status(500).send('Error searching audio entries.');
  }
});

export default audioRouter;
