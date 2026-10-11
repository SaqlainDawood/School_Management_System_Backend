import express from 'express';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  getSubjectTeachers,
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'superadmin', 'coordinator', 'teacher'), getSubjects)
  .post(authorize('admin', 'superadmin'), createSubject);

router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'teacher'),
    getSubject
  )
  .put(validate(idParam), authorize('admin', 'superadmin'), updateSubject)
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteSubject);

router.post(
  '/:id/assign-teacher',
  validate(idParam),
  authorize('admin', 'superadmin'),
  assignTeacherToSubject
);

router.post(
  '/:id/remove-teacher',
  validate(idParam),
  authorize('admin', 'superadmin'),
  removeTeacherFromSubject
);

router.get(
  '/:id/teachers',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher'),
  getSubjectTeachers
);

export default router;