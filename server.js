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

// ✅ CORS setup (Fixed)
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://multitech-frontend.vercel.app',
      'http://localhost:3000'
    ];

    // Allow all Vercel preview URLs dynamically
    if (origin && (
      allowedOrigins.includes(origin) ||
      /^https:\/\/multitech-frontend-[a-z0-9-]+\.vercel\.app$/.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


// ✅ Allow preflight requests
app.options('*', cors());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Connect MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// ✅ Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      "https://multitech-frontend.vercel.app",
      "https://multitech-frontend-1gxsyctc9-ubaidurrahman2201s-projects.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
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

// ✅ API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));

// ✅ Test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 MultiTechWorld API Running on Vercel' });
});

// ✅ Export app for Vercel
module.exports = app;

// ✅ Run locally only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}
