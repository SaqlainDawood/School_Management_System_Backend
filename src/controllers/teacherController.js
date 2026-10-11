import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import { sendWelcomeEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

// ============================================
// GET ALL TEACHERS
// ============================================
export const getTeachers = async (req, res) => {
  try {
    const { department, status, search } = req.query;

    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { teacherId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await Teacher.countDocuments(query);

    const teachers = await Teacher.find(query)
      .populate('user', 'name email avatar')
      .populate('classes', 'name code')
      .populate('subjects', 'name code')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      teachers,
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE TEACHER
// ============================================
export const createTeacher = async (req, res) => {
  try {
    console.log('📥 Received teacher data:', req.body);

    const {
      name,
      email,
      teacherId,
      qualification,
      specialization,
      dateOfBirth,
      gender,
      phone,
      address,
      department,
      designation,
      experience,
      salary,
      bankInfo,
      status,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    if (!teacherId) missingFields.push('teacherId');
    if (!qualification) missingFields.push('qualification');
    if (!specialization) missingFields.push('specialization');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!gender) missingFields.push('gender');
    if (!department) missingFields.push('department');
    if (!designation) missingFields.push('designation');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Check if teacher ID exists
    const existingTeacher = await Teacher.findOne({ teacherId });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID already exists',
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Create user
    const password = Math.random().toString(36).slice(-8);
    console.log('📝 Creating user with password:', password);

    const user = await User.create({
      name,
      email,
      password,
      role: 'teacher',
      phone: phone || '',
      address: address || '',
      isActive: true,
      isVerified: true,
    });

    console.log('✅ User created:', user._id);

    // Create teacher
    const teacherData = {
      user: user._id,
      teacherId,
      qualification,
      specialization,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phone: phone || '',
      address: address || '',
      department,
      designation,
      experience: experience || { years: 0, details: '' },
      salary: salary || { amount: 0, currency: 'PKR' },
      bankInfo: bankInfo || { bankName: '', accountNumber: '', routingNumber: '' },
      status: status || 'active',
      joinDate: new Date(),
    };

    const teacher = await Teacher.create(teacherData);
    console.log('✅ Teacher created:', teacher._id);

    // Send welcome email (non-critical)
    try {
      await sendWelcomeEmail(user, password);
    } catch (emailError) {
      console.warn('Email sending failed (non-critical):', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher,
      temporaryPassword: password,
    });
  } catch (error) {
    console.error('❌ Create teacher error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check your input.',
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. Teacher ID or Email already exists.',
      });
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
      message: error.message || 'Failed to create teacher',
    });
  }
};

// ============================================
// GET SINGLE TEACHER
// ============================================
export const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('user', 'name email avatar phone address')
      .populate('classes', 'name code')
      .populate('subjects', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE TEACHER
// ============================================
export const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const updateData = { ...req.body };
    delete updateData.user;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (req.body.name || req.body.email || req.body.phone) {
      await User.findByIdAndUpdate(teacher.user, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      });
    }

    res.status(200).json({
      success: true,
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE TEACHER
// ============================================
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    await User.findByIdAndDelete(teacher.user);
    await teacher.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET TEACHER CLASSES
// ============================================
export const getTeacherClasses = async (req, res) => {
  try {
    // Get teacher from user id
    const teacher = await Teacher.findOne({ user: req.user.id });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found',
      });
    }

    const classes = await Class.find({ classTeacher: teacher._id })
      .populate({
        path: 'students',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'name');

    res.status(200).json({
      success: true,
      classes,
    });
  } catch (error) {
    console.error('❌ Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET TEACHER DASHBOARD
// ============================================
export const getTeacherDashboard = async (req, res) => {
  try {
    // Get teacher from user id
    const teacher = await Teacher.findOne({ user: req.user.id })
      .populate('classes', 'name code')
      .populate('subjects', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found. Please contact administrator.',
      });
    }

    // Get today's attendance
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const todayAttendance = await Attendance.find({
      class: { $in: teacher.classes },
      date: { $gte: todayStart, $lte: todayEnd },
    });

    // Get pending assignments
    const assignments = await Assignment.find({
      teacher: teacher._id,
      dueDate: { $gte: new Date() },
      status: 'published',
    }).countDocuments();

    // Get students count
    const students = await Student.countDocuments({
      class: { $in: teacher.classes },
    });

    res.status(200).json({
      success: true,
      dashboard: {
        teacher,
        stats: {
          classes: teacher.classes.length || 0,
          subjects: teacher.subjects.length || 0,
          students: students || 0,
          pendingAssignments: assignments || 0,
          todayAttendance: todayAttendance.length || 0,
        },
        todayAttendance: todayAttendance || [],
      },
    });
  } catch (error) {
    console.error('❌ Get teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};