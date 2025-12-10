import { getAI, getGenerativeModel } from '@firebase/ai';
import { initializeApp } from 'firebase/app';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage } from '#config/firebaseAdmin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase AI with minimal config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT,
};

let model: any;
let useDirectGemini = false;

// Lazy initialization to handle potential errors
const getModel = () => {
    if (!model) {
        try {
            // Try Firebase AI first
            const app = initializeApp(firebaseConfig, 'transcription-service');
            const ai = getAI(app);
            model = getGenerativeModel(ai, {
                model: 'gemini-2.5-pro'
            });
            console.log('Using Firebase AI for transcription');
        } catch (error) {
            console.warn('Firebase AI not available, falling back to direct Gemini API:', error instanceof Error ? error.message : String(error));
            
            // Fallback to direct Gemini API
            if (process.env.GEMINI_API_KEY) {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
                useDirectGemini = true;
                console.log('Using direct Gemini API for transcription');
            } else {
                throw new Error('Neither Firebase AI nor Gemini API key is available. Please ensure Firebase AI Logic is enabled or provide GEMINI_API_KEY.');
            }
        }
    }
    return model;
};

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
    const aiModel = getModel();
    
    let result;
    if (useDirectGemini) {
      // Direct Gemini API format
      result = await aiModel.generateContent([
        prompt,
        audioPart
      ]);
    } else {
      // Firebase AI format
      result = await aiModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            audioPart
          ]
        }]
      });
    }
    
    const response = result.response;
    const responseText = response.candidates?.[0].content.parts[0].text || response.text?.();
    
    console.log('Transcription complete.');
    return responseText || "No text in response.";
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
};

