import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      trim: true,
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },
    section: {
      type: String,
      default: '',
    },

    // Parent Fields
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
      trim: true,
    },
    fatherPhone: {
      type: String,
      required: [true, 'Father phone number is required'],
      trim: true,
    },
    fatherOccupation: {
      type: String,
      default: '',
      trim: true,
    },
    fatherCnic: {
      type: String,
      default: '',
      trim: true,
    },
    motherName: {
      type: String,
      default: '',
      trim: true,
    },
    motherPhone: {
      type: String,
      default: '',
      trim: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parent',
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
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    religion: {
      type: String,
      default: '',
    },
    nationality: {
      type: String,
      default: '',
    },
    address: {
      permanent: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: '' },
      },
      current: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: '' },
      },
    },
    phone: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended'],
      default: 'active',
    },
    medicalInfo: {
      bloodGroup: { type: String, default: '' },
      allergies: { type: [String], default: [] },
      medications: { type: [String], default: [] },
      disabilities: { type: [String], default: [] },
      emergencyNotes: { type: String, default: '' },
    },
    academicHistory: {
      type: [
        {
          year: String,
          class: String,
          grade: String,
          percentage: Number,
          school: String,
        },
      ],
      default: [],
    },
    achievements: {
      type: [
        {
          title: String,
          description: String,
          date: Date,
          level: {
            type: String,
            enum: ['school', 'district', 'state', 'national', 'international'],
          },
        },
      ],
      default: [],
    },
    extracurricular: {
      type: [
        {
          activity: String,
          level: String,
          years: Number,
          achievements: String,
        },
      ],
      default: [],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique indexes - Per Class + Section
studentSchema.index({ studentId: 1, class: 1, section: 1 }, { unique: true });
studentSchema.index({ rollNumber: 1, class: 1, section: 1 }, { unique: true });

// Additional indexes
studentSchema.index({ user: 1 });
studentSchema.index({ class: 1 });
studentSchema.index({ parent: 1 });
studentSchema.index({ fatherName: 1 });
studentSchema.index({ fatherPhone: 1 });

const Student = mongoose.model('Student', studentSchema);

export default Student;