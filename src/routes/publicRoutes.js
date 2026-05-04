import express from 'express';
import {
  getPublicClasses,
  getPublicSubjects,
  getApprovedReviews,
  getAboutInfo,
  getOwnerInfo,
  submitContact,
} from '../controllers/publicController.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/classes', getPublicClasses);
router.get('/subjects', getPublicSubjects);
router.get('/reviews', getApprovedReviews);
router.get('/about', getAboutInfo);
router.get('/owner', getOwnerInfo);
router.post('/contact', submitContact);
export default router;
