import express from 'express';
import {
  generateStudentReport,
  generateAttendanceReport,
  generateFeeReport,
  generateResultReport,
  generateTeacherReport,
  exportPDF,
  exportExcel,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin', 'coordinator'));

router.get('/students', generateStudentReport);
router.get('/attendance', generateAttendanceReport);
router.get('/fees', generateFeeReport);
router.get('/results', generateResultReport);
router.get('/teachers', generateTeacherReport);
router.get('/export/pdf', exportPDF);
router.get('/export/excel', exportExcel);

export default router;