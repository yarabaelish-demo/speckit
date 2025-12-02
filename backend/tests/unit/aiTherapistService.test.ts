import { describe, expect, it } from '@jest/globals';
import { getAIResponse } from '#services/aiTherapistService';

describe('aiTherapistService', () => {
  it('should return a mock AI response', async () => {
    const text = 'This is a test transcription.';
    const response = await getAIResponse(text);
    expect(response).toEqual(expect.any(String));
    expect(response).toContain('mock AI therapist response');
  });
});
