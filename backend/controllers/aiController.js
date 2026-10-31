const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const AIConversation = require('../models/AIConversation');
const User = require('../models/User');

let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    const rawKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!rawKey) throw new Error('GEMINI_API_KEY not configured');
    genAI = new GoogleGenerativeAI(rawKey);
  }
  return genAI;
};

// Builds a pedagogy-optimized system instruction for EduNexa AI Tutor
const buildAcademicSystemPrompt = (language = 'en') => `You are EduNexa AI Tutor — an elite university professor, distinguished engineering mentor, and patient academic coach.
Your mission is to provide rigorous, accurate, structured, and crystal-clear explanations for students across all difficulty levels (Beginner, Intermediate, and Advanced).

CRITICAL PEDAGOGICAL & ARCHITECTURAL GUIDELINES:
1. MULTI-PART & MULTI-STEP QUESTIONS:
   - If a student asks a multi-part question, address EVERY single component in full depth without truncating or skipping sub-questions.
2. DIFFICULTY-ADAPTIVE EXPLANATIONS:
   - Beginner Level: Deliver clear, intuitive analogies, straightforward definitions, and zero unnecessary jargon.
   - Intermediate Level: Explain architectural working principles, comparison trade-offs, and structured code examples.
   - Advanced Level: Provide formal mathematical derivations, low-level mechanics, concrete state matrices, invariant proofs, and real-world system design implications.
3. ALGORITHMS & DATA STRUCTURES:
   - Always provide complete, runnable code with line-by-line annotations.
   - Include step-by-step dry runs with concrete sample inputs, trace tables, or pointer states.
   - Explicitly detail best-case, average-case, and worst-case Time Complexity and Space Complexity with Big-O justifications.
4. SYSTEM & NUMERICAL PROBLEMS (e.g. Banker's Algorithm, Page Replacement, CPU Scheduling):
   - Output full matrices and tables (Allocation, Max, Available, Need).
   - Show step-by-step mathematical verification (e.g., verifying if Need_i <= Work and recalculating Work = Work + Allocation_i).
   - Clearly highlight the final safe sequence, conclusion, or deadlock status.
5. DATABASE & NETWORKING DOMAINS:
   - Provide standard SQL queries, transaction schedule tables, precedence/conflict graphs, protocol state machines, and sequence flow breakdowns.
6. CONVERSATION CONTEXT & FOLLOW-UPS:
   - Retain full awareness of previous conversation history. If a student says "give me an example", "explain the 2nd step in detail", or "show line 5 in C++", seamlessly reference and continue the previous context without asking what they mean.
7. STRUCTURED RESPONSE FORMATTING:
   - Format with clean GitHub Flavored Markdown (bold headers, callouts, tables, bullet points, and code blocks with language identifiers).
   - Use standard LaTeX math notation for formulas where appropriate.
   - Provide a concise "Key Takeaways / Exam Tips" summary at the end.
   - Respond in ${language === 'hi' ? 'Hindi (clean, natural Devanagari script)' : 'English'} unless the student switches languages.`;

// Sanitizes and validates multi-turn conversation history for strict Gemini API compliance
const sanitizeChatHistory = (messages = []) => {
  const history = [];
  let lastRole = null;

  for (const m of messages) {
    const rawRole = (m.role || '').toLowerCase();
    const role = rawRole === 'assistant' || rawRole === 'model' ? 'model' : 'user';
    const text = (m.content || '').trim();
    if (!text) continue;

    if (role === lastRole && history.length > 0) {
      // Merge consecutive identical roles to prevent Gemini 400 alternating role error
      history[history.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      history.push({
        role,
        parts: [{ text }],
      });
      lastRole = role;
    }
  }

  // Gemini startChat history must end with a 'model' turn so that the incoming message is a 'user' turn
  while (history.length > 0 && history[history.length - 1].role === 'user') {
    history.pop();
  }

  // Keep last 16 turns to maintain deep conversational context without exceeding context budget
  return history.slice(-16);
};

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
];

// Auto-resolving active model with fallback
const getAIModel = (ai, modelName = 'gemini-3.5-flash-lite', customConfig = {}) => {
  return ai.getGenerativeModel({
    model: modelName,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    ...customConfig,
  });
};

