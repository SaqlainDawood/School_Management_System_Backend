import express from 'express';
import {
  getStudentResults,
  getResultById,
  getSubjectPerformance,
  getSemesterPerformance,
  createResult,
  updateResult,
  deleteResult,
} from '../controllers/resultController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Student-specific routes
router.route('/student').get(protect, getStudentResults);

router.route('/subject-performance').get(protect, getSubjectPerformance);

router.route('/semester-performance').get(protect, getSemesterPerformance);

// Admin/Teacher only routes
router.route('/').post(protect, authorize('admin', 'teacher'), createResult);

router
  .route('/:id')
  .get(protect, getResultById)
  .put(protect, authorize('admin', 'teacher'), updateResult)
  .delete(protect, authorize('admin'), deleteResult);
export default router;
