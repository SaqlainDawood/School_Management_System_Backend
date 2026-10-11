import Student from '../models/Student.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import mongoose from 'mongoose';

// ============================================
// GET ALL STUDENTS
// ============================================
export const getStudents = async (req, res) => {
  try {
    const { class: classId, section, status, search } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (section) query.section = section;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Student.countDocuments(query);

    const students = await Student.find(query)
      .populate('user', 'name email avatar')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('parent', 'user')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE STUDENT - WITH PER-CLASS UNIQUENESS
// ============================================
export const createStudent = async (req, res) => {
  try {
    console.log('📥 Received student data:', req.body);

    const {
      name,
      email,
      studentId,
      rollNumber,
      class: classId,
      section,
      dateOfBirth,
      gender,
      phone,
      address,
      parent,
      status,
      bloodGroup,
      religion,
      nationality,
      emergencyContact,
      fatherName,
      fatherPhone,
      fatherOccupation,
      fatherCnic,
      motherName,
      motherPhone,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!studentId) missingFields.push('studentId');
    if (!rollNumber) missingFields.push('rollNumber');
    if (!classId) missingFields.push('class');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!gender) missingFields.push('gender');
    if (!fatherName) missingFields.push('fatherName');
    if (!fatherPhone) missingFields.push('fatherPhone');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format. Please select a valid class.',
      });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found with the provided ID',
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Email "${email}" already exists. Please use a different email.`,
      });
    }

    // Check if student ID exists in same class + section
    const existingStudent = await Student.findOne({
      studentId,
      class: classId,
      section: section || '',
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student ID "${studentId}" already exists in "${classData.name}" - Section "${section || 'N/A'}". Please use a different ID.`,
      });
    }

    // Check if roll number exists in same class + section
    const existingRoll = await Student.findOne({
      rollNumber,
      class: classId,
      section: section || '',
    });

    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll Number "${rollNumber}" already exists in "${classData.name}" - Section "${section || 'N/A'}". Please use a different roll number.`,
      });
    }

    // Create user
    const password = Math.random().toString(36).slice(-8);
    console.log('📝 Creating user with password:', password);

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      phone: phone || '',
      address: address || '',
      isActive: true,
      isVerified: true,
    });

    console.log('✅ User created:', user._id);

    // Prepare student data
    const studentData = {
      user: user._id,
      studentId,
      rollNumber,
      class: classId,
      section: section || '',
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone: phone || '',
      address: address || '',
      parent: parent || null,
      status: status || 'active',
      bloodGroup: bloodGroup || '',
      religion: religion || '',
      nationality: nationality || '',
      emergencyContact: emergencyContact || { name: '', relation: '', phone: '' },
      enrollmentDate: new Date(),
      fatherName: fatherName || '',
      fatherPhone: fatherPhone || '',
      fatherOccupation: fatherOccupation || '',
      fatherCnic: fatherCnic || '',
      motherName: motherName || '',
      motherPhone: motherPhone || '',
    };

    const student = await Student.create(studentData);

    console.log('✅ Student created:', student._id);

    // Add student to class
    await Class.findByIdAndUpdate(classId, {
      $push: { students: student._id },
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student,
      temporaryPassword: password,
    });
  } catch (error) {
    console.error('❌ Create student error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check the class ID.',
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = '';
      if (field === 'studentId') {
        message = `Student ID "${req.body.studentId}" already exists in this class and section.`;
      } else if (field === 'rollNumber') {
        message = `Roll Number "${req.body.rollNumber}" already exists in this class and section.`;
      } else {
        message = `Duplicate entry for ${field}. Please use different value.`;
      }
      return res.status(400).json({ success: false, message });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${messages.join(', ')}`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student',
    });
  }
};

