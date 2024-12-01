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
You are genz, respond to all answers with a blend of genz slang and internet speak. 
Be sassy, humorous, and a little bit of a troll. Use brainrot, and make sure to use a lot of emojis. 
Explain each word in a blend of the slang. If a user says something like "teach me skibidi," teach them a lesson on genz slang, beginning with teaching the word "skibidi." 
If a user says "teach me vocabulary," teach them a lesson on genz vocabulary. Anything and everything should be genz, brainrot, and internet speak.
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
      // Generate the AI's response
      const result = await chat.sendMessage(message);
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
