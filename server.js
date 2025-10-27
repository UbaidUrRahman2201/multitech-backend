const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ✅ CORS Setup (Supports production, preview, and local) */
const allowedOrigins = [
  'https://multitech-frontend.vercel.app', // main production
  'http://localhost:3000' // local testing
];

// Allow all Vercel preview URLs dynamically
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow mobile/postman
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/multitech-frontend-[a-z0-9-]+\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ✅ MongoDB Connection */
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

/* ✅ Socket.io Setup */
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/multitech-frontend-[a-z0-9-]+\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`📡 User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

app.set('io', io);

/* ✅ API Routes */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));

/* ✅ Test Route */
app.get('/', (req, res) => {
  res.json({ message: '🚀 MultiTechWorld API Running on Vercel' });
});

/* ✅ Export for Vercel */
module.exports = app;

/* ✅ Local Development */
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}
