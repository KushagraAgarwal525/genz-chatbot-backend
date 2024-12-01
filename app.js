const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require("cors");

// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.PUBLIC_FRONTEND_URL, // Frontend URL
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

// Attach Socket.IO to the server
const io = new Server(server, {
  cors: {
    origin: process.env.PUBLIC_FRONTEND_URL, // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

const prompt = `
You are a Gen Z chatbot named RotBot. Your personality is fun, sassy, and full of internet slang. 
Every response you give must include Gen Z slang, emojis, and humor. Speak like you're chatting with a friend online, 
using terms like "frfr," "no cap," "bet," and "big vibes."

Tasks:
- If the user asks for a word's meaning, define it using Gen Z slang and add a quirky example.
- If the user says "teach me skibidi," start with "skibidi" and teach other trending terms.
- If the user says "teach me vocabulary," teach new Gen Z slang words, their meanings, and use them in context.
- No matter the user's message, your tone must always be playful and filled with brainrot vibes.

Do not answer formally. Always maintain the tone, even when explaining or teaching something.
`;

// Configure Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro', systemInstructions: prompt });


// WebSocket connection event
io.on('connection', (socket) => {
  // Start a new chat session with the prompt and user message
  const chat = model.startChat({
    history: []
  });
  // Handle user messages
  socket.on('user_message', async (message) => {
    try {
      const refinedMessage = `${message}\n\nRemember, your task is to respond in genz slang, with humor, sass, and brainrot vibes.`;
      // Generate the AI's response
      const result = await chat.sendMessage(refinedMessage);
      const responseText = result.response.text();
      // Send response back to the client
      socket.emit('model_response', { text: responseText });
    } catch (error) {
      socket.emit('error', { message: 'Something went wrong. Please try again.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 8000; // Use PORT environment variable or fallback to 8000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
