import { getAI, getGenerativeModel } from '@firebase/ai';
import { initializeApp } from 'firebase/app';
import { storage } from '#config/firebaseAdmin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase AI
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const ai = getAI(app);
const model = getGenerativeModel(ai, {
    model: 'gemini-1.5-flash'
});

export const transcribeAudio = async (gcsUri: string): Promise<string> => {
  console.log(`Transcribing audio from: ${gcsUri}`);

  // 1. Parse GCS URI to get file path
  // URI format: gs://<bucket_name>/<file_path>
  const matches = gcsUri.match(/gs:\/\/([^\/]+)\/(.+)/);
  if (!matches) {
      throw new Error('Invalid GCS URI format');
  }
  const [, bucketName, filePath] = matches;

  // 2. Download file from GCS to get base64 content
  // We use the admin SDK's storage to read the file server-side
  const [fileBuffer] = await storage.bucket(bucketName).file(filePath).download();
  const base64Audio = fileBuffer.toString('base64');

  // 3. Prepare the part object
  // Determine mimeType based on file extension
  const extension = filePath.split('.').pop()?.toLowerCase();
  let mimeType = 'audio/mpeg'; // Default
  if (extension === 'm4a') {
      mimeType = 'audio/m4a';
  } else if (extension === 'webm') {
      mimeType = 'audio/webm';
  } else if (extension === 'wav') {
      mimeType = 'audio/wav';
  } else if (extension === 'mp4') {
      mimeType = 'audio/mp4';
  }

  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: mimeType,
    },
  };

  const prompt = "Transcribe what's said in this audio recording.";

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          audioPart
        ]
      }]
    });
    const response = result.response;
    const responseText = response.candidates?.[0].content.parts[0].text;
    
    console.log('Transcription complete.');
    return responseText || "No text in response.";
  } catch (error) {
    console.error('Error in transcribeAudio (Firebase AI):', error);
    throw error;
  }
};

