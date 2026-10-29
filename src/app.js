
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import connectDB from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import classRoutes from './routes/classRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import examRoutes from './routes/examRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// VERCEL / REVERSE PROXY
// ============================================

// Trust one immediate proxy only when running on Vercel.
// Do not use `app.set('trust proxy', true)` indiscriminately.
if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

// ============================================
// DATABASE
// ============================================

await connectDB();

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://schoolmanagementsystem-sigma-smoky.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const uniqueOrigins = [...new Set(allowedOrigins)];

console.log('Allowed origins:', uniqueOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header, such as server-to-server
      // requests, are allowed by this CORS middleware.
      if (!origin) {
        return callback(null, true);
      }

      if (uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost origins only during development.
      if (
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
  })
);

// ============================================
// RATE LIMITING
// ============================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    forwardedHeader: false,
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    forwardedHeader: false,
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', apiLimiter);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// FILE UPLOAD
// ============================================

// Keep this middleware if existing controllers use req.files
// from express-fileupload. Multer routes can use their own middleware.
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    abortOnLimit: true,
    createParentPath: false,
  })
);

// ============================================
// COMPRESSION
// ============================================

app.use(compression());

// ============================================
// LOGGING
// ============================================

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ============================================
// STATIC FILES
// ============================================

// Vercel's deployed filesystem is not persistent.
// Uploaded files should be stored in Cloudinary or another
// persistent storage service, not in this local directory.
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/reports', reportRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(errorHandler);

// ============================================
// LOCAL SERVER STARTUP
// ============================================

// Vercel imports the app as a serverless function.
// Only start a listening server outside Vercel.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
    console.log('CORS allowed origins:', uniqueOrigins);
  });

  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.once('SIGTERM', gracefulShutdown);
  process.once('SIGINT', gracefulShutdown);

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });
}

export default app;
