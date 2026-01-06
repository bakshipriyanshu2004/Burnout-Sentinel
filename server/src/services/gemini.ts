import { GoogleGenAI } from "@google/genai";

let aiClient: any = null;

const getClient = () => {
    if (aiClient) return aiClient;

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.warn("GEMINI_API_KEY is not set in environment variables.");
        return null;
    }

    aiClient = new GoogleGenAI({ apiKey: API_KEY });
    return aiClient;
};

export const generateResponse = async (prompt: string, context?: string): Promise<string> => {
    const ai = getClient();

    if (!ai) return "I'm sorry, my connection to the AI service is not configured.";

    try {
        const fullPrompt = `
        You are Sathi, a supportive, motivational, and analytical friend to a student.
        Your goal is to help them succeed academically and mentally, preventing burnout.
        
        CONTEXT DATA ABOUT THE STUDENT:
        ${context || "No specific data available."}

        USER MESSAGE:
        ${prompt}

        INSTRUCTIONS:
        - Be friendly and empathetic.
        - Use the context data to give specific advice (e.g., if grades are low, ask about study habits; if risk is high, suggest a break).
        - Keep responses concise (under 3 sentences usually) unless a deep explanation is asked for.
        - Don't sound like a generic robot, sound like a caring peer.
        - If the user seems overwhelmed or asks for help focusing, suggest scheduling a "Focus Block".
        - IMPORTANT: If you suggest a Focus Block, append the string "<Action:FocusBlock>" to the end of your message.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I'm having a little trouble thinking right now. Can we try again later?";
    }
};