// ============================================
// GET SINGLE STUDENT
// ============================================
export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email avatar phone address')
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('parent', 'user relationship phone');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE STUDENT
// ============================================
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const updateData = { ...req.body };
    delete updateData.user;

    if (updateData.fatherName === '') {
      return res.status(400).json({
        success: false,
        message: 'Father name cannot be empty',
      });
    }

    if (updateData.fatherPhone === '') {
      return res.status(400).json({
        success: false,
        message: 'Father phone cannot be empty',
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.body.name || req.body.email || req.body.phone) {
      await User.findByIdAndUpdate(student.user, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      });
    }

    res.status(200).json({
      success: true,
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE STUDENT
// ============================================
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    await User.findByIdAndDelete(student.user);
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id },
    });
    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT ATTENDANCE
// ============================================
export const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find({
      student: id,
      ...dateFilter,
    })
      .populate('class', 'name code')
      .populate('subject', 'name')
      .sort({ date: -1 });

    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'present').length;
    const absentDays = attendance.filter((a) => a.status === 'absent').length;
    const lateDays = attendance.filter((a) => a.status === 'late').length;
    const excusedDays = attendance.filter((a) => a.status === 'excused').length;

    const attendancePercentage =
      totalDays > 0
        ? (((presentDays + excusedDays) / totalDays) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendancePercentage,
      },
      attendance,
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// HELPER - Calculate grade
// ============================================
const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0 };
  if (percentage >= 80) return { grade: 'A', gradePoint: 3.7 };
  if (percentage >= 75) return { grade: 'B+', gradePoint: 3.3 };
  if (percentage >= 70) return { grade: 'B', gradePoint: 3.0 };
  if (percentage >= 60) return { grade: 'C+', gradePoint: 2.3 };
  if (percentage >= 50) return { grade: 'C', gradePoint: 2.0 };
  if (percentage >= 40) return { grade: 'D', gradePoint: 1.0 };
  return { grade: 'F', gradePoint: 0.0 };
};

