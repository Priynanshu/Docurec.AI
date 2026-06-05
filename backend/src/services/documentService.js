// ─── Document Service ─────────────────────────────────────────────────────────
// All business logic for documents: upload, process, fetch, delete, etc.

const Document = require('../models/Document');
const User = require('../models/User');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');
const { processDocument } = require('./ocrService');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// ── Create a Document record + upload to ImageKit ─────────────────────────────
const createDocument = async (userId, fileBuffer, originalName, mimeType, fileSize) => {
  // Try uploading to ImageKit (won't crash if not configured)
  const ikResult = await uploadToImageKit(fileBuffer, originalName, `/docurec/${userId}`);

  // Create the document in MongoDB
  const doc = await Document.create({
    userId,
    originalFileName: originalName,
    title: originalName.replace(/\.[^.]+$/, ''), // remove file extension for title
    imageKit: {
      fileId: ikResult.fileId,
      url: ikResult.url,
      thumbnailUrl: ikResult.thumbnailUrl,
      originalUrl: ikResult.url,
    },
    mimeType,
    fileSize,
    status: 'queued', // will change to 'processing' then 'completed'
  });

  // Update user's document count
  await User.findByIdAndUpdate(userId, {
    $inc: { 'stats.totalDocuments': 1, 'stats.storageUsed': fileSize },
  });

  // Clear cached document lists so next fetch is fresh
  await cacheDelPattern(`docs:${userId}:*`);

  return doc;
};

// ── Run OCR + AI processing on a document ─────────────────────────────────────
// This is called after upload — runs Tesseract + Gemini on the file
const processDocumentById = async (documentId, fileBuffer) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new NotFoundError('Document');

  // Mark as "processing" so the UI can show a spinner
  doc.status = 'processing';
  await doc.save();

  try {
    // Run the full OCR + AI pipeline (takes 5-15 seconds)
    const result = await processDocument(fileBuffer, doc.mimeType);

    // Map extracted fields from AI result
    const extractedFields = (result.extractedFields || []).map((f) => ({
      key: f.key,
      value: f.value,
      confidence: f.confidence || 80,
      isPII: f.isPII || false,
      isMasked: false,
    }));

    // Save all results to the document
    doc.rawOcrText = result.rawOcrText || '';
    doc.extractedText = result.correctedText || result.rawOcrText || '';
    doc.extractedFields = extractedFields;
    doc.documentType = result.documentType || 'other';
    doc.detectedLanguages = result.detectedLanguages || ['english'];
    doc.primaryLanguage = result.primaryLanguage || 'english';
    doc.confidenceScore = result.confidenceScore || 60;
    doc.healthScore = result.healthScore || 60;
    doc.healthDetails = result.healthDetails || {};
    doc.hasPII = result.hasPII || false;
    doc.piiFields = result.piiFields || [];
    doc.structuredContent = result.structuredContent || {};
    doc.processingTimeMs = result.processingTimeMs || 0;
    doc.ocrEngine = result.ocrEngine || 'tesseract+gemini';

    // If confidence is very low, mark for human review
    doc.status = (result.confidenceScore || 60) < 35 ? 'needs_review' : 'completed';

    await doc.save();

    // Update user's processed count
    await User.findByIdAndUpdate(doc.userId, {
      $inc: { 'stats.totalProcessed': 1 },
    });

    // Cache result so next fetch is instant
    await cacheSet(`doc:${documentId}`, doc.toJSON(), 3600);
    await cacheDelPattern(`docs:${doc.userId}:*`);
    await cacheDelPattern(`analytics:${doc.userId}`);

    logger.info(`Document ${documentId} processed in ${result.processingTimeMs}ms`);
    return doc;

  } catch (error) {
    // If processing fails, mark the document as failed but DON'T delete it
    doc.status = 'failed';
    doc.processingError = error.message;
    await doc.save();
    logger.error(`Document processing failed: ${error.message}`);
    // Don't throw — the upload already succeeded, just processing failed
  }
};

// ── Get all documents for a user (with filters + pagination) ──────────────────
const getUserDocuments = async (userId, options = {}) => {
  const { page = 1, limit = 12, status, type, language, search, sort = '-createdAt' } = options;

  // Cache key based on all filter params
  const cacheKey = `docs:${userId}:${JSON.stringify(options)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  // Build query
  const query = { userId, isDeleted: false };
  if (status) query.status = status;
  if (type) query.documentType = type;
  if (language) query.detectedLanguages = language;
  if (search) {
    // Simple text search on title and extracted text
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { extractedText: { $regex: search, $options: 'i' } },
      { originalFileName: { $regex: search, $options: 'i' } },
    ];
  }

  const [docs, total] = await Promise.all([
    Document.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-rawOcrText -structuredContent'), // don't send large fields
    Document.countDocuments(query),
  ]);

  const result = { docs, total, page: parseInt(page), limit: parseInt(limit) };
  await cacheSet(cacheKey, result, 300); // cache 5 minutes
  return result;
};

// ── Get a single document by ID ───────────────────────────────────────────────
const getDocumentById = async (documentId, userId) => {
  // Check cache first
  const cacheKey = `doc:${documentId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    // Security: make sure this doc belongs to the requesting user
    if (String(cached.userId) !== String(userId)) throw new ForbiddenError();
    return cached;
  }

  const doc = await Document.findOne({ _id: documentId, isDeleted: false });
  if (!doc) throw new NotFoundError('Document');
  if (String(doc.userId) !== String(userId)) throw new ForbiddenError();

  await cacheSet(cacheKey, doc.toJSON(), 3600);
  return doc;
};

