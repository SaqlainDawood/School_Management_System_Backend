import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['general', 'exam', 'event', 'holiday', 'emergency', 'fee'],
      default: 'general',
    },
    audience: {
      type: [String],
      enum: ['all', 'students', 'teachers', 'parents', 'staff'],
      default: ['all'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
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
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ type: 1 });
noticeSchema.index({ isPublished: 1 });
noticeSchema.index({ audience: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;