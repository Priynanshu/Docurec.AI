const Document = require('../models/Document');
const User = require('../models/User');
const { uploadToImageKit, deleteFromImageKit } = require('../config/imagekit');
const { processDocument } = require('./ocrService');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const createDocument = async (userId, fileBuffer, originalName, mimeType, fileSize) => {
  const ikResult = await uploadToImageKit(fileBuffer, originalName, `/docurec/${userId}`);

  const doc = await Document.create({
    userId,
    originalFileName: originalName,
    title: originalName.replace(/\.[^.]+$/, ''),
    imageKit: {
      fileId: ikResult.fileId,
      url: ikResult.url,
      thumbnailUrl: ikResult.thumbnailUrl,
      originalUrl: ikResult.url,
    },
    mimeType,
    fileSize,
    status: 'queued',
  });

  await User.findByIdAndUpdate(userId, {
    $inc: { 'stats.totalDocuments': 1, 'stats.storageUsed': fileSize },
  });

  await cacheDelPattern(`docs:${userId}:*`);

  return doc;
};

const processDocumentById = async (documentId, fileBuffer) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new ApiError(404, 'Document not found');

  doc.status = 'processing';
  await doc.save();

  try {
    const result = await processDocument(fileBuffer, doc.mimeType);

    const extractedFields = (result.extractedFields || []).map((f) => ({
      key: f.key,
      value: f.value,
      confidence: f.confidence || 80,
      isPII: f.isPII || false,
      isMasked: false,
    }));

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

    doc.status = (result.confidenceScore || 60) < 35 ? 'needs_review' : 'completed';

    await doc.save();

    await User.findByIdAndUpdate(doc.userId, {
      $inc: { 'stats.totalProcessed': 1 },
    });

    await cacheSet(`doc:${documentId}`, doc.toJSON(), 3600);
    await cacheDelPattern(`docs:${doc.userId}:*`);
    await cacheDelPattern(`analytics:${doc.userId}`);

    return doc;

  } catch (error) {
    doc.status = 'failed';
    doc.processingError = error.message;
    await doc.save();
  }
};

const getUserDocuments = async (userId, options = {}) => {
  const { page = 1, limit = 12, status, type, language, search, sort = '-createdAt' } = options;

  const cacheKey = `docs:${userId}:${JSON.stringify(options)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const query = { userId, isDeleted: false };
  if (status) query.status = status;
  if (type) query.documentType = type;
  if (language) query.detectedLanguages = language;
  if (search) {
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
      .select('-rawOcrText -structuredContent'),
    Document.countDocuments(query),
  ]);

  const result = { docs, total, page: parseInt(page), limit: parseInt(limit) };
  await cacheSet(cacheKey, result, 300);
  return result;
};

const getDocumentById = async (documentId, userId) => {
  const cacheKey = `doc:${documentId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    if (String(cached.userId) !== String(userId)) throw new ApiError(403, 'Forbidden');
    return cached;
  }

  const doc = await Document.findOne({ _id: documentId, isDeleted: false });
  if (!doc) throw new ApiError(404, 'Document not found');
  if (String(doc.userId) !== String(userId)) throw new ApiError(403, 'Forbidden');

  await cacheSet(cacheKey, doc.toJSON(), 3600);
  return doc;
};

const togglePIIMask = async (documentId, userId, mask) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new ApiError(404, 'Document not found');

  doc.isPIIMasked = mask;
  doc.extractedFields = doc.extractedFields.map((f) => ({
    ...f.toObject(),
    isMasked: mask && (doc.piiFields || []).includes(f.key),
  }));

  await doc.save();
  await cacheDel(`doc:${documentId}`);
  return doc;
};

const correctField = async (documentId, userId, fieldKey, newValue) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new ApiError(404, 'Document not found');

  const field = doc.extractedFields.find((f) => f.key === fieldKey);
  if (!field) throw new ApiError(404, 'Field not found');

  const oldValue = field.value;
  field.value = newValue;
  field.confidence = 100;
  field.isVerified = true;

  doc.correctionLog.push({ field: fieldKey, oldValue, newValue });
  doc.status = 'completed';
  await doc.save();

  await cacheDel(`doc:${documentId}`);
  await cacheDelPattern(`docs:${userId}:*`);
  return doc;
};

const deleteDocument = async (documentId, userId) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw new ApiError(404, 'Document not found');

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  await doc.save();

  if (doc.imageKit?.fileId) {
    deleteFromImageKit(doc.imageKit.fileId).catch(() => {});
  }

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

const getUserAnalytics = async (userId) => {
  const cacheKey = `analytics:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [totalDocs, completedDocs, failedDocs, needsReviewDocs, typeDist, langDist, recentDocs, avgConf] =
    await Promise.all([
      Document.countDocuments({ userId, isDeleted: false }),
      Document.countDocuments({ userId, status: 'completed', isDeleted: false }),
      Document.countDocuments({ userId, status: 'failed', isDeleted: false }),
      Document.countDocuments({ userId, status: 'needs_review', isDeleted: false }),

      Document.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Document.aggregate([
        { $match: { userId: userObjectId, isDeleted: false } },
        { $unwind: '$detectedLanguages' },
        { $group: { _id: '$detectedLanguages', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Document.find({ userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('createdAt status confidenceScore documentType'),

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

  await cacheSet(cacheKey, result, 300);
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
