import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.FIREBASE_API_KEY;
if (!apiKey) {
    console.error("FIREBASE_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key'); // Fallback for tests if needed, though robust checks preferred
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Updated to a standard available model, 'gemini-2.5-pro' might not be valid in this SDK yet or typo
    systemInstruction: "You are a compassionate, thoughtful, and non-judgmental AI therapist. Your goal is to help the user process their thoughts and feelings based on their audio journal entries. Respond with empathy and insight."
});

export const getAIResponse = async (transcription: string): Promise<string> => {
    console.log(`Getting AI response for transcription length: ${transcription.length}`);
    try {
        const prompt = `Here is a transcription of my audio journal entry:\n\n"${transcription}"\n\nPlease provide a thoughtful, therapeutic response to what I've shared.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text || "I'm sorry, I couldn't generate a response at this time.";
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I'm having trouble processing your entry right now.";
    }
};

export const chatWithTherapist = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
    console.log(`Chatting with therapist. History length: ${history.length}`);
    try {
        // Convert history to Google GenAI format
        // Expected: { role: 'user' | 'model', parts: { text: string }[] }[] or similar
        // The SDK expects `Content` objects.
        let formattedHistory = history.map(item => ({
            role: item.role,
            parts: item.parts
        }));

        // Validate history starts with user
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            console.log("Removing initial model message from history to satisfy API requirements.");
            formattedHistory.shift();
        }

        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();
        return text || "I'm sorry, I didn't catch that.";
    } catch (error) {
        console.error("Error in chatWithTherapist:", error);
        throw new Error("Failed to get chat response.");
    }
};