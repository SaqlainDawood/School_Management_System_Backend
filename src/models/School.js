import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add school name'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['public', 'private', 'international', 'religious'],
      default: 'private',
    },
    level: {
      type: String,
      enum: ['primary', 'secondary', 'higher_secondary', 'combined'],
      default: 'combined',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    logo: {
      type: String,
      default: 'default-school-logo.png',
    },
    logoPublicId: String,
    establishedYear: Number,
    motto: String,
    description: String,
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'enterprise'],
        default: 'basic',
      },
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ['active', 'expired', 'suspended', 'trial'],
        default: 'active',
      },
    },
    settings: {
      academicYear: {
        start: Date,
        end: Date,
      },
      semester: {
        type: String,
        enum: ['semester1', 'semester2', 'annual'],
        default: 'semester1',
      },
      gradingSystem: {
        type: String,
        enum: ['percentage', 'gpa', 'letter'],
        default: 'percentage',
      },
      attendanceType: {
        type: String,
        enum: ['daily', 'period_wise'],
        default: 'daily',
      },
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

// Indexes
schoolSchema.index({ code: 1 });
schoolSchema.index({ name: 1 });

const School = mongoose.model('School', schoolSchema);

export default School;