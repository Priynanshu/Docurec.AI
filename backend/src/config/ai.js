


const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');


let chatClient = null;


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


const generateWithSystem = async (systemPrompt, userPrompt) => {
  try {
    const client = getAIClient();
    const { HumanMessage } = require('@langchain/core/messages');


    const combinedPrompt = `Instructions & Rules:\n${systemPrompt}\n\nUser Request:\n${userPrompt}`;

    const response = await client.invoke([new HumanMessage(combinedPrompt)]);
    return response.content;
  } catch (error) {
    throw new Error(`System Prompt Execution Error: ${error.message}`);
  }
};


const generateWithHistory = async (systemPrompt, messageHistory) => {
  try {
    const client = getAIClient();
    const { HumanMessage, AIMessage } = require('@langchain/core/messages');

    const messages = [];


    messageHistory.forEach((msg, index) => {
      if (msg.role === 'user') {
        if (index === 0 || messages.length === 0) {

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