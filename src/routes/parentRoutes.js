import express from 'express';
import {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  getParentChildren,
  getParentDashboard,
  getChildAttendance,
  getChildResults,
  getChildFees,
} from '../controllers/parentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// Parent dashboard
router.get('/dashboard', authorize('parent'), getParentDashboard);

// Admin only routes
router
  .route('/')
  .get(authorize('admin', 'superadmin'), getParents)
  .post(authorize('admin', 'superadmin'), createParent);

router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'parent'),
    getParent
  )
  .put(
    validate(idParam),
    authorize('admin', 'superadmin', 'parent'),
    updateParent
  )
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteParent);

// Parent children routes
router.get(
  '/:id/children',
  validate(idParam),
  authorize('admin', 'superadmin', 'parent'),
  getParentChildren
);

// Child specific routes
router.get(
  '/child/:childId/attendance',
  validate(idParam),
  authorize('parent'),
  getChildAttendance
);

router.get(
  '/child/:childId/results',
  validate(idParam),
  authorize('parent'),
  getChildResults
);

router.get(
  '/child/:childId/fees',
  validate(idParam),
  authorize('parent'),
  getChildFees
);

export default router;