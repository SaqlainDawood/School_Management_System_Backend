// ============================================
// USER ROLES
// ============================================
export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
  EXAMINATION: 'examination',
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'School Admin',
  coordinator: 'Coordinator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  examination: 'Examination Cell',
};

// ============================================
// ATTENDANCE
// ============================================
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  HOLIDAY: 'holiday',
};

export const ATTENDANCE_LABELS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
  holiday: 'Holiday',
};

// ============================================
// FEES
// ============================================
export const FEE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  PARTIAL: 'partial',
  WAIVED: 'waived',
};

export const FEE_TYPES = {
  TUITION: 'tuition',
  TRANSPORT: 'transport',
  LIBRARY: 'library',
  LAB: 'lab',
  EXAM: 'exam',
  ADMISSION: 'admission',
  OTHER: 'other',
};

// ============================================
// EXAMS
// ============================================
export const EXAM_TYPES = {
  MIDTERM: 'midterm',
  FINAL: 'final',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  PRACTICAL: 'practical',
  VIVA: 'viva',
};

export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ============================================
// GRADES
// ============================================
export const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export const GRADE_POINTS = {
  'A+': 4.0,
  A: 3.7,
  'B+': 3.3,
  B: 3.0,
  'C+': 2.3,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

// ============================================
// DAYS
// ============================================
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============================================
// NOTICES
// ============================================
export const NOTICE_TYPES = {
  GENERAL: 'general',
  EXAM: 'exam',
  EVENT: 'event',
  HOLIDAY: 'holiday',
  EMERGENCY: 'emergency',
  FEE: 'fee',
};

export const NOTICE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const NOTICE_AUDIENCE = {
  ALL: 'all',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  PARENTS: 'parents',
  STAFF: 'staff',
};

// ============================================
// GENDER
// ============================================
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// ============================================
// BLOOD GROUPS
// ============================================
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ============================================
// STATUSES
// ============================================
export const STUDENT_STATUS = ['active', 'inactive', 'graduated', 'transferred', 'suspended'];

export const TEACHER_STATUS = ['active', 'inactive', 'on_leave', 'terminated'];

export const TRANSPORT_STATUS = ['active', 'inactive', 'maintenance'];

export const SUBSCRIPTION_PLANS = ['basic', 'standard', 'premium', 'enterprise'];

export const SUBSCRIPTION_STATUS = ['active', 'expired', 'suspended', 'trial'];

// ============================================
// PAGINATION
// ============================================
export const PAGINATION_LIMITS = [5, 10, 25, 50, 100];

// ============================================
// FILE SIZE
// ============================================
export const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];