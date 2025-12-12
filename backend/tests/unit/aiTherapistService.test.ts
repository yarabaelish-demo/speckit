// Mock environment variables
process.env.FIREBASE_API_KEY = 'test-api-key';

// Mock Google Generative AI
const mockGenerateContent = jest.fn();
const mockSendMessage = jest.fn();
const mockStartChat = jest.fn(() => ({
    sendMessage: mockSendMessage
}));
const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
    startChat: mockStartChat
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

const { getAIResponse, chatWithTherapist } = require('#services/aiTherapistService');

describe('aiTherapistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
        response: {
            text: () => 'mock AI therapist response for your journal entry'
        }
    });
    mockSendMessage.mockResolvedValue({
        response: {
            text: () => 'mock AI therapist chat response'
        }
    });
  });

  describe('getAIResponse', () => {
    it('should return a mock AI response', async () => {
      const text = 'This is a test transcription.';
      const response = await getAIResponse(text);
      expect(response).toEqual(expect.any(String));
      expect(response).toContain('mock AI therapist response');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const text = 'This is a test transcription.';
      const response = await getAIResponse(text);
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
      expect(mockStartChat).toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(message);
    });

    it('should handle chat errors by throwing', async () => {
      mockSendMessage.mockRejectedValue(new Error('Chat API Error'));

      const history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
      const message = 'How are you?';
      
      await expect(chatWithTherapist(history, message)).rejects.toThrow('Failed to get chat response.');
    });
  });
});