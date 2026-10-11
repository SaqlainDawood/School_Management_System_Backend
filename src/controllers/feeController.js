import Fee from '../models/Fee.js';
import Student from '../models/Student.js';
import School from '../models/School.js';
import { generateFeeVoucherHTML } from '../utils/feeVoucherTemplate.js';
import pdf from 'html-pdf';
import path from 'path';
import { fileURLToPath } from 'url';

// ============================================
// CREATE FEE
// ============================================
export const createFee = async (req, res) => {
  try {
    console.log('📥 Received fee data:', req.body);

    const {
      student,
      feeType,
      amount,
      dueDate,
      academicYear,
      semester,
      remarks,
    } = req.body;

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student is required',
      });
    }

    if (!feeType) {
      return res.status(400).json({
        success: false,
        message: 'Fee type is required',
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required',
      });
    }

    const studentData = await Student.findById(student).populate('user');
    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const feeData = {
      student: student,
      class: studentData.class,
      feeType,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      academicYear,
      semester: semester || 'semester1',
      remarks: remarks || '',
      createdBy: req.user.id,
      remainingAmount: parseFloat(amount),
      status: 'pending',
    };

    const fee = await Fee.create(feeData);

    console.log('✅ Fee created:', fee._id);

    res.status(201).json({
      success: true,
      fee,
    });
  } catch (error) {
    console.error('❌ Create fee error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${messages.join(', ')}`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create fee',
    });
  }
};

// ============================================
// GET ALL FEES
// ============================================
export const getFees = async (req, res) => {
  try {
    const { studentId, status, feeType, academicYear } = req.query;

    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;
    if (feeType) query.feeType = feeType;
    if (academicYear) query.academicYear = academicYear;

    const fees = await Fee.find(query)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: fees.length,
      fees,
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE FEE
// ============================================
export const getFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    res.status(200).json({
      success: true,
      fee,
    });
  } catch (error) {
    console.error('Get fee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE FEE
// ============================================
export const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    const updatedFee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      fee: updatedFee,
    });
  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE FEE
// ============================================
export const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    await Fee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully',
    });
  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// PAY FEE
// ============================================
export const payFee = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, remarks } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Fee already paid',
      });
    }

    const paidAmount = parseFloat(amount) || fee.remainingAmount || fee.amount;
    fee.paidAmount += paidAmount;
    fee.remainingAmount = fee.amount - fee.paidAmount;

    if (fee.remainingAmount <= 0) {
      fee.status = 'paid';
    } else if (fee.paidAmount > 0) {
      fee.status = 'partial';
    }

    fee.paymentHistory.push({
      amount: paidAmount,
      date: new Date(),
      method: paymentMethod,
      transactionId: transactionId || '',
      remarks: remarks || '',
    });

    fee.paymentDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId || '';
    fee.receiptNumber = `RCP-${Date.now()}`;

    await fee.save();

    res.status(200).json({
      success: true,
      fee,
    });
  } catch (error) {
    console.error('Pay fee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT FEES
// ============================================
export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('user', 'name');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const fees = await Fee.find({ student: studentId })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code')
      .sort({ dueDate: 1 });

    const summary = {
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      paidAmount: fees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingAmount: fees
        .filter((f) => f.status === 'pending' || f.status === 'overdue')
        .reduce((sum, f) => sum + f.remainingAmount, 0),
      totalFees: fees.length,
      paidFees: fees.filter((f) => f.status === 'paid').length,
      pendingFees: fees.filter(
        (f) => f.status === 'pending' || f.status === 'overdue'
      ).length,
    };

    res.status(200).json({
      success: true,
      summary,
      fees,
    });
  } catch (error) {
    console.error('Get student fees error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET FEE REPORT
// ============================================
export const getFeeReport = async (req, res) => {
  try {
    const { startDate, endDate, status, feeType } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (status) query.status = status;
    if (feeType) query.feeType = feeType;

    const fees = await Fee.find(query)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .populate('class', 'name code');

    const report = {
      totalFees: fees.length,
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      totalPending: fees
        .filter((f) => f.status === 'pending' || f.status === 'overdue')
        .reduce((sum, f) => sum + f.remainingAmount, 0),
      byStatus: {
        paid: fees.filter((f) => f.status === 'paid').length,
        pending: fees.filter((f) => f.status === 'pending').length,
        overdue: fees.filter((f) => f.status === 'overdue').length,
        partial: fees.filter((f) => f.status === 'partial').length,
        waived: fees.filter((f) => f.status === 'waived').length,
      },
      byType: {},
    };

    fees.forEach((fee) => {
      if (!report.byType[fee.feeType]) {
        report.byType[fee.feeType] = {
          count: 0,
          amount: 0,
          paid: 0,
        };
      }
      report.byType[fee.feeType].count++;
      report.byType[fee.feeType].amount += fee.amount;
      if (fee.status === 'paid') {
        report.byType[fee.feeType].paid += fee.amount;
      }
    });

    res.status(200).json({
      success: true,
      report,
      fees,
    });
  } catch (error) {
    console.error('Get fee report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET MY FEES (for logged-in student)
// ============================================
export const getMyFees = async (req, res) => {
  try {
    console.log('📥 Fetching fees for logged-in student');

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    console.log('👨‍🎓 Student found:', student._id);

    const fees = await Fee.find({ student: student._id })
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code')
      .sort({ dueDate: 1 });

    console.log('📊 Fees found:', fees.length);

    const summary = {
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      paidAmount: fees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingAmount: fees
        .filter((f) => f.status === 'pending' || f.status === 'overdue')
        .reduce((sum, f) => sum + f.remainingAmount, 0),
      totalFees: fees.length,
      paidFees: fees.filter((f) => f.status === 'paid').length,
      pendingFees: fees.filter(
        (f) => f.status === 'pending' || f.status === 'overdue'
      ).length,
    };

    res.status(200).json({
      success: true,
      summary,
      fees,
    });
  } catch (error) {
    console.error('❌ Get my fees error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE FEE CHALLAN / VOUCHER
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateFeeChallan = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    const student = fee.student;
    const school = (await School.findOne().lean()) || {
      name: 'School Management System',
      address: {
        street: '123 Education Street',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
      },
    };

    const html = generateFeeVoucherHTML(fee, student, school);

    res.status(200).json({
      success: true,
      html,
      fee: {
        id: fee._id,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(
          new Date().getMonth() + 1
        ).padStart(2, '0')}-${String(fee._id).slice(-6)}`,
        student: student.name,
        studentId: student.studentId,
        rollNumber: student.rollNumber,
        class: fee.class?.name,
        feeType: fee.feeType,
        amount: fee.amount,
        paidAmount: fee.paidAmount,
        remainingAmount: fee.remainingAmount,
        status: fee.status,
        dueDate: fee.dueDate,
        paymentDate: fee.paymentDate,
        receiptNumber: fee.receiptNumber,
        academicYear: fee.academicYear,
        semester: fee.semester,
      },
    });
  } catch (error) {
    console.error('❌ Generate fee challan error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DOWNLOAD FEE VOUCHER AS PDF
// ============================================
export const downloadFeeVoucherPDF = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('class', 'name code');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    const student = fee.student;
    const school = (await School.findOne().lean()) || {
      name: 'School Management System',
      address: {
        street: '123 Education Street',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
      },
    };

    const html = generateFeeVoucherHTML(fee, student, school);

    const pdfOptions = {
      format: 'A4',
      border: '10mm',
      printBackground: true,
    };

    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html, pdfOptions).toBuffer((err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=fee-voucher-${fee._id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Download fee voucher error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};