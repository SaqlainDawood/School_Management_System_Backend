import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add department name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please add department code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teachers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Teacher',
      default: [],
    },
    subjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Subject',
      default: [],
    },
    students: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Student',
      default: [],
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

departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });

const Department = mongoose.model('Department', departmentSchema);

export default Department;