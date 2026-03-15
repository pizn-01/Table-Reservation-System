import { env } from './config/env';
import app from './app';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Table Reservation System — API Server          ║
║──────────────────────────────────────────────────║
║   Environment : ${env.NODE_ENV.padEnd(30)}  ║
║   Port        : ${String(PORT).padEnd(30)}  ║
║   Health      : http://localhost:${PORT}/health${' '.repeat(Math.max(0, 14 - String(PORT).length))}  ║
║   API Base    : http://localhost:${PORT}/api/v1${' '.repeat(Math.max(0, 11 - String(PORT).length))}  ║
╚══════════════════════════════════════════════════╝
  `);
});
