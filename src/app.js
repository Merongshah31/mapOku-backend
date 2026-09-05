require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerUiDist = require('swagger-ui-dist');
const path = require('path');

const routesRouter   = require('./routes/routes.routes');
const obstaclesRouter = require('./routes/obstacles.routes');
const usersRouter    = require('./routes/users.routes');
const swaggerSpec = require('./config/swagger');
const reportsRouter  = require('./routes/reports.routes');
const weatherRouter = require('./routes/weather.routes');
const aiRouter = require('./routes/ai.routes');
const voiceRouter = require('./routes/voice.routes');
const moderationRouter = require('./routes/moderation.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Security & Parsing Middleware
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// JSON body parser (not used for multipart â€” Multer handles that)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint for a quick browser smoke test
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'mapoku-backend',
    status: 'ok',
    documentation: '/api-docs',
    health: '/health',
  });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Health Check
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mapoku-backend',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Interactive OpenAPI documentation
app.use('/api-docs', express.static(swaggerUiDist.getAbsoluteFSPath(), { index: false }));
app.get('/api-docs/swagger-ui.css', (req, res) => {
  res.type('text/css').sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), 'swagger-ui.css'));
});
app.get('/api-docs/swagger-ui-bundle.js', (req, res) => {
  res.type('application/javascript').sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), 'swagger-ui-bundle.js'));
});
app.get('/api-docs/swagger-ui-standalone-preset.js', (req, res) => {
  res.type('application/javascript').sendFile(path.join(swaggerUiDist.getAbsoluteFSPath(), 'swagger-ui-standalone-preset.js'));
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Mapoku API Documentation',
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// API Routes
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/api/v1/routes',    routesRouter);
app.use('/api/v1/obstacles', obstaclesRouter);
app.use('/api/v1/users',     usersRouter);
app.use('/api/v1/reports',   reportsRouter);
app.use('/api/v1/weather',   weatherRouter);
app.use('/api/v1/ai',        aiRouter);
app.use('/api/v1/voice',     voiceRouter);
app.use('/api/v1/moderation', moderationRouter);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Error Handling (must be last)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use(notFound);
app.use(errorHandler);

module.exports = app;
