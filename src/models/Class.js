import mongoose from 'mongoose';

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add class name'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    sections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Section',
      default: [],
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    subjects: {
      type: [
        {
          subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
          },
          teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            default: null,
          },
          period: {
            perWeek: { type: Number, default: 5 },
            duration: { type: Number, default: 45 },
          },
        },
      ],
      default: [],
    },
    academicYear: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 40,
    },
    students: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Student',
      default: [],
    },
    roomNumber: {
      type: String,
      default: '',
    },
    building: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'inactive'],
      default: 'active',
    },
    archivedDate: {
      type: Date,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ code: 1 });
classSchema.index({ academicYear: 1 });
classSchema.index({ classTeacher: 1 });
classSchema.index({ status: 1 });

const Class = mongoose.model('Class', classSchema);

export default Class;