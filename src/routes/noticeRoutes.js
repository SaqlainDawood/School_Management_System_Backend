import express from 'express';
import {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  publishNotice,
  getStudentNotices,
  getTeacherNotices,
} from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// Student/Teacher specific routes (BEFORE /:id)
router.get('/student', authorize('student'), getStudentNotices);
router.get('/teacher', authorize('teacher'), getTeacherNotices);

router
  .route('/')
  .post(
    authorize('admin', 'superadmin', 'coordinator', 'teacher'),
    createNotice
  )
  .get(getNotices);

router
  .route('/:id')
  .get(validate(idParam), getNotice)
  .put(
    validate(idParam),
    authorize('admin', 'superadmin', 'coordinator'),
    updateNotice
  )
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteNotice);

router.put(
  '/:id/publish',
  validate(idParam),
  authorize('admin', 'superadmin', 'coordinator'),
  publishNotice
);

export default router;