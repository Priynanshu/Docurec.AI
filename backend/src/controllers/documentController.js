const {
  createDocument,
  processDocumentById,
  getUserDocuments,
  getDocumentById,
  togglePIIMask,
  correctField,
  deleteDocument,
  getUserAnalytics,
} = require('../services/documentService');
const { translateDocument, compareDocuments } = require('../services/aiService');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * POST /api/v1/documents/upload
 * Single document upload
 */
const upload = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');

    const doc = await createDocument(
      req.user._id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    // Process asynchronously (in production this would be a queue job)
    processDocumentById(doc._id.toString(), req.file.buffer).catch((e) =>
      logger.error(`Background OCR failed for doc ${doc._id}: ${e.message}`)
    );

    return sendCreated(res, { document: doc }, 'Document uploaded and processing started');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/documents/batch-upload
 * Batch upload (up to 50 files)
 */
const batchUpload = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) throw new ValidationError('No files uploaded');

    const results = await Promise.allSettled(
      req.files.map(async (file) => {
        const doc = await createDocument(
          req.user._id,
          file.buffer,
          file.originalname,
          file.mimetype,
          file.size
        );
        processDocumentById(doc._id.toString(), file.buffer).catch((e) =>
          logger.error(`Background OCR failed for doc ${doc._id}: ${e.message}`)
        );
        return doc;
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);

    return sendCreated(res, {
      uploaded: succeeded.length,
      failed: failed.length,
      documents: succeeded,
      errors: failed,
    }, `${succeeded.length} documents uploaded, ${failed.length} failed`);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/documents
 */
const getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status, type, language, search, sort } = req.query;
    const result = await getUserDocuments(req.user._id, {
      page: parseInt(page), limit: parseInt(limit),
      status, type, language, search, sort,
    });
    return sendPaginated(res, result.docs, result.total, page, limit);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/documents/:id
 */
const getDocument = async (req, res, next) => {
  try {
    const doc = await getDocumentById(req.params.id, req.user._id);
    return sendSuccess(res, { document: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/documents/:id/mask-pii
 */
const maskPII = async (req, res, next) => {
  try {
    const { mask = true } = req.body;
    const doc = await togglePIIMask(req.params.id, req.user._id, mask);
    return sendSuccess(res, { document: doc }, mask ? 'PII masked' : 'PII unmasked');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/documents/:id/correct
 */
const correctDocumentField = async (req, res, next) => {
  try {
    const { field, value } = req.body;
    if (!field || value === undefined) throw new ValidationError('field and value are required');
    const doc = await correctField(req.params.id, req.user._id, field, value);
    return sendSuccess(res, { document: doc }, 'Field corrected');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/documents/:id
 */
const deleteDoc = async (req, res, next) => {
  try {
    await deleteDocument(req.params.id, req.user._id);
    return sendSuccess(res, {}, 'Document deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/documents/analytics
 */
const analytics = async (req, res, next) => {
  try {
    const data = await getUserAnalytics(req.user._id.toString());
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/documents/:id/translate
 */
const translate = async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!language) throw new ValidationError('language is required');
    const translatedText = await translateDocument(req.params.id, language);
    return sendSuccess(res, { translatedText, language });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/documents/compare
 */
const compare = async (req, res, next) => {
  try {
    const { docId1, docId2 } = req.body;
    if (!docId1 || !docId2) throw new ValidationError('Both docId1 and docId2 are required');
    const diff = await compareDocuments(docId1, docId2, req.user._id);
    return sendSuccess(res, { diff });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/documents/:id/status  (SSE for real-time processing status)
 */
const statusStream = async (req, res, next) => {
  try {
    const Document = require('../models/Document');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const poll = setInterval(async () => {
      try {
        const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id })
          .select('status confidenceScore healthScore processingError');
        if (!doc) { clearInterval(poll); return res.end(); }

        sendEvent({ status: doc.status, confidence: doc.confidenceScore, health: doc.healthScore, error: doc.processingError });

        if (['completed', 'failed', 'needs_review'].includes(doc.status)) {
          clearInterval(poll);
          res.end();
        }
      } catch { clearInterval(poll); res.end(); }
    }, 1500);

    req.on('close', () => clearInterval(poll));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload, batchUpload, getDocuments, getDocument,
  maskPII, correctDocumentField, deleteDoc, analytics,
  translate, compare, statusStream,
};
