import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "@firebase/ai";
import { storage } from '#config/firebaseAdmin';

// Initialize Firebase Client App (separate from Admin) for AI SDK
// In a real scenario, ensure these env vars are set or use a proper config
const firebaseConfig = {
  apiKey: "AIzaSyAS8SssaU0ajy1cTk0kJGcMogwrk4xyd0Y",
  authDomain: "yara-speckit.firebaseapp.com",
  projectId: "yara-speckit",
  storageBucket: "yara-speckit.firebasestorage.app",
  messagingSenderId: "1054565466870",
  appId: "1:1054565466870:web:18da97ea32422bbafa22d7",
  measurementId: "G-60NCCYT18Q"
};

const firebaseApp = initializeApp(firebaseConfig, "AI_CLIENT");
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

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

