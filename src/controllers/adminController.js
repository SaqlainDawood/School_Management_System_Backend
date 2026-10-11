import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Fee from '../models/Fee.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// ============================================
// GET ADMIN DASHBOARD
// ============================================
export const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();

    const feeResult = await Fee.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = feeResult[0]?.total || 0;

    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name');

    const recentFees = await Fee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'name');

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalRevenue,
      },
      recentActivities: {
        students: recentStudents,
        fees: recentFees,
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SCHOOL STATISTICS
// ============================================
export const getSchoolStats = async (req, res) => {
  try {
    const [students, teachers, classes, fees] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Fee.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'present',
    });

    const totalRevenue = fees
      .filter((f) => f._id === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);

    res.status(200).json({
      success: true,
      stats: {
        students,
        teachers,
        classes,
        revenue: totalRevenue,
        attendance: {
          total: todayAttendance,
          present: presentToday,
          percentage:
            todayAttendance > 0
              ? ((presentToday / todayAttendance) * 100).toFixed(2)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get school stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE USERS
// ============================================
export const manageUsers = async (req, res) => {
  try {
    const { action, userId, data } = req.body;

    switch (action) {
      case 'activate':
        await User.findByIdAndUpdate(userId, { isActive: true });
        break;
      case 'deactivate':
        await User.findByIdAndUpdate(userId, { isActive: false });
        break;
      case 'update':
        await User.findByIdAndUpdate(userId, data);
        break;
      case 'delete':
        await User.findByIdAndDelete(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message:
            'Invalid action. Use: activate, deactivate, update, or delete',
        });
    }

    res.status(200).json({
      success: true,
      message: `User ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Manage users error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE CLASSES
// ============================================
export const manageClasses = async (req, res) => {
  try {
    const { action, classId, data } = req.body;

    switch (action) {
      case 'create':
        const newClass = await Class.create(data);
        return res.status(201).json({
          success: true,
          message: 'Class created successfully',
          class: newClass,
        });
      case 'update':
        const updatedClass = await Class.findByIdAndUpdate(classId, data, {
          new: true,
        });
        return res.status(200).json({
          success: true,
          message: 'Class updated successfully',
          class: updatedClass,
        });
      case 'delete':
        await Class.findByIdAndDelete(classId);
        return res.status(200).json({
          success: true,
          message: 'Class deleted successfully',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: create, update, or delete',
        });
    }
  } catch (error) {
    console.error('Manage classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET RECENT ACTIVITIES
// ============================================
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [students, fees, attendances] = await Promise.all([
      Student.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'name'),
      Fee.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('student', 'name'),
      Attendance.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('student', 'name'),
    ]);

    const activities = [];

    students.forEach((s) => {
      activities.push({
        type: 'student',
        action: 'new_student',
        message: `New student ${s.user?.name || 'Unknown'} enrolled`,
        timestamp: s.createdAt,
        data: s,
      });
    });

    fees.forEach((f) => {
      activities.push({
        type: 'fee',
        action: f.status === 'paid' ? 'fee_paid' : 'fee_created',
        message: `Fee ${f.status} for ${f.student?.name || 'Unknown'}`,
        timestamp: f.createdAt,
        data: f,
      });
    });

    attendances.forEach((a) => {
      activities.push({
        type: 'attendance',
        action: 'attendance_marked',
        message: `Attendance marked for ${a.student?.name || 'Unknown'}`,
        timestamp: a.createdAt,
        data: a,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.status(200).json({
      success: true,
      activities: limitedActivities,
      total: limitedActivities.length,
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL USERS
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SETTINGS
// ============================================
export const getSettings = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      settings: {
        schoolName: 'School Management System',
        academicYear: '2026-2027',
        semester: 'Semester 1',
        gradingSystem: 'percentage',
        attendanceType: 'daily',
        language: 'en',
        theme: 'light',
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE SETTINGS
// ============================================
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: updates,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ADMIN PROFILE
// ============================================
export const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};