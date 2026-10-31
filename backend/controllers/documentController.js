/**
 * documentController.js
 * Handles handwritten notes / document upload, OCR, and analysis report generation.
 * Uses Gemini Vision API for image OCR and pdf-parse for PDF text extraction.
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Document = require('../models/Document');
const AnalysisReport = require('../models/AnalysisReport');
const Syllabus = require('../models/Syllabus');

// ── Helpers ────────────────────────────────────────────────────────────────────

const getGenAI = () => {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!rawKey) throw new Error('GEMINI_API_KEY not configured');
  return new GoogleGenerativeAI(rawKey);
};

/**
 * Run OCR on an image file using Gemini Vision.
 * Returns { text, confidence, notes }
 */
const ocrImage = async (fileBuffer, mimeType) => {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });

  const imagePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };

  const prompt = `You are an expert OCR system specializing in handwritten academic notes.

Please extract ALL text from this image of handwritten notes.

Instructions:
1. Extract every word you can read clearly.
2. For unclear/unreadable sections, write [UNCLEAR] in place of the text.
3. Preserve structure: headings, bullet points, diagrams labels, equations.
4. Do NOT interpret or add information not in the image.
5. After the extracted text, add a section: "OCR CONFIDENCE: [HIGH/MEDIUM/LOW]" based on overall readability.
6. Add "OCR NOTES: " with brief notes on readability issues (or "None" if clear).

Begin extraction:`;

  const result = await model.generateContent([prompt, imagePart]);
  const raw = result.response.text();

  // Parse confidence and notes from response
  const confMatch = raw.match(/OCR CONFIDENCE:\s*(HIGH|MEDIUM|LOW)/i);
  const notesMatch = raw.match(/OCR NOTES:\s*(.+?)(?:\n|$)/i);

  const confidence = confMatch ? confMatch[1].toLowerCase() : 'medium';
  const notes = notesMatch ? notesMatch[1].trim() : '';

  // Clean extracted text (remove the OCR meta lines)
  const text = raw
    .replace(/OCR CONFIDENCE:.*$/im, '')
    .replace(/OCR NOTES:.*$/im, '')
    .trim();

  return { text, confidence, notes };
};

/**
 * Extract text from PDF using pdf-parse.
 */
const extractPdfText = async (fileBuffer) => {
  try {
    // Lazy require to avoid issues if not installed
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(fileBuffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      confidence: 'high',
      notes: '',
    };
  } catch (err) {
    return { text: '', pageCount: 1, confidence: 'failed', notes: err.message };
  }
};

// ── Controllers ────────────────────────────────────────────────────────────────

