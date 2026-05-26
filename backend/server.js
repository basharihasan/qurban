require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { setupSocket } = require('./src/socket/socketHandler');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users');
const animalsRoutes = require('./src/routes/animals');
const mudhohiRoutes = require('./src/routes/mudhohi');
const distributionsRoutes = require('./src/routes/distributions');
const reportsRoutes = require('./src/routes/reports');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// ─── Trust proxy (required for rate-limiting behind Render / Nginx) ────────
// Render sits behind a load balancer so X-Forwarded-For must be trusted
app.set('trust proxy', 1);

// ─── Allowed CORS origins ──────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Allow any Vercel preview deployments for this project
  ...(process.env.VERCEL_PROJECT ? [`https://${process.env.VERCEL_PROJECT}.vercel.app`] : []),
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─── Socket.IO ─────────────────────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions });
setupSocket(io);
app.set('io', io);

// ─── Core middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // CSP handled by Vercel on frontend
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ─── Static files (uploads) ────────────────────────────────────────────────
// NOTE: On Render free tier, uploads are ephemeral. Use Cloudinary in production.
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/animals', animalsRoutes);
app.use('/api/mudhohi', mudhohiRoutes);
app.use('/api/distributions', distributionsRoutes);
app.use('/api/reports', reportsRoutes);

// ─── Health check (used by Render to verify service is up) ─────────────────
app.get('/api/health', async (req, res) => {
  const db = require('./src/config/db');
  let dbStatus = 'unknown';
  let dbLatency = null;

  try {
    const start = Date.now();
    await db.raw('SELECT 1');
    dbLatency = Date.now() - start;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const status = dbStatus === 'connected' ? 200 : 503;
  res.status(status).json({
    success: dbStatus === 'connected',
    service: 'Qurban Monitoring System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: { status: dbStatus, latency_ms: dbLatency },
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Root route (for quick verification)
app.get('/', (req, res) => {
  res.json({ success: true, message: '🌙 Qurban Monitoring System API', docs: '/api/health' });
});

// ─── Error handlers ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🌙 ================================');
  console.log('🌙  Qurban Monitoring System API');
  console.log(`🌙  Port   : ${PORT}`);
  console.log(`🌙  Mode   : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌙  DB URL : ${process.env.DATABASE_URL ? '✓ set' : '✗ not set (using local)'}`);
  console.log('🌙 ================================');
  console.log('');
});

module.exports = { app, server, io };
