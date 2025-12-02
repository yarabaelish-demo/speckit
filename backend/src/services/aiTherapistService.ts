export const getAIResponse = async (text: string): Promise<string> => {
    // Mock AI therapist service
    console.log(`Getting AI response for: ${text}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResponse = "This is a mock AI therapist response. It seems like you are feeling [emotion].";
        console.log("AI response generated.");
        resolve(mockResponse);
      }, 500).unref(); // Simulate a .5-second AI response process
    });
  };