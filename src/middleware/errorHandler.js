/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain (after all routes).
 *
 * Catches:
 *  - Explicit next(err) calls from route handlers
 *  - Unhandled async errors (when using express-async-errors or try/catch)
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isDev = process.env.NODE_ENV === 'development';

  // Log the error server-side
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error(err);

  // Supabase / Postgres errors often have a `code` field
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(isDev && { stack: err.stack }), // Only expose stack trace in development
  });
};

/**
 * 404 handler — catches requests to undefined routes.
 * Must be registered AFTER all routes but BEFORE errorHandler.
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
};

module.exports = { errorHandler, notFound };
