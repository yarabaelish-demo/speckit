// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';
process.env.FIREBASE_AUTH_DOMAIN = 'test-domain';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.FIREBASE_APP_ID = 'test-app-id';

// Mock Firebase AI modules
jest.mock('@firebase/ai', () => ({
  getAI: jest.fn(),
  getGenerativeModel: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        candidates: [{
          content: {
            parts: [{
              text: 'mock AI therapist response for your journal entry'
            }]
          }
        }]
      }
    }),
    startChat: jest.fn(() => ({
      sendMessage: jest.fn().mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{
                text: 'mock AI therapist chat response'
              }]
            }
          }]
        }
      })
    }))
  }))
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({}))
}));

const { getAIResponse, chatWithTherapist } = require('#services/aiTherapistService');

describe('aiTherapistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAIResponse', () => {
    it('should return a mock AI response', async () => {
      const text = 'This is a test transcription.';
      const response = await getAIResponse(text);
      expect(response).toEqual(expect.any(String));
      expect(response).toContain('mock AI therapist response');
    });

    it('should handle errors gracefully', async () => {
      // Mock the Firebase AI to throw an error by re-mocking the module
      jest.doMock('@firebase/ai', () => ({
        getAI: jest.fn(),
        getGenerativeModel: jest.fn(() => ({
          generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
        }))
      }));

      // Re-import the module to get the new mock
      jest.resetModules();
      const { getAIResponse: getAIResponseWithError } = require('#services/aiTherapistService');

      const text = 'This is a test transcription.';
      const response = await getAIResponseWithError(text);
      expect(response).toBe("I'm sorry, I'm having trouble processing your entry right now.");
    });
  });

  describe('chatWithTherapist', () => {
    it('should return a chat response', async () => {
      const history = [
        { role: 'user', parts: [{ text: 'Hello' }] }
      ];
      const message = 'How are you?';
      
      const response = await chatWithTherapist(history, message);
      expect(response).toEqual(expect.any(String));
      expect(response).toContain('mock AI therapist chat response');
    });

    it('should handle chat errors by throwing', async () => {
      // Mock the Firebase AI to throw an error by re-mocking the module
      jest.doMock('@firebase/ai', () => ({
        getAI: jest.fn(),
        getGenerativeModel: jest.fn(() => ({
          startChat: jest.fn(() => ({
            sendMessage: jest.fn().mockRejectedValue(new Error('Chat API Error'))
          }))
        }))
      }));

      // Re-import the module to get the new mock
      jest.resetModules();
      const { chatWithTherapist: chatWithTherapistWithError } = require('#services/aiTherapistService');

      const history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
      const message = 'How are you?';
      
      await expect(chatWithTherapistWithError(history, message)).rejects.toThrow('Failed to get chat response.');
    });
  });
});
