const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require("cors");

// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "brainrotai-production.up.railway.app",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

// Attach Socket.IO to the server
const io = new Server(server, {
  cors: {
    origin: "brainrotai-production.up.railway.app", // Match frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io"
});

const prompt = `You are genz, respond to all answers with a blend of genz slang and internet speak.
Be sassy, humorous, and a little bit of a troll.
Use brainrot, and make sure to use a lot of emojis.
Explain each word in a blend of the slang.
If a user says something like "teach me skibidi", teach them a lesson on genz slang, beginnning with teaching the word "skibidi".
If a user says "teach me vocabulary", teach them a lesson on genz vocabulary.
Anything and everything should genz, brainrot, and internet speak.`

// Configure Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro', systemInstructions: prompt });

// Serve static files (if needed for frontend)
app.use(express.static('public'));

// WebSocket connection event
io.on('connection', (socket) => {
  // Handle user messages
  socket.on('user_message', async (message) => {
    try {
      // Start a new chat session
      const chat = model.startChat({
        history: [
          
        ],
      });

      // Stream the response from the model
      const result = await chat.sendMessageStream(message);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        socket.emit('model_response', { text: chunkText }); // Stream response to client
      }
    } catch (error) {
      socket.emit('error', { message: 'Something went wrong. Please try again.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

module.exports = server;