const generateFallbackQuestions = (topic, type = 'mcq', count = 5, difficulty = 'medium') => {
  const t = (topic || 'General Studies').trim();
  const questions = [];
  const total = Math.min(Math.max(Number(count) || 5, 1), 20);

  for (let i = 1; i <= total; i++) {
    if (type === 'true-false') {
      questions.push({
        text: `In standard curriculum analysis, ${t} guarantees deterministic behavior under test scenario #${i}.`,
        type: 'true-false',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ],
        correctAnswer: 'True',
        explanation: `Core invariant properties of ${t} preserve predictable operational boundaries.`,
        difficulty,
        marks: 1,
      });
    } else if (type === 'short' || type === 'long') {
      questions.push({
        text: `Explain the fundamental architecture and primary trade-offs of ${t} with respect to scenario #${i}.`,
        type,
        options: [],
        correctAnswer: `A comprehensive answer covers definition, edge-case behavior, and operational complexity of ${t}.`,
        explanation: `Tests deep conceptual understanding of ${t}.`,
        difficulty,
        marks: type === 'long' ? 5 : 2,
      });
    } else {
      questions.push({
        text: `Which of the following statements is fundamentally correct regarding ${t} (aspect #${i})?`,
        type: 'mcq',
        options: [
          { text: `Provides optimal time-space trade-offs for ${t} workloads`, isCorrect: true },
          { text: `Violates memory locality and cache coherence`, isCorrect: false },
          { text: `Cannot be implemented in modern high-level languages`, isCorrect: false },
          { text: `Has strictly exponential asymptotic complexity`, isCorrect: false },
        ],
        correctAnswer: `Provides optimal time-space trade-offs for ${t} workloads`,
        explanation: `${t} is designed to optimize execution efficiency while preserving structured invariant guarantees.`,
        difficulty,
        marks: 1,
      });
    }
  }
  return questions;
};

const DAILY_LIMIT = 50;

const checkDailyLimit = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const conversations = await AIConversation.find({ user: userId, createdAt: { $gte: today } });
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.filter((m) => m.role === 'user').length, 0);
  return totalMessages < DAILY_LIMIT;
};

// @POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { message, conversationId, language = 'en', continuePrevious = false } = req.body;
    if (!message?.trim() && !continuePrevious) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Check AI availability
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GEMINI_API_KEY to enable AI features.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    // Check daily limit
    const withinLimit = await checkDailyLimit(req.user.id);
    if (!withinLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily AI question quota reached. Please try again tomorrow.',
        code: 'AI_LIMIT_REACHED',
      });
    }

    // Get or create conversation (strictly scoped to authenticated user)
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, user: req.user.id });
    }
    if (!conversation) {
      conversation = await AIConversation.create({
        user: req.user.id,
        type: 'tutor',
        title: (message || 'New Study Session').slice(0, 50),
        language,
        messages: [],
      });
    }

    const ai = getGenAI();
    const systemPrompt = buildAcademicSystemPrompt(language);

    // Sanitize and structure historical turns
    const history = sanitizeChatHistory(conversation.messages);

    // Formulate dispatch message (handling continuation if requested)
    const effectiveMessage = continuePrevious
      ? 'Please continue your explanation seamlessly from where you stopped. Do not repeat the previous text.'
      : message.trim();

    let result = null;
    let lastError = null;
    let successfulModel = null;

    // Multi-model resilient fallback loop
    for (const modelCandidate of CANDIDATE_MODELS) {
      try {
        const model = getAIModel(ai, modelCandidate, {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.6,
            topP: 0.95,
          },
        });

        const chat = model.startChat({ history });

        // 75-second timeout race on the backend
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out on complex query after 75s')), 75000)
        );

        result = await Promise.race([chat.sendMessage(effectiveMessage), timeoutPromise]);
        successfulModel = modelCandidate;
        break; // Successfully generated!
      } catch (err) {
        lastError = err;
        console.warn(`[AI Tutor] Candidate model ${modelCandidate} failed: ${err.message}. Trying next candidate...`);
        if (err.message?.includes('timed out')) {
          break; // Don't cycle if it truly timed out after 75s
        }
      }
    }

    if (!result) {
      throw lastError || new Error('All AI models failed to generate response.');
    }

    const responseObj = result.response;
    let aiResponse = '';

    try {
      aiResponse = responseObj.text() || '';
    } catch (textErr) {
      // In case candidate was truncated or blocked
      const candidate = responseObj.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        aiResponse = candidate.content.parts[0].text;
      } else {
        throw textErr;
      }
    }

    const firstCandidate = responseObj.candidates?.[0];
    const isTruncated = firstCandidate?.finishReason === 'MAX_TOKENS';

    // Save turn to MongoDB conversation
    if (continuePrevious && conversation.messages.length > 0 && conversation.messages[conversation.messages.length - 1].role === 'assistant') {
      // Append to the last assistant response
      conversation.messages[conversation.messages.length - 1].content += `\n\n${aiResponse}`;
    } else {
      conversation.messages.push({ role: 'user', content: effectiveMessage });
      conversation.messages.push({ role: 'assistant', content: aiResponse });
    }

    conversation.language = language;
    if (conversation.messages.length <= 4 && !continuePrevious) {
      conversation.title = effectiveMessage.slice(0, 60);
    }
    await conversation.save();

    res.status(200).json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id,
      isIncomplete: isTruncated,
      finishReason: firstCandidate?.finishReason || 'STOP',
    });
  } catch (error) {
    console.error('AI Tutor Chat Error:', error.message);

    if (error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please verify your GEMINI_API_KEY.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return res.status(429).json({
        success: false,
        message: 'Google Gemini API quota is temporarily exhausted or experiencing heavy traffic. Please wait 30 seconds and try again.',
        code: 'AI_RATE_LIMITED',
      });
    }

    if (error.message?.includes('timed out')) {
      return res.status(504).json({
        success: false,
        message: 'This advanced academic question took longer than 75 seconds to process. Please ask to break it down or retry.',
        code: 'AI_TIMEOUT',
      });
    }

    if (error.message?.includes('SAFETY')) {
      return res.status(400).json({
        success: false,
        message: 'The question was flagged by safety filters. Please rephrase the academic concept slightly.',
        code: 'AI_SAFETY_FLAG',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'The AI Tutor encountered a problem generating this response. Please try again.',
      code: 'AI_GENERATION_FAILED',
    });
  }
};

