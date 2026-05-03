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

// ─── Standard response (legacy, kept for fallback) ───────────────────────────
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
        - Use the context data to give specific advice.
        - Keep responses concise (under 3 sentences) unless a deep explanation is asked for.
        - Don't sound like a generic robot, sound like a caring peer.
        - If the user seems overwhelmed or asks for help focusing, suggest scheduling a "Focus Block".
        - IMPORTANT: If you suggest a Focus Block, append "<Action:FocusBlock>" to the end of your message.
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

// ─── RAG-grounded response ────────────────────────────────────────────────────
export const generateRAGResponse = async (
    userMessage: string,
    retrievedContext: string,
    studentContext: string
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "I'm sorry, my connection to the AI service is not configured.";

    try {
        const hasDocContext = retrievedContext && retrievedContext.trim().length > 0;

        const fullPrompt = `
You are Sathi, a knowledgeable and supportive academic assistant for students.

${hasDocContext ? `
=== COURSE DOCUMENT CONTEXT ===
The following passages are extracted from the student's official course materials and textbooks.
Use ONLY this information to answer course-related questions. Do NOT use general AI knowledge for subject matter.
If the answer is not found in the context below, clearly say "I couldn't find that in your course materials."

${retrievedContext}
=== END OF DOCUMENT CONTEXT ===
` : `
NOTE: No course documents have been indexed yet. Answer helpfully but mention that course-specific answers will be available once documents are uploaded.
`}

=== STUDENT PROFILE ===
${studentContext}
=== END OF STUDENT PROFILE ===

=== USER QUESTION ===
${userMessage}

=== YOUR RESPONSE GUIDELINES ===
- For subject/course questions: answer ONLY from the document context above. Quote sources when helpful.
- For motivation, study tips, or general wellbeing: use your best judgment plus the student profile.
- Be warm, friendly, and concise. Use simple language.
- If suggesting a Focus Block for scheduling, append "<Action:FocusBlock>" at the end.
- Never hallucinate facts. If unsure, say so clearly.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini RAG Error:", error);
        return "I'm having a little trouble thinking right now. Can we try again later?";
    }
};

// ─── RAG-grounded response with optional image (Gemini Vision) ───────────────
export const generateRAGResponseWithImage = async (
    userMessage: string,
    imageBase64: string | undefined,
    retrievedContext: string,
    studentContext: string
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "I'm sorry, my connection to the AI service is not configured.";

    const hasDocContext = retrievedContext && retrievedContext.trim().length > 0;

    const systemPrompt = `
You are Sathi, a knowledgeable and supportive academic assistant for students.

${hasDocContext ? `=== COURSE DOCUMENT CONTEXT ===\nUse ONLY this for course-related questions. If not found here, say "I couldn't find that in your course materials."\n\n${retrievedContext}\n=== END ===` : 'NOTE: No course documents indexed yet.'}

=== STUDENT PROFILE ===
${studentContext}
=== END ===

${imageBase64 ? '=== IMAGE ATTACHED ===\nThe student has uploaded an image. Analyze it carefully and relate it to their coursework if possible.\n=== END ===' : ''}

USER QUESTION: ${userMessage}

GUIDELINES:
- For subject questions: answer from document context only.
- For images: describe, explain concepts shown, help with the problem.
- Be warm, concise, student-friendly.
- If suggesting a Focus Block, append "<Action:FocusBlock>" at the end.
- Never hallucinate. If unsure, say so clearly.`.trim();

    try {
        let contents: any;

        if (imageBase64) {
            contents = {
                parts: [
                    { text: systemPrompt },
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                ]
            };
        } else {
            contents = systemPrompt;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
        });

        return response.text;
    } catch (error) {
        console.error("Gemini Vision/RAG Error:", error);
        return "I'm having a little trouble analyzing that right now. Can we try again?";
    }
};
