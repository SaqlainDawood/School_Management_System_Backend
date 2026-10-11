import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
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
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    periods: {
      type: [
        {
          periodNumber: {
            type: Number,
            required: true,
          },
          startTime: {
            type: String,
            required: true,
          },
          endTime: {
            type: String,
            required: true,
          },
          subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
          },
          teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true,
          },
          room: {
            type: String,
            default: '',
          },
        },
      ],
      default: [],
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
      enum: ['semester1', 'semester2', 'annual'],
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

timetableSchema.index({ class: 1, day: 1 });
timetableSchema.index({ academicYear: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;