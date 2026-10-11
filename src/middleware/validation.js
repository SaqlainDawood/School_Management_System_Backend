import { body, param, query, validationResult } from 'express-validator';

/**
 * Validate request
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // If validations is a function, execute it directly
    if (typeof validations === 'function') {
      return validations(req, res, next);
    }

    // If validations is an array, process each validation
    if (Array.isArray(validations) && validations.length > 0) {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }

    next();
  };
};

/**
 * User validation rules
 */
export const userValidation = {
  register: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['superadmin', 'admin', 'coordinator', 'teacher', 'student', 'parent', 'examination']),
  ],
  login: [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().matches(/^\+?[\d\s-()]{7,15}$/).withMessage('Please provide a valid phone number'),
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
};

/**
 * Student validation rules
 */
export const studentValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('class').notEmpty().withMessage('Class is required'),
    body('dateOfBirth').isDate().withMessage('Please provide a valid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  ],
};

/**
 * Teacher validation rules
 */
export const teacherValidation = {
  create: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('teacherId').notEmpty().withMessage('Teacher ID is required'),
    body('qualification').notEmpty().withMessage('Qualification is required'),
    body('specialization').notEmpty().withMessage('Specialization is required'),
    body('dateOfBirth').isDate().withMessage('Please provide a valid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('department').notEmpty().withMessage('Department is required'),
    body('designation').notEmpty().withMessage('Designation is required'),
  ],
};

/**
 * Class validation rules
 */
export const classValidation = {
  create: [
    body('name').notEmpty().withMessage('Class name is required'),
    body('code').notEmpty().withMessage('Class code is required'),
    body('academicYear').notEmpty().withMessage('Academic year is required'),
  ],
};

/**
 * Exam validation rules
 */
export const examValidation = {
  create: [
    body('name').notEmpty().withMessage('Exam name is required'),
    body('code').notEmpty().withMessage('Exam code is required'),
    body('type').isIn(['midterm', 'final', 'quiz', 'assignment', 'practical', 'viva']).withMessage('Invalid exam type'),
    body('class').notEmpty().withMessage('Class is required'),
    body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
    body('totalMarks').isNumeric().withMessage('Total marks is required'),
    body('passingMarks').isNumeric().withMessage('Passing marks is required'),
    body('duration').isNumeric().withMessage('Duration is required'),
    body('academicYear').notEmpty().withMessage('Academic year is required'),
    body('semester').notEmpty().withMessage('Semester is required'),
    body('startDate').isDate().withMessage('Start date is required'),
    body('endDate').isDate().withMessage('End date is required'),
  ],
};

/**
 * Fee validation rules
 */
export const feeValidation = {
  create: [
    body('student')
      .notEmpty()
      .withMessage('Student is required')
      .isMongoId()
      .withMessage('Invalid student ID'),
    
    body('feeType')
      .notEmpty()
      .withMessage('Fee type is required')
      .isIn(['tuition', 'transport', 'library', 'lab', 'exam', 'admission', 'other'])
      .withMessage('Invalid fee type'),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => parseFloat(value) > 0)
      .withMessage('Amount must be greater than 0'),
    
    body('dueDate')
      .notEmpty()
      .withMessage('Due date is required')
      .isISO8601()
      .withMessage('Invalid date format. Use YYYY-MM-DD'),
    
    body('academicYear')
      .notEmpty()
      .withMessage('Academic year is required')
      .matches(/^\d{4}-\d{4}$/)
      .withMessage('Academic year must be in format YYYY-YYYY'),
    
    body('semester')
      .optional()
      .isIn(['semester1', 'semester2', 'annual'])
      .withMessage('Invalid semester'),
    
    body('remarks')
      .optional()
      .isString()
      .withMessage('Remarks must be a string'),
  ],
};

/**
 * ID param validation (as middleware)
 */
export const idParam = (req, res, next) => {
  const { id, classId, studentId, feeId, examId, resultId, subjectId } = req.params;
  const param = id || classId || studentId || feeId || examId || resultId || subjectId;

  if (!param) {
    return next();
  }

  if (param.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(param)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: "${param}". ID must be 24 characters.`,
    });
  }

  next();
};

/**
 * ID param validation as express-validator array
 */
export const idParamValidator = [
  param('id').isMongoId().withMessage('Invalid ID format. Must be a valid ObjectId.'),
];

export const classIdParamValidator = [
  param('classId').isMongoId().withMessage('Invalid class ID format. Must be a valid ObjectId.'),
];

export const studentIdParamValidator = [
  param('studentId').isMongoId().withMessage('Invalid student ID format. Must be a valid ObjectId.'),
];

export default {
  validate,
  userValidation,
  studentValidation,
  teacherValidation,
  classValidation,
  examValidation,
  feeValidation,
  idParam,
  idParamValidator,
  classIdParamValidator,
  studentIdParamValidator,
};