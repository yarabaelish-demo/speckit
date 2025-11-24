import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'yara-speckit';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

const vertexAI = new VertexAI({ project, location });

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
});

export const getTherapistResponse = async (transcription: string): Promise<string> => {
  const prompt = `You are a helpful and empathetic AI therapist. Analyze the following audio transcription and provide a supportive and insightful response, similar to what a human therapist might say:

Transcription: "${transcription}"

Therapist Response:`;

  const result = await model.generateContent(prompt);
  const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

  return response || 'I am here to listen. Please tell me more.';
};
