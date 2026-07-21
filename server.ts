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

// Tries the primary model first; on 503 (overloaded) or 404 (gated for this
// account) walks down the fallback chain. All verified available for this key.
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-2.0-flash",
];

async function generateResilient(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  let lastErr: any;
  for (const model of GEMINI_MODELS) {
    try {
      return await ai.models.generateContent({ model, ...params });
    } catch (err: any) {
      lastErr = err;
      // Retryable: overloaded (503), gated model (404), or network-level failure (no HTTP status).
      const retryable = err?.status === 503 || err?.status === 404 || err?.status === undefined;
      if (!retryable) throw err;
      console.warn(`Model ${model} failed (${err?.status ?? "network"}), trying next fallback...`);
    }
  }
  throw lastErr;
}

// Endpoint to check if AI is configured
app.get("/api/config", (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  res.json({ isConfigured });
});

// AI Coach chat endpoint — a conversational English-learning tutor.
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body as {
    messages?: { role: "user" | "assistant"; content: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing or invalid 'messages' in request body." });
  }

  try {
    const ai = getAIClient();

    const systemInstruction =
      "You are 'AI Coach', a warm, encouraging English-learning tutor for Turkish speakers. " +
      "Help the student practice English: explain vocabulary and grammar, correct their mistakes gently, " +
      "give example sentences, and hold simple conversations to build fluency. " +
      "Keep replies concise (2-5 sentences). When the student writes in Turkish, you may briefly answer in " +
      "Turkish but always steer them back to practicing English. When you correct an error, show the corrected " +
      "sentence clearly. Be positive and motivating.";

    // Gemini expects a `contents` array with role 'user' | 'model'.
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await generateResilient(ai, {
      contents,
      config: { systemInstruction },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from the Gemini model.");
    }

    res.json({ reply: text.trim() });
  } catch (err: any) {
    console.error("Gemini AI Coach Chat Error:", err);
    if (err.message && err.message.includes("GEMINI_API_KEY")) {
      return res.status(403).json({
        error: "api_key_missing",
        message: "Your Gemini API key is not configured.",
      });
    }
    res.status(500).json({
      error: "chat_failed",
      message: "Could not reach the AI Coach right now. Please try again.",
      details: err.message,
    });
  }
});

// Generates practice content for a target word: a short story or a two-person dialogue.
app.post("/api/practice-content", async (req, res) => {
  const { kind, word, meaning } = req.body as {
    kind?: "story" | "dialogue";
    word?: string;
    meaning?: string;
  };

  if ((kind !== "story" && kind !== "dialogue") || !word || typeof word !== "string") {
    return res.status(400).json({ error: "Expected { kind: 'story'|'dialogue', word, meaning? }." });
  }

  try {
    const ai = getAIClient();

    const systemInstruction =
      "You are an English-learning content writer for Turkish students (A2-B1 level). " +
      "Use simple, natural English. Output must match the JSON schema exactly.";

    const prompt =
      kind === "story"
        ? `Write an engaging short story in simple English (130-170 words, 2-3 paragraphs separated by \\n\\n) ` +
          `for a vocabulary learner. The story must naturally use the target word/phrase "${word}"` +
          (meaning ? ` (Turkish meaning: ${meaning})` : "") +
          ` at least 3 times, in its exact base form "${word}" each time so it can be highlighted. ` +
          `Give the story a short catchy title (3-6 words). Do not translate the story.`
        : `Write a natural two-person dialogue in simple English between two friends, A and B ` +
          `(8-10 short lines, alternating speakers, starting with A). The dialogue must naturally use ` +
          `the target word/phrase "${word}"` +
          (meaning ? ` (Turkish meaning: ${meaning})` : "") +
          ` at least 3 times, in its exact base form "${word}" each time so it can be highlighted. ` +
          `Give it a short title (2-5 words) describing the situation. Do not translate.`;

    const responseSchema =
      kind === "story"
        ? {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short catchy story title." },
              story: { type: Type.STRING, description: "The story text, paragraphs separated by \\n\\n." },
            },
            required: ["title", "story"],
          }
        : {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short situation title." },
              lines: {
                type: Type.ARRAY,
                description: "Dialogue lines in order, alternating speakers starting with A.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING, description: "Either 'A' or 'B'." },
                    text: { type: Type.STRING, description: "What this speaker says." },
                  },
                  required: ["speaker", "text"],
                },
              },
            },
            required: ["title", "lines"],
          };

    const response = await generateResilient(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response received from the Gemini model.");

    res.json(JSON.parse(text.trim()));
  } catch (err: any) {
    console.error("Gemini practice-content error:", err);
    if (err.message && err.message.includes("GEMINI_API_KEY")) {
      return res.status(403).json({
        error: "api_key_missing",
        message: "Gemini API anahtarı tanımlı değil.",
      });
    }
    res.status(500).json({
      error: "generation_failed",
      message: "İçerik üretilemedi. Lütfen tekrar dene.",
      details: err.message,
    });
  }
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

    const response = await generateResilient(ai, {
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
