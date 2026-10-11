import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    type: {
      type: String,
      enum: ['core', 'elective', 'lab', 'practical', 'theory'],
      default: 'core',
    },
    credits: {
      type: Number,
      default: 3,
    },
    classes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Class',
      default: [],
    },
    teachers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Teacher',
      default: [],
    },
    syllabus: {
      type: [
        {
          title: String,
          description: String,
          topics: [String],
          duration: Number,
        },
      ],
      default: [],
    },
    books: {
      type: [
        {
          name: String,
          author: String,
          edition: String,
          publisher: String,
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

subjectSchema.index({ code: 1 });
subjectSchema.index({ name: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;