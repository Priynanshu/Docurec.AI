const ChatSession = require('../models/ChatSession');
const { chat } = require('../services/aiService');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

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

const getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .select('-messages')
      .populate('documentId', 'title documentType');

    return sendSuccess(res, { sessions });
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('documentId', 'title documentType imageKit');

    if (!session) throw new ApiError(404, 'Chat session not found');

    return sendSuccess(res, { session });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      throw new ApiError(400, 'Message cannot be empty');
    }

    const session = await ChatSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) throw new ApiError(404, 'Chat session not found');

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
