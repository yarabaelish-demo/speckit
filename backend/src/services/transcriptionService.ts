import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "@firebase/ai";
import { storage } from '#config/firebaseAdmin';

// Initialize Firebase Client App (separate from Admin) for AI SDK
// In a real scenario, ensure these env vars are set or use a proper config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, // Use environment variable
  authDomain: process.env.FIREBASE_AUTH_DOMAIN, // Use environment variable
  projectId: process.env.GCLOUD_PROJECT, // Use environment variable
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT}.appspot.com`, // Use environment variable or derive
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID, // Use environment variable
  appId: process.env.FIREBASE_APP_ID, // Use environment variable
  // measurementId: process.env.FIREBASE_MEASUREMENT_ID, // Optional
};

const firebaseApp = initializeApp(firebaseConfig, "AI_CLIENT");
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" }); // Updated model to gemini-2.5-flash

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

  // 3. Prepare the part object (mimicking the client-side fileToGenerativePart)
  // Determine mimeType based on file extension
  const extension = filePath.split('.').pop()?.toLowerCase();
  let mimeType = 'audio/mpeg'; // Default to MP3
  if (extension === 'm4a') {
      mimeType = 'audio/m4a';
  }

  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: mimeType,
    },
  };

  const prompt = "Transcribe what's said in this audio recording.";

  try {
    const result = await model.generateContent([prompt, audioPart]);
    let responseText = "No text in response.";

    if (result && result.response && typeof result.response.text === 'function') {
      responseText = result.response.text();
    }
    
    console.log('Transcription complete.');
    return responseText || "No text in response.";
  } catch (error) {
    console.error('Error in transcribeAudio (Firebase AI):', error);
    throw error;
  }
};

