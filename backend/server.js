require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { seedIfEmpty } = require('./seed');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');
const analysisRoutes = require('./routes/analysis');

seedIfEmpty();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});

// Every report photo/video is a base64 data URL, so bump the JSON body limit
// well past Express's 100kb default.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '15mb' }));

// Route handlers reach the socket server via req.app.get('io') so a new
// report or status change can be pushed to every connected client the
// instant it's written to the DB — no polling needed.
app.set('io', io);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analysis', analysisRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Seer Bharat backend running on http://localhost:${PORT}`);
});
