import { Router } from 'express';
import { storage, db } from '#config/firebaseAdmin';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudio } from '#services/transcriptionService';
import { getAIResponse } from '#services/aiTherapistService';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

const router = Router();

router.post('/upload', (req, res) => {
    console.log('Upload endpoint hit');
    const busboy = Busboy({ headers: req.headers });
    const uploads: { [key: string]: { filepath: string, mimetype: string, filename: string } } = {};
    const fields: { [key: string]: string } = {};
  
    busboy.on('field', (fieldname, val) => {
      console.log(`Field [${fieldname}]: value: '${val}'`);
      fields[fieldname] = val;
    });
  
    busboy.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        console.log(`File [${fieldname}]: filename: '${filename}', encoding: '${encoding}', mimeType: '${mimeType}'`);
        const saveTo = path.join(os.tmpdir(), filename);
        uploads[fieldname] = { filepath: saveTo, mimetype: mimeType, filename: filename };
        file.pipe(fs.createWriteStream(saveTo));
    });
  
    busboy.on('finish', async () => {
      try {
        console.log('Busboy finished parsing form.');
        const { title, tags } = fields;
        for (const name in uploads) {
          const uploadData = uploads[name];
          if (uploadData) {
            const { filepath, mimetype, filename } = uploadData;
            console.log(`Processing file: ${filename}`);
            const metadata = { contentType: mimetype };
            const remotePath = `audio/${uuidv4()}-${filename}`;
            
            await storage.bucket().upload(filepath, {
              destination: remotePath,
              metadata: metadata,
            });
            console.log(`File ${filename} uploaded to ${remotePath}`);
            
            fs.unlinkSync(filepath);
    
            const url = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(remotePath)}?alt=media`;
            const gcsUri = `gs://${storage.bucket().name}/${remotePath}`;
            
            const entryId = uuidv4();
    
            console.log(`Adding document to Firestore with entryId: ${entryId}`);
            await db.collection('audioEntries').doc(entryId).set({
              entryId,
              userId: 'temp-user-id', // Placeholder
              title: title || 'Untitled',
              audioUrl: url,
              tags: tags ? tags.split(',') : [],
              transcription: 'Processing...',
              aiResponse: 'Processing...',
              createdAt: new Date(),
            });
            console.log(`Document added to Firestore.`);
            
            // Non-blocking background processing
            transcribeAudio(gcsUri).then(async (transcription: string) => {
                await db.collection('audioEntries').doc(entryId).update({ transcription });
                const aiResponse = await getAIResponse(transcription);
                await db.collection('audioEntries').doc(entryId).update({ aiResponse });
            });
          }
        }
        res.status(200).json({ message: 'Upload successful, processing audio in the background.' });
      } catch (error) {
          console.error('Error during upload finish:', error);
          res.status(500).json({ error: (error as Error).message });
      }
    });
  
    req.pipe(busboy);
  });

router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
  
    try {
      const snapshot = await db.collection('audioEntries')
        .where('transcription', '>=', q)
        .where('transcription', '<=', q + '\uf8ff')
        .get();
  
      const results = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

export { router };