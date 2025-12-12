import { Router } from 'express';
import { storage, db, auth } from '#config/firebaseAdmin';
import { verifyAuth } from '#middleware/auth';
import Busboy from 'busboy';
import { v4 as uuidv4 } from 'uuid';
import { transcribeAudio } from '#services/transcriptionService';
import { getAIResponse, chatWithTherapist } from '#services/aiTherapistService';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import NodeCache from 'node-cache';

const router = Router();
console.log('Audio router loaded');
const cache = new NodeCache({ stdTTL: 60 }); // 60 seconds TTL

router.post('/:entryId/chat', verifyAuth, async (req: any, res: any, next: any) => {
    console.log(`Chat endpoint hit for ${req.params.entryId}`);
    const { entryId } = req.params;
    const { message, history } = req.body;
    const userId = req.user.uid; // Although we don't strictly need to look up the user doc here if we trust the client history, it's good practice if we wanted to log it.

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        // Input validation and sanitization
        if (!entryId || typeof entryId !== 'string' || entryId.trim().length === 0) {
            return res.status(400).json({ error: 'Entry ID is required and must be a non-empty string.' });
        }
        const sanitizedEntryId = entryId.trim();

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
        }
        const sanitizedMessage = message.trim();

        if (!Array.isArray(history)) {
            return res.status(400).json({ error: 'History must be an array.' });
        }
        // Basic sanitization/validation for history elements (can be expanded)
        const sanitizedHistory = history.map((h: any) => ({
            role: h.role === 'user' || h.role === 'model' ? h.role : 'user', // Default to user or validate
            parts: Array.isArray(h.parts) && h.parts.every((p: any) => typeof p.text === 'string') ? 
                   h.parts.map((p: any) => ({ text: p.text.trim().substring(0, 1000) })) : 
                   [{ text: '' }]
        }));

        // Transform history for Firebase AI if needed
        // Expected format: { role: 'user' | 'model', parts: [{ text: string }] }[]
        const formattedHistory = sanitizedHistory.map((h: any) => ({
            role: h.role,
            parts: [{ text: h.parts[0].text }]
        }));

        const responseText = await chatWithTherapist(formattedHistory, sanitizedMessage);
        res.status(200).json({ response: responseText });
    } catch (error) {
        next(error);
    }
});

// Helper to generate cache key
const getCacheKey = (userId: string, query: string) => `search_${userId}_${query}`;

// Helper to invalidate all search caches for a user
const invalidateUserCache = (userId: string) => {
    // node-cache doesn't support wildcard deletion by default efficiently without keeping track of keys.
    // For simplicity in this specific requirement, we can use cache.keys() to find relevant keys.
    // In a production redis environment, we might use tags or sets.
    const keys = cache.keys();
    const userKeys = keys.filter(key => key.startsWith(`search_${userId}_`));
    cache.del(userKeys);
};

router.post('/upload', verifyAuth, (req: any, res: any, next: any) => {
    console.log('Upload endpoint hit');
    
    // Invalidate cache on upload
    if (req.user && req.user.uid) {
        invalidateUserCache(req.user.uid);
    }

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

        // Input validation and sanitization
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
        }
        const sanitizedTitle = title.trim().substring(0, 255); // Trim and limit length

        let sanitizedTags: string[] = [];
        if (tags && typeof tags === 'string') {
            sanitizedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }

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
              title: sanitizedTitle,
              audioUrl: url,
              tags: sanitizedTags,
              transcription: 'Processing...',
              aiResponse: 'Processing...',
              createdAt: new Date(),
            });
            console.log(`Document added to Firestore.`);
            
            // Non-blocking background processing
            transcribeAudio(gcsUri).then(async (transcription: string) => {
                const aiResponse = await getAIResponse(transcription);
                await userAudioCollection.doc(entryId).update({ transcription, aiResponse });
            });
          }
        }
        if (!res.headersSent) {
            res.status(200).json({ message: 'Upload successful, processing audio in the background.' });
        }
      } catch (error) {
          if (!res.headersSent) {
            next(error);
          } else {
            console.error('Error after response sent:', error);
          }
      }
    });
  
    req.pipe(busboy);
  });

router.get('/search', verifyAuth, async (req: any, res: any, next: any) => {
    const { q } = req.query;
    const userId = req.user.uid;

    // Input validation and sanitization
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required and must be a non-empty string.' });
    }
    const sanitizedQuery = q.trim().substring(0, 500); // Trim and limit length

    const cacheKey = getCacheKey(userId, sanitizedQuery as string);
    const cachedResults = cache.get(cacheKey);

    if (cachedResults) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedResults);
    }

    try {
      const snapshot = await db.collection(`users/${userId}/audioEntries`)
        .where('transcription', '>=', sanitizedQuery)
        .where('transcription', '<=', sanitizedQuery + '\uf8ff')
        .get();
  
      const results = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data());
      
      // Update cache
      cache.set(cacheKey, results);

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  });

router.delete('/:entryId', verifyAuth, async (req: any, res: any, next: any) => {
    const { entryId } = req.params;
    const userId = req.user.uid;

    // Input validation
    if (!entryId || typeof entryId !== 'string' || entryId.trim().length === 0) {
        return res.status(400).json({ error: 'Entry ID is required and must be a non-empty string.' });
    }
    const sanitizedEntryId = entryId.trim();

    // Invalidate cache on delete
    invalidateUserCache(userId);

    try {
        const docRef = db.doc(`users/${userId}/audioEntries/${sanitizedEntryId}`);
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
        next(error);
    }
});

router.use((req, res, next) => {
    console.log(`Audio router catch-all: ${req.method} ${req.url}`);
    next();
});

export { router };