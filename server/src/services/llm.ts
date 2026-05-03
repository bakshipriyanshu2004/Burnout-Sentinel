import Groq from 'groq-sdk';

let _groq: Groq | null = null;

function getGroq(): Groq {
    if (!_groq) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY not set in environment');
        _groq = new Groq({ apiKey });
    }
    return _groq;
}

// ─── RAG-grounded response (text only) ───────────────────────────────────────
export async function generateRAGResponse(
    userMessage: string,
    retrievedContext: string,
    studentContext: string
): Promise<string> {
    return generateRAGResponseWithImage(userMessage, undefined, retrievedContext, studentContext);
}

// ─── RAG-grounded response with optional image (vision) ──────────────────────
export async function generateRAGResponseWithImage(
    userMessage: string,
    imageBase64: string | undefined,
    retrievedContext: string,
    studentContext: string
): Promise<string> {
    const groq = getGroq();
    const hasDocContext = retrievedContext && retrievedContext.trim().length > 0;

    const systemPrompt = `You are Sathi, a knowledgeable and supportive academic assistant for students at BCREC college.

${hasDocContext
    ? `=== COURSE DOCUMENT CONTEXT ===
Use ONLY the following information to answer course-related questions. If the answer is not found here, say "I couldn't find that in your course materials, but I can help with general guidance."

${retrievedContext}
=== END OF COURSE CONTEXT ===`
    : `NOTE: No course documents are indexed yet. For course-specific questions, mention that materials are being prepared.`
}

=== STUDENT PROFILE ===
${studentContext}
=== END ===

GUIDELINES:
- For subject/syllabus questions: answer strictly from the course context above.
- Be warm, encouraging, and student-friendly.
- Keep answers concise but complete.
- If the student seems stressed or burned out, offer motivational support.
- If suggesting a Focus Block session, append "<Action:FocusBlock>" at the very end of your response.
- Never make up facts. If unsure, say so.`;

    try {
        const messages: any[] = [
            { role: 'system', content: systemPrompt }
        ];

        if (imageBase64) {
            // Use vision-capable model for images
            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: userMessage || 'Please analyze this image and explain what you see in the context of my studies.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBase64}`
                        }
                    }
                ]
            });
        } else {
            messages.push({ role: 'user', content: userMessage });
        }

        const response = await groq.chat.completions.create({
            model: imageBase64 ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile',
            messages,
            max_tokens: 1024,
            temperature: 0.6,
        });

        return response.choices[0]?.message?.content ?? "I'm having trouble responding right now. Please try again.";
    } catch (error: any) {
        console.error('[Groq LLM Error]', error?.message ?? error);
        return "I'm having a little trouble right now. Please try again in a moment.";
    }
}
