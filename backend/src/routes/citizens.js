const router = require('express').Router();
const {
  create, getAll, getOne, update, remove, getDocuments,
} = require('../controllers/citizenController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All citizen routes require the operator to be logged in
router.use(authenticate);

router.get('/', apiLimiter, getAll);
router.post('/', apiLimiter, create);

router.get('/:id', getOne);
router.patch('/:id', update);
router.delete('/:id', remove);

// Documents belonging to a specific citizen
router.get('/:id/documents', apiLimiter, getDocuments);

module.exports = router;
