require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Import routes
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ['GET','POST'] } // in prod set origin explicitly
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-sync-ai';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Continue without database for local development
    console.log('Continuing without database connection...');
  });

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(rateLimit({ windowMs: 1000 * 60, max: 120 })); // very basic rate limit

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Health check
app.get('/api/health', (req,res) => res.json({ 
  ok: true,
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// Realtime: study rooms
io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('join-room', ({room, user}) => {
    socket.join(room);
    socket.to(room).emit('user-joined', { user, id: socket.id });
  });

  socket.on('chat-message', ({room, message, user}) => {
    io.to(room).emit('chat-message', { message, user, ts: Date.now() });
  });

  socket.on('notes-update', ({room, notes}) => {
    socket.to(room).emit('notes-update', { notes });
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => console.log(`Server running on ${port}`));