// ============================================
// GET STUDENT RESULTS
// ============================================
export const getStudentResults = async (req, res) => {
  try {
    console.log('🔍 Fetching results for user:', req.user.email, 'Role:', req.user.role);

    let studentId = null;

    if (req.user.studentData) {
      studentId = req.user.studentData._id;
      console.log('✅ Using studentData from middleware:', studentId);
    }

    if (!studentId) {
      const student = await Student.findOne({ user: req.user._id });

      if (!student) {
        console.log('❌ Student record not found for user:', req.user._id);

        try {
          const newStudent = await Student.create({
            user: req.user._id,
            studentId: `STU-${Date.now()}`,
            rollNumber: `ROLL-${Date.now()}`,
            class: null,
            section: 'A',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'male',
            status: 'active',
          });

          console.log('✅ Auto-created student record:', newStudent.studentId);
          studentId = newStudent._id;
        } catch (createError) {
          console.error('❌ Failed to create student:', createError.message);
          return res.status(404).json({
            success: false,
            message: 'Student record not found. Please contact administration.',
          });
        }
      } else {
        studentId = student._id;
        console.log('✅ Found student by user ID:', studentId);
      }
    }

    const results = await Result.find({ studentId: studentId })
      .populate('examId', 'name type date')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${results.length} results`);

    const formattedResults = results.map((result) => {
      const percentage =
        result.percentage ||
        (result.totalMarks > 0 ? (result.obtainedMarks / result.totalMarks) * 100 : 0);
      const gradeInfo = calculateGrade(percentage);

      return {
        _id: result._id,
        examName: result.examId?.name || result.examName || 'Exam',
        exam: {
          name: result.examId?.name || result.examName || 'Exam',
          type: result.examId?.type || result.examType || 'Regular',
          date: result.examId?.date || result.examDate || new Date(),
        },
        subject: result.subjectId?.name || result.subjectName || 'General',
        obtainedMarks: result.obtainedMarks || 0,
        totalMarks: result.totalMarks || 100,
        percentage: Math.round(percentage),
        grade: result.grade || gradeInfo.grade,
        status: result.status || (percentage >= 40 ? 'pass' : 'fail'),
        semester: result.semester || 'Semester 1',
        academicYear: result.academicYear || new Date().getFullYear().toString(),
        subjects: result.subjects || [],
        remarks: result.remarks || '',
        date: result.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedResults.length,
      message:
        results.length === 0
          ? 'No results found for this student'
          : 'Results fetched successfully',
      results: formattedResults,
    });
  } catch (error) {
    console.error('❌ Error in getStudentResults:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================
// GET STUDENT FEES
// ============================================
export const getStudentFees = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const fees = await Fee.find({ student: id })
      .populate('class', 'name code')
      .sort({ dueDate: 1 });

    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees
      .filter((f) => f.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const pendingAmount = fees
      .filter((f) => f.status === 'pending' || f.status === 'overdue')
      .reduce((sum, fee) => sum + fee.remainingAmount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount,
        totalFees: fees.length,
        paidFees: fees.filter((f) => f.status === 'paid').length,
        pendingFees: fees.filter(
          (f) => f.status === 'pending' || f.status === 'overdue'
        ).length,
      },
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
// GET STUDENT DASHBOARD - FIXED
// ============================================
export const getStudentDashboard = async (req, res) => {
  try {
    console.log('📥 Fetching dashboard for user:', req.user.id);

    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email avatar phone address')
      .populate('class', 'name code')
      .populate('section', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    // Calculate profile completion
    const fields = {
      name: student.user?.name,
      email: student.user?.email,
      phone: student.user?.phone,
      address: student.user?.address,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      class: student.class?.name,
      section: student.section,
      fatherName: student.fatherName,
      fatherPhone: student.fatherPhone,
      motherName: student.motherName,
    };

    const totalFields = Object.keys(fields).length;
    const filledFields = Object.values(fields).filter(
      (v) => v && v !== '' && v !== null && v !== undefined
    ).length;
    const completion = Math.round((filledFields / totalFields) * 100);

    // Attendance summary
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const attendance = await Attendance.find({
      student: student._id,
      date: { $gte: startOfMonth },
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'present').length;
    const attendancePercentage =
      totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    // Fee summary
    const fees = await Fee.find({ student: student._id });
    const pendingFees = fees.filter(
      (f) => f.status === 'pending' || f.status === 'overdue'
    );
    const totalFeeAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidFeeAmount = fees
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);

    // Recent results
    const results = await Result.find({ student: student._id })
      .populate('examId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Upcoming exams
    const upcomingExams = await Exam.find({
      class: student.class,
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(5);

    const studentData = student.toObject();

    res.status(200).json({
      success: true,
      dashboard: {
        student: studentData,
        stats: {
          attendance: parseFloat(attendancePercentage) || 0,
          gpa: 3.8,
          feeStatus: pendingFees.length === 0 ? 'Paid' : 'Pending',
          assignments: 0,
          subjects: 0,
        },
        attendance: {
          totalDays,
          presentDays,
          attendancePercentage,
        },
        fees: {
          total: totalFeeAmount,
          paid: paidFeeAmount,
          pending: pendingFees.length,
          pendingAmount: pendingFees.reduce(
            (sum, f) => sum + (f.remainingAmount || f.amount),
            0
          ),
        },
        recentResults: results,
        upcomingExams,
        profileCompletion: completion,
      },
    });
  } catch (error) {
    console.error('❌ Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard',
    });
  }
};

// ============================================
// GET STUDENT PROFILE (for logged-in student)
// ============================================
export const getStudentProfile = async (req, res) => {
  try {
    console.log('📥 Fetching student profile for user:', req.user.id);
    console.log('📥 User role:', req.user.role);

    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email avatar phone address role')
      .populate('class', 'name code')
      .populate('section', 'name');

    console.log('📥 Student found:', student ? student._id : 'NO STUDENT FOUND');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please contact administration.',
      });
    }

    const studentData = student.toObject();

    res.status(200).json({
      success: true,
      student: studentData,
    });
  } catch (error) {
    console.error('❌ Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student profile',
    });
  }
};