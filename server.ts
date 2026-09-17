import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality, Type } from "@google/genai";
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

// AI LEX chat endpoint — a conversational English-learning tutor.
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
      "You are 'AI LEX', a warm, encouraging English-learning tutor for Turkish speakers. " +
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
    console.error("Gemini AI LEX Chat Error:", err);
    if (err.message && err.message.includes("GEMINI_API_KEY")) {
      return res.status(403).json({
        error: "api_key_missing",
        message: "Your Gemini API key is not configured.",
      });
    }
    res.status(500).json({
      error: "chat_failed",
      message: "Could not reach the AI LEX right now. Please try again.",
      details: err.message,
    });
  }
});

// Rolling memory of recent openings per kind, so consecutive generations don't
// fall back into the same first-sentence template. Stories and dialogues are
// tracked separately — their opening logic must not resemble each other.
const recentOpenings: { story: string[]; dialogue: string[] } = { story: [], dialogue: [] };
const rememberOpening = (kind: "story" | "dialogue", opening: string) => {
  const list = recentOpenings[kind];
  const clean = opening.replace(/\s+/g, " ").trim().slice(0, 110);
  if (!clean) return;
  list.push(clean);
  if (list.length > 12) list.shift();
};

/* AI Speaking - a real-time voice conversation with Gemini Live, the same kind
   of spoken chat as the Gemini app, only for practising English.
   The browser never sees the API key: this endpoint hands out a short-lived,
   single-use token whose model, voice and tutor instructions are locked here. */
const LIVE_MODELS = ["gemini-3.1-flash-live-preview", "gemini-2.5-flash-native-audio-latest"];

const LIVE_SYSTEM_INSTRUCTION =
  "You are AI LEX, a friendly English speaking partner for Turkish students. This is a live, spoken " +
  "conversation, like a phone call. Speak ONLY in English, clearly and at a natural but slightly slower pace. " +
  "Keep each turn short - usually one to three sentences - so the student does most of the talking. " +
  "Match the student's level: use simple words with beginners and richer language with advanced speakers. " +
  "Ask open, interesting questions about daily life, school, hobbies, plans and opinions to keep the " +
  "conversation going. When the student makes a mistake, do not lecture: naturally repeat the sentence " +
  "correctly in your reply (for example 'Oh, you went to the park yesterday? Nice!'). If the student " +
  "speaks Turkish or is stuck, help with a short English phrase they can use and encourage them to try. " +
  "Never use lists, markdown or emojis. Start by greeting the student warmly and asking how their day is going.";

