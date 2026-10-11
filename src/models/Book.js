import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    publisher: {
      type: String,
      default: '',
    },
    edition: {
      type: String,
      default: '',
    },
    year: Number,
    pages: Number,
    description: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    available: {
      type: Number,
      required: true,
      default: 1,
    },
    location: {
      shelf: { type: String, default: '' },
      row: { type: String, default: '' },
      rack: { type: String, default: '' },
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    borrowings: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
          },
          borrowDate: Date,
          returnDate: Date,
          dueDate: Date,
          status: {
            type: String,
            enum: ['borrowed', 'returned', 'overdue'],
            default: 'borrowed',
          },
          fine: Number,
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

bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ category: 1 });

const Book = mongoose.model('Book', bookSchema);

export default Book;