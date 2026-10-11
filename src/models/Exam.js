import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Exam code is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['midterm', 'final', 'quiz', 'assignment', 'practical', 'viva'],
      required: [true, 'Exam type is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
    subjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Subject',
      required: [true, 'At least one subject is required'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one subject is required',
      },
    },
    schedule: {
      type: [
        {
          subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
          },
          date: Date,
          startTime: String,
          endTime: String,
          room: String,
          invigilator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
          },
        },
      ],
      default: [],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks is required'],
      min: [1, 'Total marks must be at least 1'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Passing marks is required'],
      min: [0, 'Passing marks must be at least 0'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    instructions: {
      type: String,
      default: '',
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      enum: ['semester1', 'semester2', 'annual'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (v) {
          return v >= this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    resultDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

examSchema.index({ class: 1, academicYear: 1 });
examSchema.index({ status: 1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;