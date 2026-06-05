// ─── Chat Controller ──────────────────────────────────────────────────────────
// Handles all chat session API routes

const ChatSession = require('../models/ChatSession');
const { chat } = require('../services/aiService');
const { sendSuccess, sendCreated } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');

// ── POST /api/v1/chat/sessions ────────────────────────────────────────────────
// Create a new chat session
const createSession = async (req, res, next) => {
  try {
    const { documentId, isGlobal = false, title } = req.body;

    const session = await ChatSession.create({
      userId: req.user._id,
      documentId: documentId || null,
      isGlobal,
      title: title || (isGlobal ? 'Global Chat' : 'Document Chat'),
    });

    return sendCreated(res, { session });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/chat/sessions ─────────────────────────────────────────────────
// Get all chat sessions for the logged-in user
const getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .select('-messages') // don't load all messages in list view
      .populate('documentId', 'title documentType');

    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/chat/sessions/:id ─────────────────────────────────────────────
// Get a single session with all messages
const getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title documentType imageKit');

    if (!session) throw new NotFoundError('Chat session');

    return sendSuccess(res, { session });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1/chat/sessions/:id/message ────────────────────────────────────
// Send a message and get AI response (non-streaming, works with Gemini)
const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Validate
    if (!message || !message.trim()) {
      throw new ValidationError('Message cannot be empty');
    }

    // Check session exists and belongs to user
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) throw new NotFoundError('Chat session');

    // Call Gemini AI to get a response
    const result = await chat(
      session._id,
      message.trim(),
      req.user._id,
      session.documentId || null
    );

    return sendSuccess(res, {
      message: result.message,
      sources: result.sources,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1/chat/sessions/:id ──────────────────────────────────────────
// Soft-delete a session
const deleteSession = async (req, res, next) => {
  try {
    await ChatSession.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isDeleted: true }
    );
    return sendSuccess(res, {}, 'Session deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  deleteSession,
};
