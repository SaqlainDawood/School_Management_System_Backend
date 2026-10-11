import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused', 'holiday'],
      required: true,
    },
    checkInTime: {
      type: String,
    },
    checkOutTime: {
      type: String,
    },
    reason: {
      type: String,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    period: {
      number: Number,
      startTime: String,
      endTime: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicates
attendanceSchema.index(
  { student: 1, date: 1, class: 1, subject: 1 },
  { unique: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;