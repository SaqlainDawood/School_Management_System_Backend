import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
    examName: {
      type: String,
      required: [true, 'Exam name is required'],
    },
    examType: {
      type: String,
      enum: ['Mid Term', 'Final Term', 'Quiz', 'Test', 'Assignment', 'Regular'],
      default: 'Regular',
    },
    examDate: {
      type: Date,
      default: Date.now,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    subjectName: {
      type: String,
      required: [true, 'Subject name is required'],
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Obtained marks are required'],
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: 1,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      default: 'F',
    },
    gradePoint: {
      type: Number,
      min: 0,
      max: 4,
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
    },
    gradePointAverage: {
      type: Number,
      min: 0,
      max: 4,
    },
    status: {
      type: String,
      enum: ['pass', 'fail'],
      default: 'fail',
    },
    semester: {
      type: String,
      default: 'Semester 1',
    },
    academicYear: {
      type: String,
      default: new Date().getFullYear().toString(),
    },
    subjects: [
      {
        name: {
          type: String,
          required: true,
        },
        obtainedMarks: {
          type: Number,
          required: true,
          min: 0,
        },
        totalMarks: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    remarks: {
      type: String,
      maxlength: 500,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware — calculate percentage, grade, and status
resultSchema.pre('save', function (next) {
  if (this.totalMarks > 0) {
    this.percentage = (this.obtainedMarks / this.totalMarks) * 100;
  }

  const percentage = this.percentage || 0;
  if (percentage >= 90) {
    this.grade = 'A+';
    this.gradePoint = 4.0;
  } else if (percentage >= 80) {
    this.grade = 'A';
    this.gradePoint = 3.7;
  } else if (percentage >= 75) {
    this.grade = 'B+';
    this.gradePoint = 3.3;
  } else if (percentage >= 70) {
    this.grade = 'B';
    this.gradePoint = 3.0;
  } else if (percentage >= 60) {
    this.grade = 'C+';
    this.gradePoint = 2.3;
  } else if (percentage >= 50) {
    this.grade = 'C';
    this.gradePoint = 2.0;
  } else if (percentage >= 40) {
    this.grade = 'D';
    this.gradePoint = 1.0;
  } else {
    this.grade = 'F';
    this.gradePoint = 0.0;
  }

  this.gpa = this.gradePoint;
  this.gradePointAverage = this.gradePoint;
  this.status = percentage >= 40 ? 'pass' : 'fail';

  next();
});

resultSchema.index({ studentId: 1, examId: 1 });
resultSchema.index({ studentId: 1, semester: 1 });
resultSchema.index({ studentId: 1, academicYear: 1 });

const Result = mongoose.model('Result', resultSchema);

export default Result;