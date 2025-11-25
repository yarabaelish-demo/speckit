import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { uploadAudio } from '../services/audioService.js';
import { auth, firestore } from '@config/firebaseAdmin.js';
import type { AudioEntry } from '@models/audioEntry.js';

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
    const audioEntriesRef = firestore.collection(`personalData/${userId}/audioEntries`);
    const snapshot = await audioEntriesRef.where('tags', 'array-contains', searchQuery.toString()).get();

    const results: AudioEntry[] = [];
    snapshot.forEach((doc) => {
      results.push({ ...doc.data() as Omit<AudioEntry, 'entryId'>, entryId: doc.id });
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Error searching audio entries:', error);
    res.status(500).send('Error searching audio entries.');
  }
});

export default audioRouter;
