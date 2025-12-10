require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/repositories', require('./routes/repositories'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notes', require('./routes/notes'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    metadata: {
      error: err.message,
      stack: err.stack,
      path: req.path
    }
  });
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { metadata: { path: req.path, method: req.method } });
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    metadata: { port: PORT, environment: process.env.NODE_ENV }
  });
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