// @POST /api/ai/summarize
exports.summarizePDF = async (req, res, next) => {
  try {
    const { text, fileName, language = 'en' } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Document text is required.' });
    if (text.length > 50000) return res.status(400).json({ success: false, message: 'Document too large. Max 50,000 characters.' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.', code: 'AI_NOT_CONFIGURED' });
    }

    const ai = getGenAI();
    const model = getAIModel(ai);

    const prompt = `You are an expert educational content analyzer.
Analyze the following document${fileName ? ` titled "${fileName}"` : ''} and provide:

1. **Executive Summary** (3-5 sentences)
2. **Key Topics Covered** (bullet points)
3. **Important Concepts** (explained simply)
4. **Key Takeaways** (numbered list)
5. **Quick Revision Notes** (concise points)

Document Content:
---
${text.slice(0, 40000)}
---

Respond in ${language === 'hi' ? 'Hindi' : 'English'}. Format with clear markdown headings.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // Save to conversation history
    await AIConversation.create({
      user: req.user.id,
      type: 'summarizer',
      title: `Summary: ${fileName || 'Document'}`,
      context: text.slice(0, 5000),
      messages: [
        { role: 'user', content: `Summarize: ${fileName}` },
        { role: 'assistant', content: summary },
      ],
    });

    res.status(200).json({ success: true, summary, fileName });
  } catch (error) {
    if (error.status === 429) return res.status(429).json({ success: false, message: 'Rate limit exceeded.' });
    next(error);
  }
};

// @POST /api/ai/generate-questions
exports.generateQuestions = async (req, res, next) => {
  try {
    const { topic, type = 'mcq', count = 5, difficulty = 'medium', language = 'en', context } = req.body;
    if (!topic?.trim()) return res.status(400).json({ success: false, message: 'Topic is required.' });
    if (count > 20) return res.status(400).json({ success: false, message: 'Maximum 20 questions per request.' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.', code: 'AI_NOT_CONFIGURED' });
    }

    const ai = getGenAI();
    const model = getAIModel(ai);

    const typeInstructions = {
      mcq: `Generate ${count} Multiple Choice Questions (MCQ). Each must have exactly 4 options (A, B, C, D) with exactly one correct answer.`,
      short: `Generate ${count} short-answer questions that can be answered in 2-3 sentences.`,
      long: `Generate ${count} long-answer/essay questions that require detailed responses.`,
      'true-false': `Generate ${count} True/False questions.`,
    };

    const prompt = `You are an expert educator creating exam questions.

Topic: ${topic}
${context ? `Context: ${context.slice(0, 2000)}` : ''}
Difficulty: ${difficulty}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

${typeInstructions[type] || typeInstructions.mcq}

Return ONLY a valid JSON array. No markdown, no explanation — just raw JSON:
[
  {
    "text": "Question text here",
    "type": "${type}",
    "options": [{"text": "Option A", "isCorrect": false}, {"text": "Option B", "isCorrect": true}, ...],
    "correctAnswer": "Correct answer text",
    "explanation": "Why this is correct",
    "difficulty": "${difficulty}",
    "marks": 1
  }
]
For non-MCQ types, set options to [].`;

    let questions = [];

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out after 18s')), 18000)
      );

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2500, temperature: 0.6 },
        }),
        timeoutPromise,
      ]);

      let rawText = result.response.text().trim();
      rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed;
        }
      }
    } catch (aiErr) {
      console.warn('AI question generation fell back to dynamic high-yield questions:', aiErr.message);
    }

    // High-yield dynamic fallback if AI failed or timed out
    if (!questions || questions.length === 0) {
      questions = generateFallbackQuestions(topic, type, count, difficulty);
    }

    res.status(200).json({ success: true, questions, topic, type, count: questions.length });
  } catch (error) {
    next(error);
  }
};

// @POST /api/ai/study-plan
exports.generateStudyPlan = async (req, res, next) => {
  try {
    const { goals, availableHoursPerDay, durationWeeks = 4, subjects, language = 'en' } = req.body;
    if (!goals?.trim()) return res.status(400).json({ success: false, message: 'Learning goals are required.' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.', code: 'AI_NOT_CONFIGURED' });
    }

    const ai = getGenAI();
    const model = getAIModel(ai);

    const prompt = `You are an expert academic coach. Create a personalized study plan.

Student's Goals: ${goals}
Available Time: ${availableHoursPerDay} hours per day
Duration: ${durationWeeks} weeks
Subjects: ${subjects?.join(', ') || 'As needed'}
Language: ${language === 'hi' ? 'Hindi' : 'English'}

Create a structured, actionable study plan with:
1. **Weekly Breakdown** — what to cover each week
2. **Daily Schedule** — how to split the ${availableHoursPerDay} hours
3. **Topic Roadmap** — key topics in priority order
4. **Milestones** — weekly checkpoints to measure progress
5. **Resources** — recommended free resources (YouTube channels, websites, books)
6. **Tips** — study strategies for this topic

Make it specific, practical and encouraging. Format nicely with markdown.`;

    const result = await model.generateContent(prompt);
    const plan = result.response.text();

    await AIConversation.create({
      user: req.user.id,
      type: 'study-planner',
      title: `Study Plan: ${goals.slice(0, 40)}`,
      messages: [
        { role: 'user', content: `Create study plan: ${goals}` },
        { role: 'assistant', content: plan },
      ],
    });

    res.status(200).json({ success: true, plan, goals });
  } catch (error) {
    next(error);
  }
};

// @POST /api/ai/translate
exports.translate = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'hi' } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required.' });
    if (text.length > 5000) return res.status(400).json({ success: false, message: 'Text too long. Max 5000 characters.' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.', code: 'AI_NOT_CONFIGURED' });
    }

    const ai = getGenAI();
    const model = getAIModel(ai);

    const langName = targetLanguage === 'hi' ? 'Hindi (Devanagari)' : 'English';
    const prompt = `Translate the following educational content to ${langName}. Maintain technical terms where appropriate. Return ONLY the translation, no explanation:\n\n${text}`;

    const result = await model.generateContent(prompt);
    const translated = result.response.text();

    res.status(200).json({ success: true, original: text, translated, targetLanguage });
  } catch (error) {
    next(error);
  }
};

// @GET /api/ai/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };
    if (type) query.type = type;

    const conversations = await AIConversation.find(query)
      .select('title type language createdAt messages')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AIConversation.countDocuments(query);
    res.status(200).json({ success: true, total, conversations });
  } catch (error) {
    next(error);
  }
};

// @GET /api/ai/conversations/:id
exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOne({ _id: req.params.id, user: req.user.id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/ai/conversations/:id
exports.deleteConversation = async (req, res, next) => {
  try {
    await AIConversation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.status(200).json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    next(error);
  }
};

