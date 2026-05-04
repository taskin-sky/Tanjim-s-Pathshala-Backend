import express from 'express';
import { protectOwner } from '../middleware/auth.js';
import {
  ownerLogin,
  ownerLogout,
  getOwnerProfile,
  updateOwnerProfile,
  updatePassword,
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  resetStudentPasskey,
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getStudentReviews,
  approveReview,
  getDashboardStats,
  getAllContacts,
  getContactById,
  markAsReplied,
  deleteContact,
} from '../controllers/ownerController.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.post('/login', ownerLogin);
router.post('/logout', protectOwner, ownerLogout);

// ========== PROTECTED ROUTES (Owner Only) ==========
router.use(protectOwner);

// Profile management
router.get('/profile', getOwnerProfile);
router.put('/profile', updateOwnerProfile);
router.put('/change-password', updatePassword);

// Student management
router.post('/students', createStudent);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/:id/reset-passkey', resetStudentPasskey);

// Class management
router.post('/classes', createClass);
router.get('/classes', getAllClasses);
router.get('/classes/:id', getClassById);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// Review management
router.get('/reviews', getStudentReviews);
router.put('/reviews/:id/approve', approveReview);

// Contact management
router.get('/contacts', protectOwner, getAllContacts);
router.get('/contacts/:id', protectOwner, getContactById);
router.put('/contacts/:id/reply', protectOwner, markAsReplied);
router.delete('/contacts/:id', protectOwner, deleteContact);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

export default router;
