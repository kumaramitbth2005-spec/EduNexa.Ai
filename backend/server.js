require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Pre-register Mongoose models to prevent MissingSchemaError
require('./models/User');
require('./models/Course');
require('./models/Subject');
require('./models/Lesson');
require('./models/Enrollment');
require('./models/Exam');
require('./models/Result');
require('./models/StudyMaterial');
require('./models/Notification');
require('./models/Document');
require('./models/Syllabus');
require('./models/AnalysisReport');
require('./models/StudyTask');
require('./models/SavedNote');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const examRoutes = require('./routes/exams');
const aiRoutes = require('./routes/ai');
const materialRoutes = require('./routes/materials');
const communityRoutes = require('./routes/community');
const notificationRoutes = require('./routes/notifications');
const documentRoutes = require('./routes/documents');
const syllabiRoutes = require('./routes/syllabi');
const plannerRoutes = require('./routes/planner');
const notesRoutes = require('./routes/notes');
const subjectNotesRoutes = require('./routes/subjectNotes');
const dsaRoutes = require('./routes/dsa');

const app = express();
const server = http.createServer(app);

// ── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('message:send', async (data) => {
    const { conversationId, recipientId, message } = data;
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      io.to(recipientSocket).emit('message:receive', { conversationId, message });
    }
  });

  socket.on('typing:start', ({ conversationId, recipientId }) => {
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) io.to(recipientSocket).emit('typing:start', { conversationId, userId: socket.userId });
  });

  socket.on('typing:stop', ({ conversationId, recipientId }) => {
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) io.to(recipientSocket).emit('typing:stop', { conversationId });
  });

  socket.on('room:join', (roomId) => socket.join(roomId));
  socket.on('room:message', (data) => {
    io.to(data.roomId).emit('room:message', data);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible in routes
app.set('io', io);

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts.' },
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for local uploads fallback
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NoSQL injection prevention
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduNexa API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    aiConfigured: !!process.env.GEMINI_API_KEY,
    emailConfigured: !!process.env.EMAIL_USER,
    storageConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/syllabi', syllabiRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/subject-notes', subjectNotesRoutes);
app.use('/api/dsa', dsaRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 EduNexa Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI (Gemini): ${process.env.GEMINI_API_KEY ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`📁 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️  Not configured'}\n`);
});

module.exports = { app, server, io };

