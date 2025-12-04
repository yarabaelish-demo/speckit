import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { storage } from '#config/firebaseAdmin';

// Initialize Vertex AI (Server-side SDK)
const projectId = 'yara-speckit';
const location = 'us-central1';
const modelName = 'gemini-1.5-flash';

const vertex_ai = new VertexAI({ project: projectId, location: location });
const model: GenerativeModel = vertex_ai.getGenerativeModel({ model: modelName });

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
    console.error('Error in transcribeAudio (Vertex AI):', error);
    throw error;
  }
};

