export const transcribeAudio = async (audioUrl: string): Promise<string> => {
    // Mock transcription service
    console.log(`Transcribing audio from: ${audioUrl}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const mockTranscription = "This is a mock transcription of the audio file.";
        console.log("Transcription complete.");
        resolve(mockTranscription);
      }, 500).unref(); // Simulate a .5-second transcription process
    });
  };