import { getAI, getGenerativeModel } from '@firebase/ai';
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const ai = getAI(app);
const model = getGenerativeModel(ai, {
    model: 'gemini-2.5-pro',
    systemInstruction: "You are a compassionate, thoughtful, and non-judgmental AI therapist. Your goal is to help the user process their thoughts and feelings based on their audio journal entries. Respond with empathy and insight."
});

export const getAIResponse = async (transcription: string): Promise<string> => {
    console.log(`Getting AI response for transcription length: ${transcription.length}`);
    try {
        const prompt = `Here is a transcription of my audio journal entry:\n\n"${transcription}"\n\nPlease provide a thoughtful, therapeutic response to what I've shared.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates?.[0].content.parts[0].text;
        return text || "I'm sorry, I couldn't generate a response at this time.";
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "I'm sorry, I'm having trouble processing your entry right now.";
    }
};

export const chatWithTherapist = async (history: { role: string, parts: { text: string }[] }[], message: string): Promise<string> => {
    console.log(`Chatting with therapist. History length: ${history.length}`);
    try {
        // Convert history to Firebase AI format
        const formattedHistory = history.map(item => ({
            role: item.role as "user" | "model" | "system" | "function",
            parts: item.parts
        }));

        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.candidates?.[0].content.parts[0].text;
        return text || "I'm sorry, I didn't catch that.";
    } catch (error) {
        console.error("Error in chatWithTherapist:", error);
        throw new Error("Failed to get chat response.");
    }
};