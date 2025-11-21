import { SpeechClient } from '@google-cloud/speech';

const client = new SpeechClient();

export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const audio = { uri: audioUri };
  const config = {
    encoding: 'MP3' as const,
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = { audio, config };

  const [response] = await client.recognize(request);
  const transcription = response.results
    ?.map((result) => result.alternatives?.[0]?.transcript)
    .join('\n');

  return transcription || '';
};
