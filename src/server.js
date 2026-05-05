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

// Middleware
// CORS configuration - Allow frontend
// CORS configuration - PRODUCTION
const allowedOrigins = [
  'http://localhost:5173',
  'https://tanjim-s-pathshala-frontend.vercel.app/',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: [
//       'https://tanjim-s-pathshala-frontend.vercel.app/',
//       'https://tanjim-s-pathshala-backend.vercel.app/',
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );
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
});
