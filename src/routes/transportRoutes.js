import express from 'express';
import {
  createTransport,
  getTransports,
  getTransport,
  updateTransport,
  deleteTransport,
  assignStudent,
  removeStudent,
  getStudentTransport,
} from '../controllers/transportController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('admin', 'superadmin'), createTransport)
  .get(authorize('admin', 'superadmin', 'coordinator'), getTransports);

router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'student'),
    getTransport
  )
  .put(validate(idParam), authorize('admin', 'superadmin'), updateTransport)
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteTransport);

router.post(
  '/:id/assign-student',
  validate(idParam),
  authorize('admin', 'superadmin'),
  assignStudent
);

router.post(
  '/:id/remove-student',
  validate(idParam),
  authorize('admin', 'superadmin'),
  removeStudent
);

router.get(
  '/student/:studentId',
  validate(idParam),
  authorize('admin', 'superadmin', 'student'),
  getStudentTransport
);

export default router;