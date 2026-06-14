const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  key: String,
  value: String,
  confidence: { type: Number, min: 0, max: 100 },
  isPII: { type: Boolean, default: false },
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

    // OPTIONAL: if this document belongs to a citizen managed by a CSC
    // operator, this links to that Citizen record. If null, the document
    // belongs directly to the operator/user (existing behaviour — unchanged).
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Citizen',
      default: null,
      index: true,
    },

    title: { type: String, trim: true },
    originalFileName: { type: String, required: true },


    imageKit: {
      fileId: String,
      url: String,
      thumbnailUrl: String,
      originalUrl: String,
    },


    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'needs_review'],
      default: 'queued',
      index: true,
    },
    processingError: String,
    jobId: String,


    rawOcrText: { type: String, select: false },
    extractedText: String,
    extractedFields: [fieldSchema],


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
    detectedLanguages: [{ type: String }],
    primaryLanguage: String,


    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    healthScore: { type: Number, min: 0, max: 100, default: 0 },
    healthDetails: {
      clarity: Number,
      completeness: Number,
      readability: Number,
      suggestions: [String],
    },


    hasPII: { type: Boolean, default: false },
    piiFields: [String],
    isPIIMasked: { type: Boolean, default: false },


    translations: {
      type: Map,
      of: String,
    },


    structuredContent: {
      type: mongoose.Schema.Types.Mixed,
    },


    fileSize: Number,
    mimeType: String,
    pageCount: { type: Number, default: 1 },


    processingTimeMs: Number,
   ocrEngine: { type: String, enum: ['tesseract', 'paddleocr', 'hybrid', 'tesseract+gemini', 'gemini-only'], default: 'tesseract' },


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


documentSchema.index({
  extractedText: 'text',
  title: 'text',
  'extractedFields.value': 'text',
});
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, documentType: 1 });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ citizenId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
