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

// ✅ Update CORS for production
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://multitech-frontend.vercel.app" // change to your actual frontend vercel domain
  ],
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Connect MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ✅ Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://multitech-frontend.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
  mongoose.connect(process.env.MONGODB_URI)
});

// ✅ Export app (required by Vercel)
module.exports = app;

// ✅ If running locally, start the server manually
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