/**
 * POST /api/documents/upload
 * Upload an image or PDF document. Runs OCR immediately.
 * Expects multipart/form-data with field "document".
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { originalname, mimetype, size, path: tempPath, buffer } = req.file;
    const { title, subjectName } = req.body;

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed: JPG, JPEG, PNG, PDF.',
      });
    }

    // Validate size (10 MB)
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large. Max 10 MB.' });
    }

    // Check AI availability
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GEMINI_API_KEY to enable document analysis.',
        code: 'AI_NOT_CONFIGURED',
      });
    }

    // Create pending document record
    const doc = await Document.create({
      user: req.user.id,
      title: title || originalname,
      fileUrl: tempPath || '', // Will be updated if Cloudinary is configured
      mimeType: mimetype,
      fileSize: size,
      subjectName: subjectName || '',
      processingStatus: 'processing',
    });

    // Read file buffer
    let fileBuffer;
    if (buffer) {
      fileBuffer = buffer;
    } else if (tempPath && fs.existsSync(tempPath)) {
      fileBuffer = fs.readFileSync(tempPath);
    } else {
      return res.status(500).json({ success: false, message: 'Could not read uploaded file.' });
    }

    // Try to upload to Cloudinary if configured
    let cloudinaryUrl = '';
    let cloudinaryPublicId = '';
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const cloudinary = require('../config/cloudinary');
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `edunexa/documents/${req.user.id}`,
              resource_type: 'auto',
              use_filename: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(fileBuffer);
        });
        cloudinaryUrl = uploadResult.secure_url;
        cloudinaryPublicId = uploadResult.public_id;
      } catch (e) {
        console.warn('Cloudinary upload failed, storing locally:', e.message);
      }
    }

    // Run OCR / Text extraction
    let ocrResult = { text: '', confidence: 'not_applicable', notes: '', pageCount: 1 };
    if (mimetype === 'application/pdf') {
      ocrResult = await extractPdfText(fileBuffer);
    } else {
      ocrResult = await ocrImage(fileBuffer, mimetype);
    }

    // Detect subject/topics using Gemini if OCR succeeded
    let detectedSubject = '';
    let detectedTopics = [];
    if (ocrResult.text && ocrResult.confidence !== 'failed') {
      try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });
        const detectPrompt = `Based on the following extracted text from student notes, identify:
1. The most likely academic subject (e.g., "Data Structures", "Physics", "Mathematics")
2. Up to 8 specific topics covered

Return ONLY valid JSON (no markdown):
{"subject": "Subject Name", "topics": ["topic1", "topic2", ...]}

Text:
${ocrResult.text.slice(0, 3000)}`;
        const detectResult = await model.generateContent(detectPrompt);
        const raw = detectResult.response.text().trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          detectedSubject = parsed.subject || '';
          detectedTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
        }
      } catch (e) {
        console.warn('Topic detection failed:', e.message);
      }
    }

    // Update document record
    doc.fileUrl = cloudinaryUrl || tempPath || '';
    doc.publicId = cloudinaryPublicId;
    doc.ocrText = ocrResult.text;
    doc.ocrConfidence = ocrResult.confidence;
    doc.ocrNotes = ocrResult.notes || '';
    doc.pageCount = ocrResult.pageCount || 1;
    doc.processingStatus = ocrResult.confidence === 'failed' ? 'failed' : 'done';
    doc.processingError = ocrResult.confidence === 'failed' ? ocrResult.notes : '';
    doc.detectedSubject = detectedSubject;
    doc.detectedTopics = detectedTopics;
    await doc.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully.',
      document: {
        _id: doc._id,
        title: doc.title,
        mimeType: doc.mimeType,
        fileUrl: doc.fileUrl,
        processingStatus: doc.processingStatus,
        ocrConfidence: doc.ocrConfidence,
        ocrNotes: doc.ocrNotes,
        detectedSubject: doc.detectedSubject,
        detectedTopics: doc.detectedTopics,
        pageCount: doc.pageCount,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/documents
 * Get all documents for the logged-in user.
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const docs = await Document.find({ user: req.user.id })
      .select('-ocrText') // Don't send full OCR text in list
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Document.countDocuments({ user: req.user.id });
    res.status(200).json({ success: true, total, documents: docs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/documents/:id
 * Get single document (including OCR text) — owner only.
 */
