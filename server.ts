import express from "express";
import path from "path";
import fs from "fs";
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
  params: { contents: any; config?: any },
  models: string[] = GEMINI_MODELS
) {
  let lastErr: any;
  for (const model of models) {
    try {
      return await ai.models.generateContent({ model, ...params });
    } catch (err: any) {
      lastErr = err;
      // Network-level failure (no HTTP status): the host itself is unreachable,
      // so trying other models would just stack more connect timeouts. Fail fast.
      if (err?.status === undefined) {
        console.warn(`Network failure reaching Gemini — failing fast.`);
        throw err;
      }
      // Retryable per-model: overloaded (503) or gated for this account (404).
      if (err.status !== 503 && err.status !== 404) throw err;
      console.warn(`Model ${model} failed (${err.status}), trying next fallback...`);
    }
  }
  throw lastErr;
}

// Word data (irregular verb forms etc.) from the public vocabulary file.
let vocabCache: Record<string, { forms?: string[] }> | null = null;
function getVocab(): Record<string, { forms?: string[] }> {
  if (!vocabCache) {
    try {
      vocabCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "vocabulary.json"), "utf8"));
    } catch {
      vocabCache = {};
    }
  }
  return vocabCache!;
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
      "Use simple, natural, real-life English — never stiff or AI-sounding. " +
      "Output must match the JSON schema exactly.";

    // Random flavor seeds so every generation feels different.
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const STORY_SETTINGS = [
      "a busy restaurant kitchen", "a night train between two cities", "a small fishing harbor",
      "a mountain village in winter", "a crowded street market", "a quiet public library",
      "a startup office on launch day", "an old family farmhouse", "a football stadium",
      "a long airport layover", "a neighborhood barbershop", "a university dormitory",
      "a road trip on a rainy highway", "a tiny repair shop", "a summer camping trip",
      "a hospital waiting room", "a music rehearsal studio", "a ferry crossing at dawn",
      "a bakery before sunrise", "a museum after closing time",
    ];
    const STORY_STYLES = [
      "start in the middle of the action", "start with a short line of dialogue",
      "start with a surprising fact about the main character", "start with a small problem that needs solving",
      "start with a sound or smell the character notices", "start with a decision the character just made",
    ];
    const DIALOGUE_SCENES = [
      "two coworkers fixing a last-minute problem", "two friends planning a weekend trip",
      "a customer and a shopkeeper", "two neighbors talking over the fence",
      "two teammates after a match", "a student and a tutor between classes",
      "two cousins cooking together", "two travelers waiting for a delayed bus",
      "a mechanic and a car owner", "two flatmates deciding what to fix in the flat",
      "a barista and a regular customer", "two colleagues stuck in an elevator",
      "two old friends who met by chance at a market", "a landlord and a tenant",
      "two hikers reading a trail map", "siblings organizing a surprise party",
    ];

    const STYLE_RULES =
      `Style rules: never open with a time expression ("Last week", "Yesterday", "One day", "This morning"...); ` +
      `weave any time references naturally into the middle of sentences. Vary sentence structures. ` +
      `Use everyday vocabulary and realistic details. Avoid clichés and repeated formulas. ` +
      `No ornate or artificial phrasing — it must read like something a real person would write or say.`;

    // Irregular verbs get past/participle-focused usage rules.
    const forms = getVocab()[word.toLowerCase()]?.forms;
    let usageRule: string;
    if (forms && forms.length === 3) {
      const base = word.toLowerCase();
      const v2 = forms[1].split("/")[0].trim();
      const v3 = forms[2].split("/")[0].trim();
      const wantNegative = Math.random() < 0.4;
      const wantQuestion = Math.random() < 0.5;
      usageRule =
        kind === "story"
          ? `The target is the irregular verb "${forms[0]} / ${forms[1]} / ${forms[2]}". Tell the story mostly in past ` +
            `tense so its past form "${v2}" appears naturally at least twice (exact form, so it can be highlighted); ` +
            `the base form "${base}" may also appear once.` +
            (wantNegative ? ` Include exactly one natural negative past sentence using "didn't ${base}".` : "")
          : `The target is the irregular verb "${forms[0]} / ${forms[1]} / ${forms[2]}". Use its past form "${v2}" at ` +
            `least twice, and if it fits naturally use the perfect form "have/has ${v3}" once.` +
            (wantQuestion ? ` Include one question that uses the verb.` : "") +
            (wantNegative ? ` Include one natural negative form ("didn't ${base}" or "haven't ${v3}").` : "");
    } else {
      usageRule =
        `The content must naturally use the target word/phrase "${word}"` +
        (meaning ? ` (Turkish meaning: ${meaning})` : "") +
        ` at least 3 times, in its exact base form "${word}" each time so it can be highlighted.`;
    }

    const prompt =
      kind === "story"
        ? `Write an engaging short story in simple English (130-170 words, 2-3 paragraphs separated by \\n\\n) ` +
          `for a vocabulary learner. Setting: ${pick(STORY_SETTINGS)}. Opening technique: ${pick(STORY_STYLES)}. ` +
          `${usageRule} ` +
          `${STYLE_RULES} Give the story a short catchy title (3-6 words). Do not translate the story.`
        : `Write a natural two-person dialogue in simple English (8-10 short lines, alternating speakers A and B, ` +
          `starting with A). Scene: ${pick(DIALOGUE_SCENES)}. Start mid-conversation — no greetings like ` +
          `"Hey, how are you?" and no small-talk openers. ${usageRule} ` +
          `${STYLE_RULES} Give it a short title (2-5 words) describing the situation. Do not translate.`;

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

    // Latency-sensitive endpoint: lead with the fastest model.
    const response = await generateResilient(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    }, ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.0-flash"]);

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
