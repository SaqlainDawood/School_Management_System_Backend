import express from 'express';
import {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getStudentBooks,
  getAvailableBooks,
} from '../controllers/libraryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// Specific routes (BEFORE /:id)
router.get('/available', getAvailableBooks);

router
  .route('/')
  .post(authorize('admin', 'superadmin'), createBook)
  .get(getBooks);

router
  .route('/:id')
  .get(validate(idParam), getBook)
  .put(validate(idParam), authorize('admin', 'superadmin'), updateBook)
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteBook);

router.post(
  '/:id/borrow',
  validate(idParam),
  authorize('admin', 'superadmin', 'student'),
  borrowBook
);

router.post(
  '/:id/return',
  validate(idParam),
  authorize('admin', 'superadmin', 'student'),
  returnBook
);

router.get(
  '/student/:studentId',
  validate(idParam),
  authorize('admin', 'superadmin', 'student'),
  getStudentBooks
);

export default router;