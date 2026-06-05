const router = require('express').Router();
const {
  upload, batchUpload, getDocuments, getDocument,
  maskPII, correctDocumentField, deleteDoc, analytics,
  translate, compare, statusStream,
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { uploadSingle, uploadBatch } = require('../middleware/upload');
const { documentIdRule, paginationRules, validate } = require('../middleware/validators');

// All routes require authentication
router.use(authenticate);

router.get('/analytics', analytics);
router.get('/', apiLimiter, paginationRules, validate, getDocuments);
router.post('/upload', uploadLimiter, uploadSingle, upload);
router.post('/batch-upload', uploadLimiter, uploadBatch, batchUpload);
router.post('/compare', compare);

router.get('/:id', documentIdRule, validate, getDocument);
router.get('/:id/status', documentIdRule, validate, statusStream);
router.post('/:id/mask-pii', documentIdRule, validate, maskPII);
router.patch('/:id/correct', documentIdRule, validate, correctDocumentField);
router.post('/:id/translate', documentIdRule, validate, translate);
router.delete('/:id', documentIdRule, validate, deleteDoc);

module.exports = router;