app.post("/api/live-token", async (_req, res) => {
  try {
    const ai = getAIClient();
    const now = Date.now();
    let lastError: unknown = null;
    for (const model of LIVE_MODELS) {
      try {
        const token = await ai.authTokens.create({
          config: {
            uses: 1,
            expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
            newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
            liveConnectConstraints: {
              model,
              config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: LIVE_SYSTEM_INSTRUCTION,
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
            },
            lockAdditionalFields: [],
            httpOptions: { apiVersion: "v1alpha" },
          },
        });
        return res.json({ token: token.name, model });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  } catch (error: any) {
    console.error("Live token error:", error?.message || error);
    res.status(500).json({
      error: "live_token_failed",
      message: "Voice conversation is not available right now. Please try again.",
      details: String(error?.message || error).slice(0, 300),
    });
  }
});

/* AI Learning Insight: a short, personal analysis written only from the student's
   measured performance (the client sends the analysis of its answer record). */
app.post("/api/learning-insight", async (req, res) => {
  const { data } = req.body as { data?: unknown };
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Missing 'data' in request body." });
  }
  try {
    const ai = getAIClient();
    const systemInstruction =
      "You are the learning analyst of Lexistencehub, an English learning app for Turkish students. " +
      "Write an insight ONLY from the performance data you are given. Every sentence must state something " +
      "concrete that the data shows: a strength with its topic, a recurring difficulty, a trend (improving or " +
      "declining accuracy), study consistency, or an area with too little practice. Name topics exactly as they " +
      "appear in the data. Never invent topics, numbers or activities that are not in the data. " +
      "Do NOT write motivational filler such as 'Keep going', 'You are doing great' or 'Practice makes perfect'. " +
      "Write in English, second person, calm and professional. " +
      "preview: one or two sentences (max 35 words) with the single most important finding. " +
      "detail: three to five sentences that expand on the findings and say what to focus on next.";
    const response = await generateResilient(ai, {
      contents: `Student performance data (JSON):\n${JSON.stringify(data).slice(0, 12000)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { preview: { type: Type.STRING }, detail: { type: Type.STRING } },
          required: ["preview", "detail"],
        },
        temperature: 0.4,
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.preview || !parsed.detail) throw new Error("Empty insight");
    res.json({ preview: String(parsed.preview).trim(), detail: String(parsed.detail).trim() });
  } catch (err: any) {
    console.error("Learning insight error:", err?.message || err);
    res.status(500).json({ error: "insight_failed", message: "The learning insight could not be prepared right now." });
  }
});

/* Practice: focused questions on one weakness (Practice This) or on several
   development areas at once (Performance Analysis → START PRACTICE), pitched at
   the student's level and current accuracy and built around their own mistakes.
   With several targets the weakest topic gets the most questions, and every
   question says which target it practises. */
app.post("/api/weakness-practice", async (req, res) => {
  type Target = {
    area?: string;
    concept?: string;
    difficulty?: "easy" | "medium" | "hard";
    examples?: { prompt?: string; given?: string; expected?: string }[];
    items?: string[];
    subtopics?: string[];
    weight?: number;
  };
  const body = req.body as Target & { cefr?: string; targets?: Target[]; count?: number };
  const targets: Target[] = Array.isArray(body.targets) && body.targets.length ? body.targets : [body];
  if (!targets.every(x => x.concept && x.area)) return res.status(400).json({ error: "Missing 'concept' or 'area'." });

  const total = Math.min(10, Math.max(3, body.count ?? (targets.length > 1 ? 8 : 6)));
  // Question counts by weight: the weakest topic first and most.
  const weights = targets.map(x => Math.max(0.1, x.weight ?? 1));
  const sum = weights.reduce((s, w) => s + w, 0);
  const counts = weights.map(w => Math.max(1, Math.floor((w / sum) * total)));
  for (let i = 0; counts.reduce((s, c) => s + c, 0) < total; i = (i + 1) % counts.length) counts[i]++;

  try {
    const ai = getAIClient();
    const systemInstruction =
      "You write practice questions for Lexistencehub, an English learning app for Turkish students. " +
      "Every question must practise exactly its target learning concept - nothing else. Test the same underlying " +
      "concept as the student's previous mistakes with NEW sentences: never repeat a previous question. " +
      "Each question has exactly four options and exactly ONE correct answer that no careful teacher could dispute; " +
      "the wrong options must be realistic learner mistakes for that concept. Vary contexts. Questions and options " +
      "are in English. explanation: one short English sentence a learner at the given level understands. " +
      "concept: copy the target's concept name exactly.";
    const brief = {
      studentLevel: body.cefr || "B1",
      targets: targets.map((x, i) => ({
        concept: x.concept,
        area: x.area,
        questions: counts[i],
        difficulty: x.difficulty || "medium",
        subtopicsCausingErrors: (x.subtopics ?? []).slice(0, 3),
        previousMistakes: (x.examples ?? []).slice(0, 4),
        wordsToPractise: (x.items ?? []).slice(0, 8),
        guidance:
          x.area === "vocabulary"
            ? "Practise the listed words when given: meaning, the right word in context, or telling similar words apart."
            : "Practise the grammar concept in natural sentences with a gap or a choice of forms, focusing on the listed subtopics.",
      })),
    };
    const response = await generateResilient(ai, {
      contents: `Write ${total} practice questions for this brief, the given number per target:\n${JSON.stringify(brief)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correct: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["concept", "question", "options", "correct", "explanation"],
          },
        },
        temperature: 0.8,
      },
    });
    const names = new Set(targets.map(x => x.concept));
    const list = JSON.parse(response.text || "[]") as any[];
    const questions = list
      .filter(
        q =>
          q &&
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          new Set(q.options.map((o: string) => String(o).trim().toLowerCase())).size === 4 &&
          Number.isInteger(q.correct) &&
          q.correct >= 0 &&
          q.correct < 4
      )
      .map(q => ({ ...q, concept: names.has(q.concept) ? q.concept : targets[0].concept }))
      .slice(0, total);
    if (questions.length < 3) throw new Error("Too few valid questions");
    res.json({ questions });
  } catch (err: any) {
    console.error("Practice error:", err?.message || err);
    res.status(500).json({ error: "practice_failed", message: "Practice could not be prepared right now. Please try again." });
  }
});

