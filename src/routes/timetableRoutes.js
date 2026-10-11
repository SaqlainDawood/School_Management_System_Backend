import express from 'express';
import {
  createTimetable,
  getTimetables,
  getTimetable,
  updateTimetable,
  deleteTimetable,
  getClassTimetable,
  getTeacherTimetable,
  getMyTimetable,
} from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// Student's own timetable (BEFORE /:id)
router.get('/my-timetable', authorize('student'), getMyTimetable);

router
  .route('/')
  .post(authorize('admin', 'superadmin', 'coordinator'), createTimetable)
  .get(
    authorize('admin', 'superadmin', 'coordinator', 'teacher', 'student'),
    getTimetables
  );

router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'teacher', 'student'),
    getTimetable
  )
  .put(
    validate(idParam),
    authorize('admin', 'superadmin', 'coordinator'),
    updateTimetable
  )
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteTimetable);

router.get(
  '/class/:classId',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getClassTimetable
);

router.get(
  '/teacher/:teacherId',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher'),
  getTeacherTimetable
);

export default router;