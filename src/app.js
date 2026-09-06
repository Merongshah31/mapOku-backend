require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const usersRouter = require('./routes/users.routes');
const rewardsRouter = require('./routes/rewards.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ──────────────────────────────────────────────────
// Security & Parsing Middleware
// ──────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mapoku-backend',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ──────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/rewards', rewardsRouter);

// ──────────────────────────────────────────────────
// Error Handling (must be last)
// ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
