import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    experience: {
      years: { type: Number, default: 0 },
      details: { type: String, default: '' },
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    classes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Class',
      default: [],
    },
    subjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Subject',
      default: [],
    },
    salary: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'PKR' },
      paymentDate: Date,
    },
    bankInfo: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      routingNumber: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    documents: {
      type: [
        {
          name: String,
          url: String,
          publicId: String,
          type: String,
          uploadDate: Date,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated'],
      default: 'active',
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

teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ department: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;