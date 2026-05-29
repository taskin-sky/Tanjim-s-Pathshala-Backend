import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import ownerRoutes from './routes/ownerRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// CORS configuration - PRODUCTION READY
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://tanjim-s-pathshala-frontend.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        if (origin.match(/https:\/\/.*\.vercel\.app$/)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(cookieParser());

connectDB();

// Routes
app.use('/api/owner', ownerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);

// Test route
app.get('/', (req, res) => {
  res.send("✅ Tanjim's Pathshala API is running...");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for:`, allowedOrigins);
});
