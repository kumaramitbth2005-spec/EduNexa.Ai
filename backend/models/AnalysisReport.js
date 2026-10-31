const mongoose = require('mongoose');

const topicCoverageSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  unit: { type: String, default: '' },
  status: {
    type: String,
    enum: ['covered', 'partial', 'missing'],
    default: 'missing',
  },
  confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  evidenceSnippet: { type: String, default: '' }, // text excerpt from notes
  note: { type: String, default: '' }, // e.g., "Explanation seems incomplete"
}, { _id: false });

const possibleErrorSchema = new mongoose.Schema({
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  pageOrSection: { type: String, default: '' },
  aiConfidence: { type: String, enum: ['possible', 'likely', 'uncertain'], default: 'possible' },
  requiresVerification: { type: Boolean, default: true },
}, { _id: false });

const analysisReportSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    syllabus: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus', default: null },
    syllabusName: { type: String, default: '' }, // denormalized

    // Topic Coverage
    topicCoverage: [topicCoverageSchema],
    coveredCount: { type: Number, default: 0 },
    partialCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 },
    coveragePercent: { type: Number, default: 0 },

    // Issues found
    possibleErrors: [possibleErrorSchema],

    // Recommendations
    recommendations: [{ type: String }],
    revisionTopics: [{ type: String }],
    practiceTopics: [{ type: String }],

    // Overall AI analysis
    executiveSummary: { type: String, default: '' },
    ocrQualityNote: { type: String, default: '' }, // note about OCR reliability

    // Flags
    hasSyllabus: { type: Boolean, default: false },
    reportStatus: {
      type: String,
      enum: ['pending', 'generating', 'complete', 'failed'],
      default: 'pending',
    },
    reportError: { type: String, default: '' },
  },
  { timestamps: true }
);

analysisReportSchema.index({ user: 1, document: 1 });

module.exports = mongoose.model('AnalysisReport', analysisReportSchema);

