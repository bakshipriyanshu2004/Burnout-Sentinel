const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

async function testGemini() {
    const API_KEY = process.env.GEMINI_API_KEY;
    console.log("Testing with Key:", API_KEY ? "Found (Starts with " + API_KEY.substring(0, 5) + ")" : "Not Found");

    if (!API_KEY) return;

    try {
        const ai = new GoogleGenAI({ key: API_KEY });

        console.log("Sending request...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hello!",
        });

        console.log("Success! Response:", response.text);
    } catch (error) {
        console.error("Test Failed:", error.message);
        console.log("Full Error:", JSON.stringify(error, null, 2));
    }
}

testGemini();
