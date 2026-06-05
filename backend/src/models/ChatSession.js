const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sources: [{ documentId: mongoose.Schema.Types.ObjectId, title: String, excerpt: String }],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, default: 'New Chat' },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },

    isGlobal: { type: Boolean, default: false },
    messages: [messageSchema],
    lastMessageAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
