const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  key: String,
  value: String,
  confidence: { type: Number, min: 0, max: 100 },
  isPII: { type: Boolean, default: false },   // required — AI sets this on each field
  isVerified: { type: Boolean, default: false },
  isMasked: { type: Boolean, default: false },
  boundingBox: {
    x: Number, y: Number, width: Number, height: Number,
  },
}, { _id: false });

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, trim: true },
    originalFileName: { type: String, required: true },

    // ImageKit storage
    imageKit: {
      fileId: String,
      url: String,
      thumbnailUrl: String,
      originalUrl: String,
    },

    // Processing status
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'needs_review'],
      default: 'queued',
      index: true,
    },
    processingError: String,
    jobId: String,

    // OCR & AI results
    rawOcrText: { type: String, select: false }, // raw OCR output, not exposed by default
    extractedText: String, // AI-corrected, clean text
    extractedFields: [fieldSchema],

    // Document intelligence
    documentType: {
      type: String,
      enum: [
        'aadhaar', 'pan', 'voter_id', 'passport', 'driving_license',
        'land_record', 'court_notice', 'ration_card', 'birth_certificate',
        'school_certificate', 'income_certificate', 'caste_certificate',
        'medical_record', 'bank_statement', 'legal_notice', 'other',
      ],
      default: 'other',
    },
    detectedLanguages: [{ type: String }], // ['hindi', 'english', 'tamil', ...]
    primaryLanguage: String,

    // Scoring
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    healthScore: { type: Number, min: 0, max: 100, default: 0 },
    healthDetails: {
      clarity: Number,
      completeness: Number,
      readability: Number,
      suggestions: [String],
    },

    // PII / Masking
    hasPII: { type: Boolean, default: false },
    piiFields: [String], // field keys that contain PII
    isPIIMasked: { type: Boolean, default: false },

    // Translation
    translations: {
      type: Map,
      of: String, // { en: '...', hi: '...', ta: '...' }
    },

    // Layout reconstruction
    structuredContent: {
      type: mongoose.Schema.Types.Mixed, // tables, headings, paragraphs as JSON
    },

    // File metadata
    fileSize: Number, // bytes
    mimeType: String,
    pageCount: { type: Number, default: 1 },

    // Processing metrics
    processingTimeMs: Number,
   ocrEngine: { type: String, enum: ['tesseract', 'paddleocr', 'hybrid', 'tesseract+gemini', 'gemini-only'], default: 'tesseract' },

    // Human-in-the-loop
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    correctionLog: [
      {
        field: String,
        oldValue: String,
        newValue: String,
        correctedAt: { type: Date, default: Date.now },
      },
    ],

    tags: [String],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Text search index
documentSchema.index({
  extractedText: 'text',
  title: 'text',
  'extractedFields.value': 'text',
});
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);
