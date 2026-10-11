import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
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
      default: null,
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
      index: true,
    },
    attachments: {
      type: [
        {
          name: String,
          url: String,
          publicId: String,
        },
      ],
      default: [],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    passingMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    submissions: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
          },
          file: {
            name: String,
            url: String,
            publicId: String,
          },
          submittedAt: {
            type: Date,
            default: Date.now,
          },
          marks: Number,
          feedback: String,
          status: {
            type: String,
            enum: ['submitted', 'graded', 'late'],
            default: 'submitted',
          },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ class: 1, subject: 1 });
assignmentSchema.index({ teacher: 1 });
assignmentSchema.index({ dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;