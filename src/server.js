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
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/owner', ownerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/public', publicRoutes);

// Test route
app.get('/', (req, res) => {
  res.send("✅ Tanjim's Pathshala API is running...");
});

connectDB();

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
