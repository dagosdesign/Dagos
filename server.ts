import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Endpoint to check if AI is configured
app.get("/api/config", (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({ isConfigured });
});

// API endpoint to dynamically generate a vocabulary quiz using Gemini API
app.post("/api/generate-quiz", async (req, res) => {
  const { theme, count = 5 } = req.body;

  if (!theme || typeof theme !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'theme' in request body." });
  }

  try {
    const ai = getAIClient();
    
    const systemInstruction = 
      "You are an expert English Language Professor and lexicographer. " +
      "Your task is to generate premium, high-quality multiple-choice vocabulary exercises " +
      "specifically tailored to a student. All output must be entirely in English.";

    const prompt =
      `Generate exactly ${count} English vocabulary questions based on the theme or difficulty level: "${theme}".\n\n` +
      `Each question must focus on a single target word. Provide four distinct definition options, ` +
      `where exactly one is correct and three are plausible-looking but incorrect. ` +
      `Also provide a Turkish translation for each of the four options, in the same order, in the optionsTr array. ` +
      `Ensure each target word has its correct part of speech, and a highly detailed explanation block ` +
      `including its meaning, 2 to 3 practical example sentences in English, 3 to 5 synonyms, and 3 to 5 antonyms.\n\n` +
      `Ensure the correctIndex points precisely to the correct definition option. All words and definitions must be in English, except optionsTr which must be in Turkish.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: `An array of exactly ${count} vocabulary questions.`,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { 
                type: Type.STRING, 
                description: "The target vocabulary word to practice. Keep it relevant to the user's requested theme." 
              },
              partOfSpeech: { 
                type: Type.STRING, 
                description: "The part of speech in lowercase (e.g., 'noun', 'verb', 'adjective', 'adverb')." 
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly four definition options. Only one option must be the true definition, and the other three must be plausible incorrect definitions."
              },
              optionsTr: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly four Turkish translations, one for each entry in 'options', in the same order."
              },
              correctIndex: {
                type: Type.INTEGER, 
                description: "The 0-based index of the correct definition option in the options array (must be 0, 1, 2, or 3)." 
              },
              explanation: {
                type: Type.OBJECT,
                properties: {
                  meaning: { 
                    type: Type.STRING, 
                    description: "A clear, concise, and easy-to-understand definition of the word in English." 
                  },
                  exampleSentences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 2 or 3 natural-sounding English sentences showing the target word used in context."
                  },
                  synonyms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 to 5 common synonyms for the target word."
                  },
                  antonyms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 to 5 common antonyms for the target word."
                  }
                },
                required: ["meaning", "exampleSentences", "synonyms", "antonyms"]
              }
            },
            required: ["word", "partOfSpeech", "options", "optionsTr", "correctIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from the Gemini model.");
    }

    const quizData = JSON.parse(text.trim());
    
    // Add a unique ID to each question generated
    const formattedQuestions = quizData.map((q: any, idx: number) => ({
      ...q,
      id: `dynamic-${Date.now()}-${idx}`
    }));

    res.json({ questions: formattedQuestions });

  } catch (err: any) {
    console.error("Gemini API Quiz Generation Error:", err);
    if (err.message && err.message.includes("GEMINI_API_KEY")) {
      return res.status(403).json({ 
        error: "api_key_missing", 
        message: "Your Gemini API key is not configured in the Secrets panel." 
      });
    }
    res.status(500).json({ 
      error: "generation_failed", 
      message: "Could not generate questions. Please try again or use the offline static modes.",
      details: err.message 
    });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
