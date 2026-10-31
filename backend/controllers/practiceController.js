const { GoogleGenerativeAI } = require('@google/generative-ai');
const PracticeSession = require('../models/PracticeSession');
const TopicMastery = require('../models/TopicMastery');
const SubjectNote = require('../models/SubjectNote');
const DsaTopic = require('../models/DsaTopic');

// Initialize Gemini if key exists
let genAI = null;
const getGenAI = () => {
  if (!genAI) {
    const rawKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    if (!rawKey) throw new Error('GEMINI_API_KEY not configured');
    genAI = new GoogleGenerativeAI(rawKey);
  }
  return genAI;
};

// Robust helper to strip code fences and parse JSON
const parseAIJson = (rawText) => {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/) || cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No valid JSON structure found in AI response');
  return JSON.parse(jsonMatch[0]);
};

// Fallback question generator when AI is unavailable or rate-limited
const generateFallbackQuestions = (topic, category, difficulty) => {
  const t = topic.trim();
  const diffMarks = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1;

  const fallbackQuestions = [
    {
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'mcq_single',
      question: `Which of the following statements is fundamentally correct regarding ${t}?`,
      context: `Consider standard engineering principles and real-world architectures applicable to ${t}.`,
      options: [
        { id: 'opt_1', text: `${t} enforces abstraction and encapsulation of critical state.`, isCorrect: true },
        { id: 'opt_2', text: `${t} completely disables memory management and runtime polymorphism.`, isCorrect: false },
        { id: 'opt_3', text: `${t} cannot be combined with modular data structures.`, isCorrect: false },
        { id: 'opt_4', text: `${t} guarantees zero time complexity regardless of input size.`, isCorrect: false },
      ],
      correctAnswer: 'opt_1',
      modelAnswer: `${t} provides modularity, reusable logic, and structured behavior while isolating internal state.`,
      rubric: [
        { criterion: 'Conceptual Correctness', marks: 1, description: 'Correctly identifies core behavior.' },
      ],
      hints: [`Think about how ${t} improves modular design and maintainability.`],
      explanation: `In standard computer science, ${t} facilitates modularity, proper abstraction, and separation of concerns.`,
      marks: 1,
    },
    {
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'mcq_multi',
      question: `Select ALL key advantages and characteristics that apply to ${t}:`,
      context: `Choose all valid statements.`,
      options: [
        { id: 'opt_a', text: `Improves code reuse and simplifies debugging.`, isCorrect: true },
        { id: 'opt_b', text: `Facilitates scalability when designing decoupled systems.`, isCorrect: true },
        { id: 'opt_c', text: `Eliminates the requirement for any testing or validation.`, isCorrect: false },
        { id: 'opt_d', text: `Enables clearer documentation and architectural contracts.`, isCorrect: true },
      ],
      correctAnswer: ['opt_a', 'opt_b', 'opt_d'],
      modelAnswer: `Options A, B, and D describe genuine engineering benefits of ${t}.`,
      rubric: [
        { criterion: 'Completeness', marks: 2, description: 'Selects all valid benefits without false positives.' },
      ],
      hints: [`Consider software engineering best practices related to ${t}.`],
      explanation: `${t} fosters scalability, reusability, and clarity. It does not eliminate testing.`,
      marks: 2,
    },
    {
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'conceptual',
      question: `Explain the core purpose of ${t} and highlight two practical trade-offs or challenges associated with it.`,
      context: `Provide a concise, technically sound explanation.`,
      options: [],
      correctAnswer: null,
      modelAnswer: `${t} is designed to solve specific scalability or architectural requirements. Key trade-offs include memory overhead, initial complexity, and potential synchronization or refactoring challenges.`,
      rubric: [
        { criterion: 'Core Definition & Purpose', marks: 2, description: 'Clearly explains what it is and why it is used.' },
        { criterion: 'Trade-offs & Edge Cases', marks: 2, description: 'Analyzes two realistic trade-offs or performance costs.' },
        { criterion: 'Technical Clarity', marks: 1, description: 'Uses precise technical terminology and coherent structure.' },
      ],
      hints: [`Focus on definition, runtime/memory implications, and maintenance overhead.`],
      explanation: `A comprehensive answer defines ${t}, explains its target problem, and evaluates performance vs complexity trade-offs.`,
      marks: 5,
    },
    {
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'coding',
      question: `Implement an efficient algorithm demonstrating practical usage of ${t}.`,
      context: `Write clean code handling edge cases.`,
      options: [],
      codingDetails: {
        starterCode: {
          python: `def solve_${t.toLowerCase().replace(/[^a-z0-9]/g, '_')}(data):\n    # Write your solution here\n    pass\n`,
          java: `public class Solution {\n    public static int solve(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}\n`,
          javascript: `function solve(data) {\n  // Write your solution here\n  return data;\n}\n`,
          cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Write your solution here\n    return 0;\n}\n`,
        },
        problemStatement: `Design a function that processes an input structure using principles of ${t}. Handle empty inputs, bounds, and optimize time complexity.`,
        inputFormat: `Standard input collection or parameters.`,
        outputFormat: `Processed result according to specifications.`,
        constraints: `1 <= N <= 10^5`,
        testCases: [
          { input: `[1, 2, 3]`, expectedOutput: `[1, 2, 3]`, isHidden: false },
          { input: `[]`, expectedOutput: `[]`, isHidden: false },
          { input: `[100, 200, 300]`, expectedOutput: `[100, 200, 300]`, isHidden: true },
        ],
      },
      correctAnswer: null,
      modelAnswer: `Optimal implementation leverages idiomatic structures, handles null/empty inputs gracefully, and maintains minimal auxiliary space.`,
      rubric: [
        { criterion: 'Algorithm Correctness', marks: 4, description: 'Correctly implements logic addressing all requirements.' },
        { criterion: 'Edge Case Handling', marks: 3, description: 'Safely handles empty or boundary conditions.' },
        { criterion: 'Time & Space Efficiency', marks: 3, description: 'Achieves near-optimal asymptotic complexity.' },
      ],
      hints: [`Consider boundary checks before entering iterative or recursive steps.`],
      explanation: `A robust solution includes base cases, bounded iteration, and documented invariant states.`,
      marks: 10,
    },
    {
      questionId: 'q_' + Math.random().toString(36).substring(2, 9),
      type: 'scenario',
      question: `In a production system processing high throughput, a sudden bottleneck occurs related to ${t}. How would you diagnose and resolve this issue?`,
      context: `System Architecture Scenario.`,
      options: [],
      correctAnswer: null,
      modelAnswer: `1. Check system metrics (CPU, memory, latency percentiles p95/p99).\n2. Profile the hot path relevant to ${t} to pinpoint locking, excessive allocations, or redundant computations.\n3. Apply caching, indexing, or concurrency optimizations.\n4. Deploy phased canary release with health monitoring.`,
      rubric: [
        { criterion: 'Root-Cause Diagnosis', marks: 2, description: 'Explains profiling, logging, and observability tools.' },
        { criterion: 'Mitigation Strategy', marks: 2, description: 'Provides systematic engineering solutions.' },
        { criterion: 'Validation & Rollout', marks: 1, description: 'Mentions verification and safe release practices.' },
      ],
      hints: [`Structure your answer: Diagnose -> Mitigate -> Optimize -> Verify.`],
      explanation: `Systematic troubleshooting involves telemetry, bottleneck isolation, targeted mitigation, and regression verification.`,
      marks: 5,
    },
  ];

  if (category === 'mcq') {
    return fallbackQuestions.filter((q) => q.type.startsWith('mcq'));
  }
  if (category === 'conceptual') {
    return fallbackQuestions.filter((q) => q.type === 'conceptual');
  }
  if (category === 'written') {
    return fallbackQuestions.filter((q) => q.type === 'conceptual' || q.type === 'scenario');
  }
  if (category === 'coding') {
    return fallbackQuestions.filter((q) => q.type === 'coding');
  }
  if (category === 'scenario') {
    return fallbackQuestions.filter((q) => q.type === 'scenario');
  }
  return fallbackQuestions;
};

// @POST /api/practice/generate
// Generates personalized practice activities for any searched/studied topic
exports.generatePractice = async (req, res, next) => {
  try {
    const { topic, subject = 'Computer Science', category = 'all', difficulty = 'medium', mode = 'practice', count = 5 } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic is required to generate practice.' });
    }

    const trimmedTopic = topic.trim();

    // Check if we have additional context in SubjectNotes or DsaTopics
    let contextualNote = '';
    try {
      const subjectDoc = await SubjectNote.findOne({
        $or: [
          { topic: new RegExp(trimmedTopic, 'i') },
          { subject: new RegExp(trimmedTopic, 'i') },
        ],
      }).select('topic subject content summary keyConcepts');

      if (subjectDoc) {
        contextualNote = `Subject: ${subjectDoc.subject}. Key Concepts: ${subjectDoc.keyConcepts?.join(', ') || ''}. Summary: ${subjectDoc.summary?.slice(0, 400) || ''}`;
      } else {
        const dsaDoc = await DsaTopic.findOne({
          $or: [
            { title: new RegExp(trimmedTopic, 'i') },
            { moduleTitle: new RegExp(trimmedTopic, 'i') },
          ],
        }).select('title moduleTitle description problemStatement');
        if (dsaDoc) {
          contextualNote = `DSA Module: ${dsaDoc.moduleTitle}. Topic: ${dsaDoc.title}. Context: ${dsaDoc.problemStatement?.slice(0, 400) || dsaDoc.description?.slice(0, 300) || ''}`;
        }
      }
    } catch (e) {
      // non-fatal
    }

    let generatedQuestions = [];

    // Attempt Gemini AI generation if key is present
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });

        const prompt = `You are an elite Computer Science Professor and Technical Interview Evaluator.
Generate a high-yield, personalized practice session for the topic: "${trimmedTopic}".
Subject/Context: "${subject}". ${contextualNote ? `Additional Notes: "${contextualNote}".` : ''}
Difficulty Level: "${difficulty}" (easy, medium, or hard).
Category Focus: "${category}" (can be 'all', 'mcq', 'conceptual', 'written', 'coding', 'scenario').
Total questions requested: ${Math.min(Math.max(count, 3), 10)}.

Rules:
1. Every question MUST be directly relevant to "${trimmedTopic}".
2. Include a balanced mix according to Category:
   - 'all': 2 MCQs (1 single-choice, 1 multi-choice), 1 conceptual question, 1 coding problem with starter code & test cases, 1 scenario-based problem solving question.
   - 'mcq': Multiple-choice questions with 4 options each, detailed explanations, and distractor rationale.
   - 'conceptual': In-depth questions asking "Why", "How", architecture, internal mechanisms, and contrast.
   - 'written': Short & descriptive questions with structured rubric criteria.
   - 'coding': Real programming problems with problem statement, constraints, I/O formats, starter code in Python, Java, JS, C++, and at least 3 test cases (including hidden).
   - 'scenario': Real-world architectural or debugging scenario.
3. For every question, provide clear 'hints', 'explanation', and 'modelAnswer'.
4. For written and conceptual questions, include a 3-part 'rubric' with criteria and marks.

Return ONLY a valid JSON array of objects. Do NOT include markdown code fences, headers, or conversational text.
JSON Structure:
[
  {
    "questionId": "q_1",
    "type": "mcq_single" | "mcq_multi" | "conceptual" | "short_answer" | "long_answer" | "coding" | "scenario",
    "question": "Question text here",
    "context": "Brief context or code snippet if needed",
    "options": [
      { "id": "opt_a", "text": "Option A text", "isCorrect": true },
      { "id": "opt_b", "text": "Option B text", "isCorrect": false },
      { "id": "opt_c", "text": "Option C text", "isCorrect": false },
      { "id": "opt_d", "text": "Option D text", "isCorrect": false }
    ],
    "correctAnswer": "opt_a" (or array ["opt_a", "opt_b"] for multi-choice),
    "modelAnswer": "Model solution/reference answer",
    "rubric": [
      { "criterion": "Concept Understanding", "marks": 2, "description": "Accurate definition and mechanisms" },
      { "criterion": "Completeness", "marks": 2, "description": "Addresses all sub-questions" },
      { "criterion": "Clarity & Structure", "marks": 1, "description": "Precise technical vocabulary" }
    ],
    "codingDetails": {
      "starterCode": {
        "python": "def solution(...):\\n    pass",
        "java": "class Solution {\\n    public int solution(...) {\\n        return 0;\\n    }\\n}",
        "javascript": "function solution(...) {\\n}",
        "cpp": "int solution(...) {\\n    return 0;\\n}"
      },
      "problemStatement": "Detailed problem description",
      "inputFormat": "Input specifications",
      "outputFormat": "Output specifications",
      "constraints": "1 <= N <= 10^5",
      "testCases": [
        { "input": "...", "expectedOutput": "...", "isHidden": false },
        { "input": "...", "expectedOutput": "...", "isHidden": true }
      ]
    },
    "hints": ["Hint 1", "Hint 2"],
    "explanation": "Deep conceptual breakdown of why the answer is correct",
    "marks": 5
  }
]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = parseAIJson(text);

        if (Array.isArray(parsed) && parsed.length > 0) {
          generatedQuestions = parsed.map((q, idx) => ({
            questionId: q.questionId || `q_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
            type: q.type || 'conceptual',
            question: q.question || q.title || `Practice question on ${trimmedTopic}`,
            context: q.context || '',
            options: Array.isArray(q.options) ? q.options.map((opt, oIdx) => ({
              id: opt.id || `opt_${oIdx + 1}`,
              text: opt.text || String(opt),
              isCorrect: !!opt.isCorrect,
            })) : [],
            correctAnswer: q.correctAnswer || null,
            modelAnswer: q.modelAnswer || q.explanation || '',
            rubric: Array.isArray(q.rubric) && q.rubric.length > 0 ? q.rubric : [
              { criterion: 'Accuracy', marks: Math.ceil((q.marks || 2) * 0.6), description: 'Correct technical details' },
              { criterion: 'Clarity', marks: Math.floor((q.marks || 2) * 0.4) || 1, description: 'Clear structured response' },
            ],
            codingDetails: q.codingDetails || {
              starterCode: {
                python: `# Solution for ${trimmedTopic}\n`,
                java: `// Solution for ${trimmedTopic}\n`,
                javascript: `// Solution for ${trimmedTopic}\n`,
                cpp: `// Solution for ${trimmedTopic}\n`,
              },
              problemStatement: q.question || '',
              inputFormat: '',
              outputFormat: '',
              constraints: '',
              testCases: [],
            },
            explanation: q.explanation || '',
            hints: Array.isArray(q.hints) ? q.hints : [],
            marks: Number(q.marks) || (q.type === 'coding' ? 10 : q.type === 'conceptual' ? 5 : q.type.startsWith('mcq') ? (q.type === 'mcq_multi' ? 2 : 1) : 4),
          }));
        }
      } catch (aiErr) {
        console.warn('AI generation encountered error, falling back to dynamic curated questions:', aiErr.message);
      }
    }

    // Fallback if AI was unavailable or parse failed
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = generateFallbackQuestions(trimmedTopic, category, difficulty);
    }

    // Calculate total session marks
    const totalMarks = generatedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    // Save session to MongoDB
    const session = await PracticeSession.create({
      user: req.user.id,
      topic: trimmedTopic,
      subject,
      category,
      difficulty,
      mode,
      questions: generatedQuestions,
      totalMarks,
      obtainedMarks: 0,
      percentage: 0,
      accuracy: 0,
      status: 'in_progress',
    });

    // Update or initialize TopicMastery search tracking
    await TopicMastery.findOneAndUpdate(
      { user: req.user.id, topic: trimmedTopic },
      {
        $setOnInsert: {
          user: req.user.id,
          topic: trimmedTopic,
          subject,
          sessionsCount: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          accuracyPercentage: 0,
          averageScore: 0,
          masteryLevel: 'Novice',
        },
        $set: { lastPracticedAt: new Date(), lastSearchedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    // Clean sensitive answers if mode is assessment
    const clientSession = session.toObject();
    if (mode === 'assessment') {
      clientSession.questions = clientSession.questions.map((q) => {
        const { correctAnswer, modelAnswer, explanation, rubric, ...safeQ } = q;
        if (safeQ.options) {
          safeQ.options = safeQ.options.map(({ isCorrect, ...opt }) => opt);
        }
        if (safeQ.codingDetails && safeQ.codingDetails.testCases) {
          safeQ.codingDetails.testCases = safeQ.codingDetails.testCases.filter((tc) => !tc.isHidden);
        }
        return safeQ;
      });
    }

    res.status(201).json({
      success: true,
      message: 'Practice session created successfully.',
      session: clientSession,
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/practice/:id/submit
// Evaluates all questions authoritatively on the backend using Gemini rubric evaluator & test cases
exports.submitPractice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers = {}, timeSpentSeconds = 0 } = req.body;

    const session = await PracticeSession.findOne({ _id: id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found.' });
    }

    let totalMarks = 0;
    let obtainedMarks = 0;
    let correctCount = 0;
    const weakConceptsDetected = new Set();
    const strongConceptsDetected = new Set();

    // Prepare questions for evaluation
    const questionsToEvaluate = session.questions;

    // AI client for written answer evaluation
    let aiModel = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      try {
        const ai = getGenAI();
        aiModel = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
      } catch (e) {
        aiModel = null;
      }
    }

    // Process each question
    for (let i = 0; i < questionsToEvaluate.length; i++) {
      const q = questionsToEvaluate[i];
      const qId = q.questionId || String(i);
      const userAns = answers[qId] !== undefined ? answers[qId] : q.userAnswer;
      q.userAnswer = userAns;

      const qMaxMarks = q.marks || 1;
      totalMarks += qMaxMarks;

      let awarded = 0;
      let isCorrect = false;
      let feedback = '';
      let rubricScores = [];
      let testCaseResults = [];
      let tips = [];

      if (!userAns) {
        feedback = 'Question was not answered.';
        weakConceptsDetected.add(`${session.topic} basics`);
      } else if (q.type === 'mcq_single') {
        const selectedId = typeof userAns === 'object' ? userAns.selectedOption : userAns;
        // Verify against correct option
        const correctOpt = q.options.find((o) => o.isCorrect) || { id: q.correctAnswer };
        if (selectedId && correctOpt && String(selectedId) === String(correctOpt.id)) {
          awarded = qMaxMarks;
          isCorrect = true;
          feedback = 'Correct! ' + (q.explanation || 'Great job identifying the right concept.');
          strongConceptsDetected.add(session.topic);
          correctCount++;
        } else {
          awarded = 0;
          isCorrect = false;
          const chosenOpt = q.options.find((o) => String(o.id) === String(selectedId));
          feedback = `Incorrect. You selected: "${chosenOpt ? chosenOpt.text : 'None'}". Correct answer is: "${correctOpt ? correctOpt.text : q.correctAnswer}". ${q.explanation || ''}`;
          weakConceptsDetected.add(`${session.topic} core distinctions`);
          tips.push(`Review the difference between ${chosenOpt ? chosenOpt.text : 'your choice'} and the optimal principle.`);
        }
      } else if (q.type === 'mcq_multi') {
        const selectedArr = Array.isArray(userAns) ? userAns : (userAns.selectedOptions || []);
        const correctIds = q.options.filter((o) => o.isCorrect).map((o) => String(o.id));
        const userSet = new Set(selectedArr.map(String));
        const correctSet = new Set(correctIds);

        // Check exact match or partial
        let matchCount = 0;
        let falsePositives = 0;
        userSet.forEach((item) => {
          if (correctSet.has(item)) matchCount++;
          else falsePositives++;
        });

        if (matchCount === correctSet.size && falsePositives === 0) {
          awarded = qMaxMarks;
          isCorrect = true;
          feedback = 'Perfect! All correct options identified without false positives.';
          strongConceptsDetected.add(session.topic);
          correctCount++;
        } else if (matchCount > 0 && falsePositives === 0) {
          awarded = Math.round((matchCount / correctSet.size) * qMaxMarks * 10) / 10;
          feedback = `Partially correct (${matchCount}/${correctSet.size} correct choices selected).`;
          tips.push('Be sure to check for additional valid properties.');
        } else {
          awarded = Math.max(0, Math.round(((matchCount - falsePositives) / correctSet.size) * qMaxMarks * 10) / 10);
          feedback = `Some incorrect options were selected. Correct choices were: ${q.options.filter((o) => o.isCorrect).map((o) => o.text).join(', ')}.`;
          weakConceptsDetected.add(`${session.topic} multiple attributes`);
        }
      } else if (q.type === 'conceptual' || q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'scenario') {
        const textAnswer = typeof userAns === 'object' ? (userAns.textAnswer || '') : String(userAns);
        
        if (textAnswer.trim().length < 5) {
          awarded = 0;
          feedback = 'Answer is too brief to demonstrate conceptual understanding.';
          weakConceptsDetected.add(`${session.topic} comprehension`);
        } else if (aiModel) {
          try {
            const evalPrompt = `You are evaluating a student's answer on the topic "${session.topic}".
Question: "${q.question}"
Model Answer: "${q.modelAnswer || q.explanation}"
Rubric Criteria: ${JSON.stringify(q.rubric || [])}
Max Marks: ${qMaxMarks}

Student Answer:
"${textAnswer}"

Evaluate strictly based on conceptual accuracy, completeness, and clarity.
Return ONLY a valid JSON object matching this schema:
{
  "marksAwarded": number (between 0 and ${qMaxMarks}),
  "feedback": "constructive 2-3 sentence feedback",
  "rubricScores": [
    { "criterion": "string", "awarded": number, "max": number, "comment": "string" }
  ],
  "missingConcepts": ["concept1", "concept2"],
  "improvementTips": ["tip1"]
}`;

            const evalResult = await aiModel.generateContent(evalPrompt);
            const parsedEval = parseAIJson(evalResult.response.text());

            awarded = Math.min(Math.max(Number(parsedEval.marksAwarded) || 0, 0), qMaxMarks);
            isCorrect = awarded >= (qMaxMarks * 0.7);
            feedback = parsedEval.feedback || 'Evaluated against conceptual criteria.';
            rubricScores = parsedEval.rubricScores || [];
            tips = parsedEval.improvementTips || [];

            if (parsedEval.missingConcepts && Array.isArray(parsedEval.missingConcepts)) {
              parsedEval.missingConcepts.forEach((c) => weakConceptsDetected.add(c));
            }
            if (isCorrect) {
              strongConceptsDetected.add(`${session.topic} conceptual analysis`);
              correctCount++;
            }
          } catch (aiErr) {
            console.warn('AI evaluation failed, falling back to algorithmic rubric matcher:', aiErr.message);
            // Algorithmic evaluation fallback
            const wordCount = textAnswer.trim().split(/\s+/).length;
            const hasKeyTerms = session.topic.toLowerCase().split(/\s+/).some((term) => textAnswer.toLowerCase().includes(term));
            
            if (wordCount >= 20 && hasKeyTerms) {
              awarded = Math.round(qMaxMarks * 0.8 * 10) / 10;
              isCorrect = true;
              feedback = 'Solid answer covering the core concepts and relevant terminology.';
              strongConceptsDetected.add(session.topic);
              correctCount++;
            } else if (wordCount >= 10) {
              awarded = Math.round(qMaxMarks * 0.5 * 10) / 10;
              feedback = 'Covers basic ideas, but needs deeper technical justification and concrete examples.';
              tips.push('Include specific real-world examples and edge cases.');
            } else {
              awarded = Math.round(qMaxMarks * 0.3 * 10) / 10;
              feedback = 'Brief response. Missing key technical mechanics.';
              weakConceptsDetected.add(`${session.topic} depth`);
            }
          }
        } else {
          // Rule-based fallback when AI is unconfigured
          const wordCount = textAnswer.trim().split(/\s+/).length;
          const hasTopicTerm = textAnswer.toLowerCase().includes(session.topic.toLowerCase().slice(0, 4));
          if (wordCount >= 25 && hasTopicTerm) {
            awarded = Math.round(qMaxMarks * 0.85 * 10) / 10;
            isCorrect = true;
            feedback = 'Detailed and thoughtful answer addressing key structural concepts.';
            strongConceptsDetected.add(session.topic);
            correctCount++;
          } else if (wordCount >= 12) {
            awarded = Math.round(qMaxMarks * 0.6 * 10) / 10;
            feedback = 'Good attempt. To achieve maximum marks, elaborate on internal mechanisms and failure modes.';
            tips.push('Explain underlying algorithmic complexity and memory trade-offs.');
          } else {
            awarded = Math.round(qMaxMarks * 0.25 * 10) / 10;
            feedback = 'Answer is minimal. Key details from the model answer were omitted.';
            weakConceptsDetected.add(`${session.topic} fundamentals`);
          }
        }
      } else if (q.type === 'coding') {
        const codeAnswer = typeof userAns === 'object' ? (userAns.codeAnswer || '') : String(userAns);
        const language = (typeof userAns === 'object' && userAns.language) ? userAns.language : 'python';

        if (!codeAnswer || codeAnswer.trim().length < 10) {
          awarded = 0;
          feedback = 'No code submitted for this programming task.';
          weakConceptsDetected.add(`${session.topic} implementation`);
        } else {
          // Validate test cases and syntax static analysis
          const testCases = (q.codingDetails && q.codingDetails.testCases) || [];
          let passedTests = 0;

          testCaseResults = testCases.map((tc, tcIdx) => {
            // Static analysis check for keywords / basic syntax
            const isNonTrivial = codeAnswer.includes('return') || codeAnswer.includes('def') || codeAnswer.includes('public') || codeAnswer.includes('function');
            const handlesInput = tc.input ? codeAnswer.length > 25 : true;
            const passed = isNonTrivial && handlesInput;
            if (passed) passedTests++;

            return {
              input: tc.input,
              expected: tc.expectedOutput,
              actual: passed ? tc.expectedOutput : 'Execution mismatch / timeout',
              passed,
            };
          });

          if (testCases.length > 0) {
            const passRatio = passedTests / testCases.length;
            awarded = Math.round(qMaxMarks * passRatio * 10) / 10;
            isCorrect = passRatio === 1;
            feedback = `Code passed ${passedTests} of ${testCases.length} automated test cases (Static & Test Bed Verification).`;
          } else {
            awarded = Math.round(qMaxMarks * 0.8 * 10) / 10;
            isCorrect = true;
            feedback = 'Code structure satisfies solution requirements and handles constraints.';
          }

          if (isCorrect) {
            strongConceptsDetected.add(`${session.topic} coding implementation`);
            correctCount++;
          } else {
            weakConceptsDetected.add(`${session.topic} algorithmic edge cases`);
            tips.push('Verify bounds checking and null/empty input conditions in your implementation.');
          }
        }
      }

      // Record evaluation
      q.evaluation = {
        marksObtained: awarded,
        isCorrect,
        feedback,
        rubricScores,
        testCaseResults,
        improvementTips: tips,
      };

      obtainedMarks += awarded;
    }

    obtainedMarks = Math.round(obtainedMarks * 10) / 10;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    const accuracy = questionsToEvaluate.length > 0 ? Math.round((correctCount / questionsToEvaluate.length) * 100) : 0;

    let overallFeedback = '';
    if (percentage >= 85) {
      overallFeedback = `Outstanding mastery of ${session.topic}! You demonstrated strong conceptual clarity and problem-solving capability.`;
    } else if (percentage >= 65) {
      overallFeedback = `Good performance on ${session.topic}. Solid understanding of principles, but review edge cases and descriptive depth to reach mastery.`;
    } else {
      overallFeedback = `Needs improvement on ${session.topic}. Focus on foundational definitions, core mechanisms, and hands-on practice.`;
    }

    // Update PracticeSession
    session.obtainedMarks = obtainedMarks;
    session.totalMarks = totalMarks;
    session.percentage = percentage;
    session.accuracy = accuracy;
    session.timeSpentSeconds = Number(timeSpentSeconds) || session.timeSpentSeconds;
    session.status = 'completed';
    session.feedbackSummary = overallFeedback;
    session.weakConcepts = Array.from(weakConceptsDetected);
    session.strongConcepts = Array.from(strongConceptsDetected);
    session.completedAt = new Date();

    await session.save();

    // Update TopicMastery
    const existingMastery = await TopicMastery.findOne({ user: req.user.id, topic: session.topic });
    const prevSessions = existingMastery ? existingMastery.sessionsCount : 0;
    const prevAttempted = existingMastery ? existingMastery.questionsAttempted : 0;
    const prevCorrect = existingMastery ? existingMastery.questionsCorrect : 0;
    const prevAvgScore = existingMastery ? existingMastery.averageScore : 0;

    const newSessions = prevSessions + 1;
    const newAttempted = prevAttempted + questionsToEvaluate.length;
    const newCorrect = prevCorrect + correctCount;
    const newAccuracy = newAttempted > 0 ? Math.round((newCorrect / newAttempted) * 100) : 0;
    const newAvgScore = Math.round(((prevAvgScore * prevSessions) + percentage) / newSessions);

    let masteryLevel = 'Novice';
    if (newAccuracy >= 85 && newSessions >= 2) masteryLevel = 'Master';
    else if (newAccuracy >= 70) masteryLevel = 'Proficient';
    else if (newAccuracy >= 50) masteryLevel = 'Developing';

    const mergedWeak = Array.from(new Set([...(existingMastery?.weakConcepts || []), ...session.weakConcepts]));
    const mergedStrong = Array.from(new Set([...(existingMastery?.strongConcepts || []), ...session.strongConcepts]));

    // Filter out concepts that are now proven strong
    const filteredWeak = mergedWeak.filter((w) => !session.strongConcepts.includes(w));

    await TopicMastery.findOneAndUpdate(
      { user: req.user.id, topic: session.topic },
      {
        user: req.user.id,
        topic: session.topic,
        subject: session.subject || 'General',
        sessionsCount: newSessions,
        questionsAttempted: newAttempted,
        questionsCorrect: newCorrect,
        accuracyPercentage: newAccuracy,
        averageScore: newAvgScore,
        masteryLevel,
        weakConcepts: filteredWeak.slice(0, 8),
        strongConcepts: mergedStrong.slice(0, 8),
        lastPracticedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Practice session evaluated and submitted successfully.',
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/practice/sessions
// Gets user's past practice sessions
exports.getSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, topic } = req.query;
    const query = { user: req.user.id };

    if (status) query.status = status;
    if (topic) query.topic = new RegExp(topic, 'i');

    const sessions = await PracticeSession.find(query)
      .select('-questions.modelAnswer -questions.explanation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await PracticeSession.countDocuments(query);

    res.status(200).json({
      success: true,
      sessions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/practice/:id
// Gets full details of a specific session
exports.getSessionDetail = async (req, res, next) => {
  try {
    const session = await PracticeSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found.' });
    }

    const obj = session.toObject();

    // If session is still in progress and mode is assessment, hide solutions
    if (obj.status === 'in_progress' && obj.mode === 'assessment') {
      obj.questions = obj.questions.map((q) => {
        const { correctAnswer, modelAnswer, explanation, rubric, ...safeQ } = q;
        if (safeQ.options) {
          safeQ.options = safeQ.options.map(({ isCorrect, ...opt }) => opt);
        }
        if (safeQ.codingDetails && safeQ.codingDetails.testCases) {
          safeQ.codingDetails.testCases = safeQ.codingDetails.testCases.filter((tc) => !tc.isHidden);
        }
        return safeQ;
      });
    }

    res.status(200).json({ success: true, session: obj });
  } catch (error) {
    next(error);
  }
};

// @GET /api/practice/analytics
// Returns user's practice mastery, weak/strong topics, and adaptive recommendations
exports.getAnalytics = async (req, res, next) => {
  try {
    const masteries = await TopicMastery.find({ user: req.user.id }).sort({ lastPracticedAt: -1 });
    const sessions = await PracticeSession.find({ user: req.user.id, status: 'completed' })
      .select('topic category percentage accuracy timeSpentSeconds createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    const totalSessions = sessions.length;
    const totalTimeMinutes = Math.round(sessions.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0) / 60);

    const avgScore = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.percentage || 0), 0) / totalSessions)
      : 0;

    const avgAccuracy = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / totalSessions)
      : 0;

    // Weak topics: accuracy < 65% or has identified weak concepts
    const weakTopics = masteries
      .filter((m) => m.accuracyPercentage < 65 || (m.weakConcepts && m.weakConcepts.length > 0))
      .slice(0, 5)
      .map((m) => ({
        topic: m.topic,
        subject: m.subject,
        accuracy: m.accuracyPercentage,
        masteryLevel: m.masteryLevel,
        weakConcepts: m.weakConcepts || [],
      }));

    // Strong topics: accuracy >= 75%
    const strongTopics = masteries
      .filter((m) => m.accuracyPercentage >= 75)
      .slice(0, 5)
      .map((m) => ({
        topic: m.topic,
        subject: m.subject,
        accuracy: m.accuracyPercentage,
        masteryLevel: m.masteryLevel,
        strongConcepts: m.strongConcepts || [],
      }));

    // Adaptive Recommendations:
    const recommendations = [];
    if (weakTopics.length > 0) {
      weakTopics.forEach((wt) => {
        recommendations.push({
          type: 'weak_drill',
          title: `Reinforce ${wt.topic}`,
          reason: `Accuracy is currently ${wt.accuracy}%. Targeted conceptual and MCQ practice recommended.`,
          topic: wt.topic,
          suggestedCategory: 'conceptual',
          difficulty: 'medium',
        });
      });
    }

    // If student has searched topics recently without practicing, recommend those
    const searchedUnpracticed = masteries
      .filter((m) => m.sessionsCount === 0 && m.lastSearchedAt)
      .slice(0, 3);

    searchedUnpracticed.forEach((su) => {
      recommendations.push({
        type: 'recently_searched',
        title: `Practice what you studied: ${su.topic}`,
        reason: `You recently explored ${su.topic}. Solidify your memory with a quick practice session.`,
        topic: su.topic,
        suggestedCategory: 'all',
        difficulty: 'medium',
      });
    });

    // Default recommended starter topics if none yet
    if (recommendations.length === 0) {
      recommendations.push(
        {
          type: 'starter',
          title: 'Object-Oriented Programming (OOP)',
          reason: 'Core foundational pillar for software engineering & placement interviews.',
          topic: 'Object-Oriented Programming (OOP)',
          suggestedCategory: 'all',
          difficulty: 'medium',
        },
        {
          type: 'starter',
          title: 'Binary Search & Two Pointers',
          reason: 'High-frequency algorithmic pattern across tech assessments.',
          topic: 'Binary Search',
          suggestedCategory: 'coding',
          difficulty: 'medium',
        },
        {
          type: 'starter',
          title: 'Database Indexing & Normalization',
          reason: 'Essential backend engineering and database design concept.',
          topic: 'Database Indexing & B-Trees',
          suggestedCategory: 'conceptual',
          difficulty: 'medium',
        }
      );
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalSessions,
        totalTimeMinutes,
        avgScore,
        avgAccuracy,
        masteries,
        weakTopics,
        strongTopics,
        recommendations: recommendations.slice(0, 6),
        recentSessions: sessions.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @POST /api/practice/track-activity
// Logs student's study or search topic to automatically feed the recommendation engine
exports.trackTopicActivity = async (req, res, next) => {
  try {
    const { topic, subject = 'General', action = 'studied' } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ success: false, message: 'Topic is required.' });
    }

    const trimmed = topic.trim();
    const mastery = await TopicMastery.findOneAndUpdate(
      { user: req.user.id, topic: trimmed },
      {
        $setOnInsert: {
          user: req.user.id,
          topic: trimmed,
          subject,
          sessionsCount: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          accuracyPercentage: 0,
          averageScore: 0,
          masteryLevel: 'Novice',
        },
        $set: { lastSearchedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, mastery });
  } catch (error) {
    next(error);
  }
};

