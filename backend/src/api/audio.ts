import { Router } from 'express';
import { storage, db, auth } from '#config/firebaseAdmin';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudio } from '#services/transcriptionService';
import { getAIResponse, chatWithTherapist } from '#services/aiTherapistService';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

const router = Router();

// Middleware to verify Firebase ID token
const verifyAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

router.post('/upload', verifyAuth, (req: any, res: any) => {
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
        const userId = req.user.uid; // From auth middleware

        for (const name in uploads) {
          const uploadData = uploads[name];
          if (uploadData) {
            const { filepath, mimetype, filename } = uploadData;
            console.log(`Processing file: ${filename}`);
            const metadata = { contentType: mimetype };
            const remotePath = `audio/${userId}/${uuidv4()}-${filename}`;
            
            await storage.bucket().upload(filepath, {
              destination: remotePath,
              metadata: metadata,
            });
            console.log(`File ${filename} uploaded to ${remotePath}`);
            
            fs.unlinkSync(filepath);
    
            const url = `https://firebasestorage.googleapis.com/v0/b/${storage.bucket().name}/o/${encodeURIComponent(remotePath)}?alt=media`;
            const gcsUri = `gs://${storage.bucket().name}/${remotePath}`;
            
            const entryId = uuidv4();
            const userAudioCollection = db.collection(`users/${userId}/audioEntries`);

            console.log(`Adding document to Firestore with entryId: ${entryId}`);
            await userAudioCollection.doc(entryId).set({
              entryId,
              userId,
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
                await userAudioCollection.doc(entryId).update({ transcription });
                const aiResponse = await getAIResponse(transcription);
                await userAudioCollection.doc(entryId).update({ aiResponse });
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

router.get('/search', verifyAuth, async (req: any, res: any) => {
    const { q } = req.query;
    const userId = req.user.uid;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }
  
    try {
      const snapshot = await db.collection(`users/${userId}/audioEntries`)
        .where('transcription', '>=', q)
        .where('transcription', '<=', q + '\uf8ff')
        .get();
  
      const results = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

router.delete('/:entryId', verifyAuth, async (req: any, res: any) => {
    const { entryId } = req.params;
    const userId = req.user.uid;

    try {
        const docRef = db.doc(`users/${userId}/audioEntries/${entryId}`);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Audio entry not found.' });
        }

        const data = docSnap.data();
        if (data && data.audioUrl) {
            try {
                // Extract the path from the URL
                // Format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media
                const urlObj = new URL(data.audioUrl);
                const pathname = urlObj.pathname; // /v0/b/<bucket>/o/<encodedPath>
                const encodedPath = pathname.split('/o/')[1];
                if (encodedPath) {
                    const filePath = decodeURIComponent(encodedPath);
                    console.log(`Deleting file from storage: ${filePath}`);
                    await storage.bucket().file(filePath).delete();
                }
            } catch (storageError) {
                console.warn('Failed to delete file from storage (it might not exist):', storageError);
                // Continue to delete the document even if storage deletion fails
            }
        }

        await docRef.delete();
        res.status(200).json({ message: 'Audio entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting audio entry:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

router.post('/:entryId/chat', verifyAuth, async (req: any, res: any) => {
    const { entryId } = req.params;
    const { message, history } = req.body;
    const userId = req.user.uid; // Although we don't strictly need to look up the user doc here if we trust the client history, it's good practice if we wanted to log it.

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        // Transform history for Firebase AI if needed
        // Expected format: { role: 'user' | 'model', parts: [{ text: string }] }[]
        const formattedHistory = history.map((h: any) => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const responseText = await chatWithTherapist(formattedHistory, message);
        res.status(200).json({ response: responseText });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: (error as Error).message });
    }
});

export { router };