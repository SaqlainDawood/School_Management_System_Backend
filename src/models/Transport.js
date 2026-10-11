import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: true,
    },
    route: {
      start: { type: String, default: '' },
      end: { type: String, default: '' },
      stops: {
        type: [
          {
            name: String,
            time: String,
            latitude: Number,
            longitude: Number,
          },
        ],
        default: [],
      },
    },
    students: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Student',
      default: [],
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
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

transportSchema.index({ busNumber: 1 });
transportSchema.index({ driverName: 1 });

const Transport = mongoose.model('Transport', transportSchema);

export default Transport;