/* Performance Analysis → AI Recommendation: two to four sentences written only
   from the analysed performance (strengths, development areas, subtopics,
   common errors, change) for the selected skill filter. */
app.post("/api/performance-recommendation", async (req, res) => {
  const { data } = req.body as { data?: unknown };
  if (!data || typeof data !== "object") return res.status(400).json({ error: "Missing 'data'." });
  try {
    const ai = getAIClient();
    const systemInstruction =
      "You are the performance analyst of Lexistencehub, an English learning app for Turkish students. Write a " +
      "recommendation of two to four short sentences, in English, second person, professional and supportive, based " +
      "ONLY on the data. Prioritise the one to three most important development areas by name and, when the data " +
      "shows one, the specific subtopic or common error behind it. Acknowledge one meaningful strength when the data " +
      "has one. Say what to practise next. Never invent strengths, weaknesses, topics, numbers or improvement that " +
      "are not in the data. No motivational filler ('keep going', 'you are doing great').";
    const response = await generateResilient(ai, {
      contents: `Performance data (JSON):\n${JSON.stringify(data).slice(0, 10000)}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { recommendation: { type: Type.STRING } },
          required: ["recommendation"],
        },
        temperature: 0.4,
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    if (!parsed.recommendation) throw new Error("Empty recommendation");
    res.json({ recommendation: String(parsed.recommendation).trim() });
  } catch (err: any) {
    console.error("Performance recommendation error:", err?.message || err);
    res.status(500).json({ error: "recommendation_failed", message: "The recommendation could not be prepared right now." });
  }
});

/* Writing: is the student's English answer a valid translation of the Turkish
   meaning, even if it is not the one word stored on the card? */
app.post("/api/check-translation", async (req, res) => {
  const { turkish, expected, given, partOfSpeech } = req.body as {
    turkish?: string;
    expected?: string;
    given?: string;
    partOfSpeech?: string;
  };
  if (!turkish || !given) return res.status(400).json({ error: "Missing 'turkish' or 'given'." });
  try {
    const ai = getAIClient();
    const systemInstruction =
      "You check answers in an English vocabulary writing exercise for Turkish students. The student sees a Turkish " +
      "word or phrase and types its English equivalent. Decide whether the student's answer is a correct English " +
      "translation of the Turkish meaning. Accept it when it is a real English word or phrase that correctly " +
      "expresses the Turkish meaning in any common sense of the Turkish word - synonyms and other valid senses count " +
      "(for 'acı' both 'bitter' and 'pain' are correct). Ignore capital letters. Reject it when the meaning is " +
      "different or only loosely related, when it is misspelled (this is also spelling practice), when it is not " +
      "English, or when it is a phrase that merely describes the meaning instead of translating it.";
    const response = await generateResilient(ai, {
      contents: JSON.stringify({
        turkish,
        partOfSpeechOnCard: partOfSpeech || "",
        storedAnswer: expected || "",
        studentAnswer: given,
      }),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { accepted: { type: Type.BOOLEAN } },
          required: ["accepted"],
        },
        temperature: 0,
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    if (typeof parsed.accepted !== "boolean") throw new Error("No verdict");
    res.json({ accepted: parsed.accepted });
  } catch (err: any) {
    console.error("Translation check error:", err?.message || err);
    res.status(500).json({ error: "check_failed", message: "The answer could not be checked right now." });
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
      "You are an English-learning content writer for Turkish students at CEFR A2 level. " +
      "Write ONLY at A2 level: short simple sentences, high-frequency everyday vocabulary, " +
      "basic tenses (present simple/continuous, past simple, 'going to'), no advanced grammar, " +
      "no rare words or idioms. Natural, real-life English — never stiff or AI-sounding. " +
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
      "start in the middle of the action", "start with a short line of dialogue spoken by a character",
      "start with a surprising fact about the main character", "start with a small problem that needs solving",
      "start with a sound, smell or movement the character notices", "start with a decision the character just made",
      "start with a question the character asks themselves", "start with an unexpected event",
      "start with a short description of the place", "start with the character's thought or feeling",
      "start with something that happened in the past that still matters now",
      "start with a curious piece of information", "start with an ordinary daily moment that suddenly changes",
    ];
    const STORY_VOICES = [
      "third person, past tense", "first person ('I'), past tense",
      "third person, present tense (as if it happens now)", "first person ('I'), present tense",
    ];
    const DIALOGUE_SCENES = [
      "two friends choosing what to eat for lunch", "a customer asking for help in a clothes shop",
      "two classmates talking about homework before class", "a father and son getting ready for school",
      "two neighbors talking about the weather and the garden", "a customer ordering at a cafe counter",
      "two friends deciding which film to watch", "a boy calling his friend to play football",
      "a student asking the teacher about tomorrow's test", "two cousins talking about a birthday present",
      "a passenger asking the bus driver about the route", "two friends talking about a new phone",
      "two roommates sharing the housework", "a tourist asking a local for directions",
      "a patient and a pharmacist at the pharmacy", "two friends planning a picnic",
      "a boy asking his grandfather about his childhood", "two colleagues talking about the weekend",
      "a customer returning a broken item to a shop", "two friends talking about a lost key",
      "two teammates talking before a match", "a hotel guest asking at the reception",
      "a student and a librarian looking for a book", "two friends comparing their favourite foods",
      "a man buying vegetables at the market", "two friends talking about learning English",
      "a boy and his uncle fixing a bicycle", "two friends talking about pets",
      "a customer asking about train times at the station", "two friends talking about a trip to the seaside",
    ];
    const DIALOGUE_MOODS = [
      "friendly and relaxed", "a little hurried", "curious and surprised", "slightly worried but hopeful",
      "funny and playful", "polite and practical", "excited", "tired but cheerful",
    ];
    // Structural skeletons: the whole flow of moves varies, not just the first line.
    const DIALOGUE_SHAPES = [
      "complaint -> playful reply -> suggestion -> agreement",
      "surprising news -> disbelief -> explanation -> excited reaction",
      "request -> hesitation -> persuasion -> acceptance",
      "misunderstanding -> confusion -> correction -> laughter",
      "decision announced -> objection -> short argument -> compromise",
      "problem discovered -> mild blame -> practical solution -> relief",
      "observation -> curiosity -> short story -> final comment",
      "urgent warning -> question -> explanation -> quick action",
      "offer -> polite refusal -> reason -> counter-offer -> deal",
      "shared memory -> question -> funny detail -> plan for later",
      "disagreement about a fact -> checking -> one admits being wrong",
      "asking for a favour -> conditions -> negotiation -> thanks",
    ];
    const DIALOGUE_OPENERS = [
      "the first line jumps straight into the middle of the situation",
      "the first line is a direct question about the situation",
      "the first line states a small problem",
      "the first line shows surprise about something just noticed",
      "the first line is a polite request",
      "the first line announces a decision",
      "the first line makes a suggestion",
      "the first line is a misunderstanding that gets cleared up later",
      "the first line is an observation about something nearby",
      "the first line reacts to something unexpected that just happened",
    ];

    const STYLE_RULES =
      `Style rules: never open with a time expression ("Last week", "Yesterday", "One day", "This morning"...); ` +
      `weave any time references naturally into the middle of sentences. Vary sentence structures. ` +
      `Use everyday vocabulary and realistic details. Avoid clichés and repeated formulas. ` +
      `No ornate or artificial phrasing — it must read like something a real person would write or say. ` +
      `LEVEL: strictly CEFR A2 — short simple sentences (max about 12 words), common daily words, basic tenses only; ` +
      `a Turkish 13-14-year-old learner must understand it easily. ` +
      `Do not reuse the same lines, jokes, names or situations you would typically produce; make this piece clearly different from a generic one.`;

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
    } else if (/^be\s/i.test(word)) {
      // "be fed up with", "be involved in"... — "be" must be conjugated, never pasted bare.
      const rest = word.replace(/^be\s+/i, "");
      usageRule =
        `The target is the phrase "${word}"` +
        (meaning ? ` (Turkish meaning: ${meaning})` : "") +
        `. Use it at least 3 times, but NEVER paste the dictionary form into a sentence as-is: ` +
        `conjugate "be" correctly for each subject and tense (am/is/are/was/were, or contractions like I'm/she's/they're; ` +
        `keep bare "be" only after a modal such as must/can/will/should or after "to"), ` +
        `and keep the rest "${rest}" exactly as written. ` +
        `Examples: "I am ${rest}", "she was ${rest}", "you must be ${rest}". ` +
        `A sentence like "I be ${rest}" is a hard error — every sentence must be correct, natural English.`;
    } else if (word.includes(" ")) {
      // Multi-word phrasal verbs: the verb inflects naturally, particles stay unchanged.
      const [head, ...tail] = word.split(/\s+/);
      usageRule =
        `The target is the phrasal verb "${word}"` +
        (meaning ? ` (Turkish meaning: ${meaning})` : "") +
        `. Use it at least 3 times, conjugating the verb "${head}" naturally for subject and tense ` +
        `(e.g. "${head}s ${tail.join(" ")}", "${head}ed ${tail.join(" ")}" if regular, or its correct irregular form) ` +
        `while keeping "${tail.join(" ")}" exactly as written and never changing the word order. ` +
        `Do not force the bare dictionary form into a sentence where grammar requires a conjugated form; ` +
        `every sentence must be correct, natural English.`;
    } else {
      usageRule =
        `The content must naturally use the target word/phrase "${word}"` +
        (meaning ? ` (Turkish meaning: ${meaning})` : "") +
        ` at least 3 times, in its exact base form "${word}" each time so it can be highlighted.`;
    }

    // Anti-repetition: show the model the openings it produced recently and
    // force the new piece to differ from them in structure, not just wording.
    const avoidList = recentOpenings[kind];
    const avoidRule = avoidList.length
      ? ` CRITICAL — these are the openings of recently generated ${kind === "story" ? "stories" : "dialogues"}: ` +
        avoidList.map((o) => `"${o}"`).join(" | ") +
        `. Your opening must be clearly different from ALL of them in structure, first words and situation — ` +
        `rewording the same pattern does not count as different.`
      : "";

    const firstSpeaker = Math.random() < 0.5 ? "A" : "B";
    const lineCount = pick(["6-8", "8-10", "10-12"]);

    const prompt =
      kind === "story"
        ? `Write an engaging short story in simple A2-level English (100-140 words, 2-3 short paragraphs separated by \\n\\n) ` +
          `for a vocabulary learner. Setting: ${pick(STORY_SETTINGS)}. Opening technique: ${pick(STORY_STYLES)}. ` +
          `Narration: ${pick(STORY_VOICES)} (keep the grammar strictly A2 either way). ` +
          `Banned openings: never start with "One day", "It was a sunny morning", "Last weekend", "[Name] woke up" ` +
          `or any similar templated first sentence. This is a narrative, not a conversation — build atmosphere, ` +
          `a small plot and a character, and do not open it like a dialogue would. ` +
          `${usageRule} ` +
          `${STYLE_RULES}${avoidRule} Give the story a short catchy title (3-6 words). Do not translate the story.`
        : `Write a natural everyday two-person dialogue in simple A2-level English (${lineCount} short lines, alternating ` +
          `speakers A and B, and the FIRST line is spoken by ${firstSpeaker}). Scene: ${pick(DIALOGUE_SCENES)}. ` +
          `Mood: ${pick(DIALOGUE_MOODS)}. Opening: ${pick(DIALOGUE_OPENERS)}. ` +
          `Conversation shape to follow loosely (these moves, in this order): ${pick(DIALOGUE_SHAPES)}. ` +
          `It must sound like a real daily conversation between ordinary people, with concrete details of that scene. ` +
          `ABSOLUTE BANS: never open with greetings or small talk ("Hi", "Hello", "Hey", "Good morning", "How are you?", ` +
          `"Excuse me"); never use the pattern question -> answer -> "thanks"; never have one speaker only ask and the ` +
          `other only answer — both must push the conversation with reactions, objections, jokes or new information. ` +
          `Vary the rhythm: some replies are a few words, one can be two sentences. ${usageRule} ` +
          `${STYLE_RULES}${avoidRule} Give it a short title (2-5 words) describing the situation. Do not translate.`;

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
    // High temperature: variety between generations matters more than precision here.
    const response = await generateResilient(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 1.2,
      },
    }, ["gemini-3.5-flash-lite", "gemini-3.5-flash"]);

    const text = response.text;
    if (!text) throw new Error("Empty response received from the Gemini model.");

    const parsed = JSON.parse(text.trim());
    if (kind === "story" && typeof parsed.story === "string") {
      rememberOpening("story", parsed.story.split(/[.!?\n]/)[0] || "");
    } else if (kind === "dialogue" && Array.isArray(parsed.lines) && parsed.lines[0]?.text) {
      rememberOpening("dialogue", String(parsed.lines[0].text));
    }
    res.json(parsed);
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

  // No host argument: Node binds dual-stack (IPv6 + IPv4), so browsers that
  // resolve localhost to ::1 can connect too.
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
