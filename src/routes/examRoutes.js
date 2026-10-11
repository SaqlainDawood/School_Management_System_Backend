import express from 'express';
import {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
  publishExam,
  getExamSchedule,
  getExamResults,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('admin', 'superadmin', 'examination'), createExam)
  .get(
    authorize('admin', 'superadmin', 'coordinator', 'teacher', 'student'),
    getExams
  );

router
  .route('/:id')
  .get(
    authorize('admin', 'superadmin', 'teacher', 'student'),
    getExam
  )
  .put(authorize('admin', 'superadmin', 'examination'), updateExam)
  .delete(authorize('admin', 'superadmin'), deleteExam);

router.put(
  '/:id/publish',
  authorize('admin', 'superadmin', 'examination'),
  publishExam
);

router.get(
  '/schedule',
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getExamSchedule
);

router.get(
  '/:id/results',
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getExamResults
);

export default router;