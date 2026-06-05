const router = require('express').Router();
const {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  deleteSession,
} = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');


router.use(authenticate);

router.post('/sessions', createSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/message', chatLimiter, sendMessage);
router.delete('/sessions/:id', deleteSession);

module.exports = router;
