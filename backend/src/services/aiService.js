// ─── AI Service (Chat + Translate + Compare) ──────────────────────────────────
// Uses Google Gemini via @langchain/google-genai

const { generateText, generateWithHistory, generateWithSystem } = require('../config/ai');
const Document    = require('../models/Document');
const ChatSession = require('../models/ChatSession');
const { AIError } = require('../utils/errors');
const logger      = require('../utils/logger');

// ── Helper: Get user's relevant documents as context for AI chat ──────────────
const getDocumentContext = async (userId, query, documentId = null) => {
  let docs;

  if (documentId) {
    docs = await Document.find({
      _id: documentId, userId, status: { $in: ['completed', 'needs_review'] }, isDeleted: false,
    }).select('title documentType extractedText extractedFields detectedLanguages confidenceScore');
  } else {
    try {
      docs = await Document.find(
        { userId, status: { $in: ['completed', 'needs_review'] }, isDeleted: false, $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('title documentType extractedText extractedFields detectedLanguages confidenceScore');
    } catch (e) {
      docs = [];
    }

    if (!docs.length) {
      docs = await Document.find({ userId, status: { $in: ['completed', 'needs_review'] }, isDeleted: false })
        .sort({ createdAt: -1 })
        .select('title documentType extractedText extractedFields detectedLanguages confidenceScore');
    }

    if (!docs.length) {
      docs = await Document.find({ userId, status: { $in: ['completed', 'needs_review'] }, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('title documentType extractedText extractedFields detectedLanguages confidenceScore');
    }
  }

  return docs.map((doc) => ({
    id:         doc._id.toString(),
    title:      doc.title || doc.documentType || 'Document',
    type:       doc.documentType,
    text:       (doc.extractedText || '').substring(0, 1500), 
    fields:     (doc.extractedFields || []).slice(0, 15),
    languages:  doc.detectedLanguages || [],
    confidence: doc.confidenceScore || 0,
  }));
};

// ── Helper: Format docs into readable text for the AI prompt ─────────────────
const buildContextString = (docs) => {
  if (!docs.length) {
    return 'The user has no processed documents in their library yet.';
  }
  return docs.map((doc, i) =>
    `[Document ${i + 1}: "${doc.title}" (${doc.type})]\n` +
    `Text: ${doc.text}\n` +
    `Fields: ${doc.fields.map((f) => `${f.key}: ${f.value}`).join(', ')}`
  ).join('\n\n---\n\n');
};

// ── Chat: Send a message, get AI response using conversation history ───────────
const chat = async (sessionId, userMessage, userId, documentId = null) => {
  const session = await ChatSession.findOne({ _id: sessionId, userId });
  if (!session) throw new AIError('Chat session not found');

  const docs = await getDocumentContext(userId, userMessage, documentId);
  const contextString = buildContextString(docs);

  const systemPrompt = `You are DocuRec AI — a helpful assistant that answers questions about Indian government and legal documents.

RULES:
- Answer only from the document information provided below
- If you cannot find the answer in the documents, say so clearly
- Be precise and mention which document the info comes from
- Support both Hindi and English questions — reply in the same language the user uses
- For private info (Aadhaar number, PAN), remind user to use the PII masking feature

USER'S DOCUMENTS:
${contextString}`;

  // Keep last 8 messages for memory context optimization
  const recentHistory = session.messages.slice(-8);
  const messageHistory = [
    ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const assistantReply = await generateWithHistory(systemPrompt, messageHistory);

    // Push inputs and results directly into the database schema
    session.messages.push({ role: 'user', content: userMessage });
    session.messages.push({
      role:    'assistant',
      content: assistantReply,
      sources: docs.map((d) => ({ documentId: d.id, title: d.title })),
    });
    session.lastMessageAt = new Date();

    if (session.messages.length === 2) {
      session.title = userMessage.substring(0, 55) + (userMessage.length > 55 ? '...' : '');
    }

    await session.save();

    return { message: assistantReply, sources: docs };
  } catch (error) {
    logger.error('Gemini chat error: ' + error.message);
    throw new AIError('Chat failed: ' + error.message);
  }
};

// ── Translate document text to another language ───────────────────────────────
const translateDocument = async (documentId, targetLanguage) => {
  const doc = await Document.findById(documentId).select('extractedText documentType title');
  if (!doc) throw new Error('Document not found');
  if (!doc.extractedText) throw new Error('No text to translate');

  const prompt = `Translate this Indian document text to ${targetLanguage}.
Keep the same structure and meaning.
Return ONLY the translated text, nothing else.

Text to translate:
${doc.extractedText}`;

  return await generateText(prompt);
};

// ── Compare two documents and return differences ──────────────────────────────
const compareDocuments = async (docId1, docId2, userId) => {
  const [doc1, doc2] = await Promise.all([
    Document.findOne({ _id: docId1, userId }).select('title extractedText extractedFields documentType'),
    Document.findOne({ _id: docId2, userId }).select('title extractedText extractedFields documentType'),
  ]);

  if (!doc1 || !doc2) throw new Error('One or both documents not found');

  const prompt = `Compare these two Indian documents and find differences.

Document 1 - "${doc1.title || 'Document 1'}" (${doc1.documentType}):
Fields: ${JSON.stringify(doc1.extractedFields || [])}

Document 2 - "${doc2.title || 'Document 2'}" (${doc2.documentType}):
Fields: ${JSON.stringify(doc2.extractedFields || [])}

Return ONLY valid JSON in this exact format (no extra text):
{
  "added":   ["field names only in document 2"],
  "removed": ["field names only in document 1"],
  "changed": [
    { "field": "field_name", "oldValue": "value in doc1", "newValue": "value in doc2" }
  ],
  "summary": "One sentence summary of what changed"
}`;

  try {
    const rawResponse = await generateText(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    logger.error('Compare documents failed: ' + error.message);
    throw new AIError('Document comparison failed. Please try again.');
  }
};

module.exports = { chat, translateDocument, compareDocuments, getDocumentContext };