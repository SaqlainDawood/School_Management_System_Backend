import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    children: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Student',
      default: [],
    },
    occupation: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
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
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian'],
      required: [true, 'Relationship is required'],
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
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

parentSchema.index({ children: 1 });

const Parent = mongoose.model('Parent', parentSchema);

export default Parent;