// ── Toggle PII masking (hide/show private info) ───────────────────────────────
const togglePIIMask = async (documentId, userId, mask) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new NotFoundError('Document');

  doc.isPIIMasked = mask;
  // Mask or unmask each field that contains PII
  doc.extractedFields = doc.extractedFields.map((f) => ({
    ...f.toObject(),
    isMasked: mask && (doc.piiFields || []).includes(f.key),
  }));

  await doc.save();
  await cacheDel(cacheKey);
  await cacheDel(`doc:${documentId}`);
  return doc;
};

// ── Correct a field (human review) ───────────────────────────────────────────
const correctField = async (documentId, userId, fieldKey, newValue) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new NotFoundError('Document');

  // Find the field and update it
  const field = doc.extractedFields.find((f) => f.key === fieldKey);
  if (!field) throw new NotFoundError('Field');

  const oldValue = field.value;
  field.value = newValue;
  field.confidence = 100; // human corrected = 100% confident
  field.isVerified = true;

  // Log the correction for audit trail
  doc.correctionLog.push({ field: fieldKey, oldValue, newValue });
  doc.status = 'completed'; // mark as complete after human review
  await doc.save();

  await cacheDel(`doc:${documentId}`);
  await cacheDelPattern(`docs:${userId}:*`);
  return doc;
};

// ── Soft delete a document ────────────────────────────────────────────────────
const deleteDocument = async (documentId, userId) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new NotFoundError('Document');

  // Soft delete (don't actually remove from DB, just mark as deleted)
  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();

  // Delete from ImageKit in background (don't wait for it)
  if (doc.imageKit?.fileId) {
    deleteFromImageKit(doc.imageKit.fileId).catch((e) => {
      logger.warn('Could not delete image from ImageKit: ' + e.message);
    });
  }

  // Update user stats
  await User.findByIdAndUpdate(userId, {
    $inc: {
      'stats.totalDocuments': -1,
      'stats.storageUsed': -(doc.fileSize || 0),
    },
  });

  await cacheDel(`doc:${documentId}`);
  await cacheDelPattern(`docs:${userId}:*`);
  await cacheDelPattern(`analytics:${userId}`);
};

// ── Get analytics data for dashboard ─────────────────────────────────────────
const getUserAnalytics = async (userId) => {
  const cacheKey = `analytics:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Run all queries in parallel for speed
  const [totalDocs, completedDocs, failedDocs, needsReviewDocs, typeDist, langDist, recentDocs, avgConf] =
    await Promise.all([
      Document.countDocuments({ userId, isDeleted: false }),
      Document.countDocuments({ userId, status: 'completed', isDeleted: false }),
      Document.countDocuments({ userId, status: 'failed', isDeleted: false }),
      Document.countDocuments({ userId, status: 'needs_review', isDeleted: false }),

      // Group by document type
      Document.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Group by language
      Document.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        { $unwind: '$detectedLanguages' },
        { $group: { _id: '$detectedLanguages', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Recent 30 docs for activity chart
      Document.find({ userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('createdAt status confidenceScore documentType'),

      // Average confidence
      Document.aggregate([
        { $match: { userId: userObjectId, status: 'completed', isDeleted: false } },
        { $group: { _id: null, avg: { $avg: '$confidenceScore' } } },
      ]),
    ]);

  const result = {
    overview: {
      total: totalDocs,
      completed: completedDocs,
      failed: failedDocs,
      needsReview: needsReviewDocs,
      processing: Math.max(0, totalDocs - completedDocs - failedDocs - needsReviewDocs),
      avgConfidence: Math.round(avgConf[0]?.avg || 0),
    },
    documentTypes: typeDist,
    languages: langDist,
    recentActivity: recentDocs,
  };

  await cacheSet(cacheKey, result, 300); // cache 5 min
  return result;
};

module.exports = {
  createDocument,
  processDocumentById,
  getUserDocuments,
  getDocumentById,
  togglePIIMask,
  correctField,
  deleteDocument,
  getUserAnalytics,
};
