// ─── AI Config: Google Gemini via LangChain ───────────────────────────────────
// Uses @langchain/google-genai as requested

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');

// Cache the client (Singleton)
let chatClient = null;

/**
 * Get a LangChain Gemini chat client
 */
const getAIClient = () => {
  if (!chatClient) {
    chatClient = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash', 
      apiKey: process.env.GEMINI_API_KEY,
      maxOutputTokens: 4096,
      temperature: 0.3,
    });
  }
  return chatClient;
};

/**
 * Simple helper: send a prompt string, get a text response back
 */
const generateText = async (prompt) => {
  try {
    const client = getAIClient();
    const { HumanMessage } = require('@langchain/core/messages');
    const response = await client.invoke([new HumanMessage(prompt)]);
    return response.content;
  } catch (error) {
    throw new Error(`Text Generation Error: ${error.message}`);
  }
};

/**
 * Send a chat with system instruction + user message
 */
const generateWithSystem = async (systemPrompt, userPrompt) => {
  try {
    const client = getAIClient();
    const { HumanMessage } = require('@langchain/core/messages');
    
    // Inject instructions into the message body to avoid field mismatch
    const combinedPrompt = `Instructions & Rules:\n${systemPrompt}\n\nUser Request:\n${userPrompt}`;
    
    const response = await client.invoke([new HumanMessage(combinedPrompt)]);
    return response.content;
  } catch (error) {
    throw new Error(`System Prompt Execution Error: ${error.message}`);
  }
};

/**
 * Send a full conversation history to Gemini
 */
const generateWithHistory = async (systemPrompt, messageHistory) => {
  try {
    const client = getAIClient();
    const { HumanMessage, AIMessage } = require('@langchain/core/messages');

    const messages = [];

    // Map message nodes securely
    messageHistory.forEach((msg, index) => {
      if (msg.role === 'user') {
        if (index === 0 || messages.length === 0) {
          // Injection fix to prevent systemInstruction parameter failures
          messages.push(new HumanMessage(`System Context & Rules:\n${systemPrompt}\n\nUser Message:\n${msg.content}`));
        } else {
          messages.push(new HumanMessage(msg.content));
        }
      } else if (msg.role === 'assistant' || msg.role === 'model') {
        messages.push(new AIMessage(msg.content));
      }
    });

    if (messages.length === 0) {
      messages.push(new HumanMessage(`System Context:\n${systemPrompt}`));
    }

    const response = await client.invoke(messages);
    return response.content;
  } catch (error) {
    throw new Error(`History Context Execution Error: ${error.message}`);
  }
};

module.exports = { getAIClient, generateText, generateWithSystem, generateWithHistory };