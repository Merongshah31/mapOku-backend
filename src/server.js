const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║        🗺️  Mapoku Backend API          ║
  ║                                       ║
  ║  Server : http://localhost:${PORT}        ║
  ║  Env    : ${(process.env.NODE_ENV || 'development').padEnd(29)}║
  ║  Health : http://localhost:${PORT}/health ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;
