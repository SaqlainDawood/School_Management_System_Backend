import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    feeType: {
      type: String,
      enum: ['tuition', 'transport', 'library', 'lab', 'exam', 'admission', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'partial', 'waived'],
      default: 'pending',
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'online', 'cheque', 'card'],
    },
    transactionId: {
      type: String,
    },
    receiptNumber: {
      type: String,
    },
    lateFee: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountReason: {
      type: String,
      default: '',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    paymentHistory: {
      type: [
        {
          amount: Number,
          date: Date,
          method: String,
          transactionId: String,
          receiptNumber: String,
          remarks: String,
        },
      ],
      default: [],
    },
    remarks: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedDate: Date,
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

feeSchema.index({ student: 1, academicYear: 1 });
feeSchema.index({ status: 1 });
feeSchema.index({ dueDate: 1 });

const Fee = mongoose.model('Fee', feeSchema);

export default Fee;