exports.getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    res.status(200).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/documents/:id
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    // Try to delete from Cloudinary
    if (doc.publicId && process.env.CLOUDINARY_API_KEY) {
      try {
        const cloudinary = require('../config/cloudinary');
        await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' });
      } catch (e) {
        console.warn('Cloudinary delete failed:', e.message);
      }
    }

    res.status(200).json({ success: true, message: 'Document deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/documents/:id/analyze
 * Run full AI analysis of a document against a syllabus (optional).
 * Creates or updates an AnalysisReport.
 */
exports.analyzeDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    if (!doc.ocrText || doc.processingStatus !== 'done') {
      return res.status(400).json({
        success: false,
        message: 'Document OCR is not complete yet. Please wait for processing to finish.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured.', code: 'AI_NOT_CONFIGURED' });
    }

    const { syllabusId } = req.body;

    // Fetch syllabus if provided
    let syllabus = null;
    if (syllabusId) {
      syllabus = await Syllabus.findById(syllabusId);
    }

    // Create/update report record
    let report = await AnalysisReport.findOne({ document: doc._id, user: req.user.id });
    if (!report) {
      report = new AnalysisReport({ document: doc._id, user: req.user.id });
    }
    report.reportStatus = 'generating';
    report.syllabus = syllabus?._id || null;
    report.syllabusName = syllabus ? `${syllabus.subject} — ${syllabus.degree} ${syllabus.branch} Sem ${syllabus.semester}` : '';
    report.hasSyllabus = !!syllabus;
    await report.save();

    // Build analysis prompt
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash' });

    let syllabusContext = '';
    if (syllabus && syllabus.topics?.length > 0) {
      const topicList = syllabus.topics.map((t) => `- ${t.name}${t.unit ? ` (${t.unit})` : ''}`).join('\n');
      syllabusContext = `\n\nOFFICIAL SYLLABUS TOPICS for ${syllabus.subject}:\n${topicList}`;
    }

    const prompt = `You are an expert educational content analyzer reviewing a student's handwritten notes.

IMPORTANT RELIABILITY RULES:
- Distinguish between unreadable OCR text and actual student errors. Never label uncertain OCR text as a confirmed conceptual error.
- Mark AI-detected issues as "possible issues requiring verification", not guaranteed facts.
- If OCR quality was low, note that analysis confidence is reduced.
- Do not invent or assume text that wasn't extracted.

EXTRACTED NOTES:
${doc.ocrText.slice(0, 8000)}

OCR Confidence: ${doc.ocrConfidence}
OCR Notes: ${doc.ocrNotes || 'None'}
${syllabusContext}

Please analyze and return ONLY valid JSON (no markdown code blocks):
{
  "executiveSummary": "2-3 sentence summary of what the notes cover",
  "ocrQualityNote": "Note about OCR quality and its impact on analysis reliability",
  "detectedSubject": "Primary subject detected",
  "detectedTopics": ["topic1", "topic2", ...],
  "topicCoverage": [
    {
      "topicName": "Topic Name",
      "unit": "Unit/Chapter",
      "status": "covered|partial|missing",
      "confidence": "high|medium|low",
      "evidenceSnippet": "Brief quote from notes or empty string",
      "note": "Any observation about coverage quality"
    }
  ],
  "possibleErrors": [
    {
      "description": "What seems potentially incorrect or incomplete",
      "severity": "low|medium|high",
      "pageOrSection": "approximate location",
      "aiConfidence": "possible|likely|uncertain",
      "requiresVerification": true
    }
  ],
  "recommendations": ["Specific recommendation 1", ...],
  "revisionTopics": ["Topic needing revision 1", ...],
  "practiceTopics": ["Topic needing practice questions 1", ...]
}

${!syllabus ? 'Note: No syllabus provided. Topic coverage comparison is not possible. Only analyze what is present in the notes.' : ''}`;

    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text().trim();

    // Parse JSON response
    let analysis;
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid format');
    analysis = JSON.parse(jsonMatch[0]);

    // Update report
    report.topicCoverage = analysis.topicCoverage || [];
    report.coveredCount = report.topicCoverage.filter((t) => t.status === 'covered').length;
    report.partialCount = report.topicCoverage.filter((t) => t.status === 'partial').length;
    report.missingCount = report.topicCoverage.filter((t) => t.status === 'missing').length;
    const total = report.topicCoverage.length;
    report.coveragePercent = total > 0
      ? Math.round(((report.coveredCount + report.partialCount * 0.5) / total) * 100)
      : 0;
    report.possibleErrors = analysis.possibleErrors || [];
    report.recommendations = analysis.recommendations || [];
    report.revisionTopics = analysis.revisionTopics || [];
    report.practiceTopics = analysis.practiceTopics || [];
    report.executiveSummary = analysis.executiveSummary || '';
    report.ocrQualityNote = analysis.ocrQualityNote || '';
    report.reportStatus = 'complete';

    // Also update document with detected topics if empty
    if (!doc.detectedSubject && analysis.detectedSubject) {
      doc.detectedSubject = analysis.detectedSubject;
      doc.detectedTopics = analysis.detectedTopics || [];
      await doc.save();
    }

    await report.save();

    res.status(200).json({ success: true, report });
  } catch (error) {
    // Update report to failed if error
    try {
      await AnalysisReport.findOneAndUpdate(
        { document: req.params.id, user: req.user.id },
        { reportStatus: 'failed', reportError: error.message }
      );
    } catch (_) {}
    next(error);
  }
};

/**
 * GET /api/documents/:id/report
 * Get the analysis report for a document.
 */
exports.getReport = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    const report = await AnalysisReport.findOne({ document: req.params.id, user: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'No analysis report found. Please run analysis first.' });

    res.status(200).json({ success: true, report, document: doc });
  } catch (error) {
    next(error);
  }
};

