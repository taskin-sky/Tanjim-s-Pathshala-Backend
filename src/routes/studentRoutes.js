import express from 'express';
import { protectStudent } from '../middleware/auth.js';
import {
  studentLogin,
  getStudentProfile,
  updateStudentProfile,
  getMyClasses,
  joinClass,
  getClassDetails,
  submitReview,
  updateReview,
  getMyReviews,
} from '../controllers/studentController.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.post('/login', studentLogin);

// ========== PROTECTED ROUTES (Student Only) ==========
router.use(protectStudent);

// Profile management
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);

// Class management
router.get('/my-classes', protectStudent, getMyClasses);
router.get('/class/:id', protectStudent, getClassDetails);
router.post('/class/:id/join', protectStudent, joinClass);

// Review management
router.post('/reviews', protectStudent, submitReview);
router.put('/reviews/:id', protectStudent, updateReview);
router.get('/my-reviews', protectStudent, getMyReviews);

export default router;
