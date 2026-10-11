// routes/feeRoutes.js
import express from 'express';
import {
  createFee,
  getFees,
  getFee,
  updateFee,
  deleteFee,
  payFee,
  getStudentFees,
  getFeeReport,
  generateFeeChallan,
  downloadFeeVoucherPDF,
  getMyFees,
} from '../controllers/feeController.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  validate,
  feeValidation,
  idParam,
} from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// STUDENT ROUTES (must come before /:id)
// ============================================
router.get('/my-fees', authorize('student'), getMyFees);

// ============================================
// MAIN CRUD ROUTES
// ============================================
router
  .route('/')
  .post(
    authorize('admin', 'superadmin'),
    validate(feeValidation.create),
    createFee
  )
  .get(authorize('admin', 'superadmin', 'coordinator'), getFees);

router
  .route('/:id')
  .get(idParam, authorize('admin', 'superadmin', 'student'), getFee)
  .put(idParam, authorize('admin', 'superadmin'), updateFee)
  .delete(idParam, authorize('admin', 'superadmin'), deleteFee);

router.post(
  '/:id/pay',
  idParam,
  authorize('admin', 'superadmin', 'student'),
  payFee
);

router.get(
  '/student/:studentId',
  idParam,
  authorize('admin', 'superadmin', 'student'),
  getStudentFees
);

router.get('/report', authorize('admin', 'superadmin'), getFeeReport);

router.get(
  '/:id/challan',
  idParam,
  authorize('admin', 'superadmin', 'student'),
  generateFeeChallan
);

router.get(
  '/:id/download-pdf',
  idParam,
  authorize('admin', 'superadmin', 'student'),
  downloadFeeVoucherPDF
);

export default router;