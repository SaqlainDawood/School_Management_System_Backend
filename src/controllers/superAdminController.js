import School from '../models/School.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';

// ============================================
// GET SUPER ADMIN DASHBOARD
// ============================================
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [schools, students, teachers, fees] = await Promise.all([
      School.countDocuments(),
      Student.countDocuments(),
      Teacher.countDocuments(),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalRevenue = fees[0]?.total || 0;

    const recentSchools = await School.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    res.status(200).json({
      success: true,
      stats: {
        totalSchools: schools,
        totalStudents: students,
        totalTeachers: teachers,
        totalRevenue,
      },
      recentSchools,
      recentUsers,
    });
  } catch (error) {
    console.error('Get super admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE SCHOOLS
// ============================================
export const manageSchools = async (req, res) => {
  try {
    const { action, schoolId, data } = req.body;

    switch (action) {
      case 'create':
        const newSchool = await School.create(data);
        return res.status(201).json({
          success: true,
          message: 'School created successfully',
          school: newSchool,
        });

      case 'update':
        const updatedSchool = await School.findByIdAndUpdate(schoolId, data, {
          new: true,
          runValidators: true,
        });
        return res.status(200).json({
          success: true,
          message: 'School updated successfully',
          school: updatedSchool,
        });

      case 'delete':
        await School.findByIdAndDelete(schoolId);
        return res.status(200).json({
          success: true,
          message: 'School deleted successfully',
        });

      case 'activate':
        const activatedSchool = await School.findByIdAndUpdate(
          schoolId,
          { isActive: true },
          { new: true }
        );
        return res.status(200).json({
          success: true,
          message: 'School activated successfully',
          school: activatedSchool,
        });

      case 'deactivate':
        const deactivatedSchool = await School.findByIdAndUpdate(
          schoolId,
          { isActive: false },
          { new: true }
        );
        return res.status(200).json({
          success: true,
          message: 'School deactivated successfully',
          school: deactivatedSchool,
        });

      default:
        return res.status(400).json({
          success: false,
          message:
            'Invalid action. Use: create, update, delete, activate, or deactivate',
        });
    }
  } catch (error) {
    console.error('Manage school error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL SCHOOLS
// ============================================
export const getSchools = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.isActive = status === 'active';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schools, total] = await Promise.all([
      School.find(query)
        .populate('adminId', 'name email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      School.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get schools error:', error);
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
      case 'create':
        const newUser = await User.create(data);
        return res.status(201).json({
          success: true,
          message: 'User created successfully',
          user: newUser,
        });

      case 'update':
        const updatedUser = await User.findByIdAndUpdate(userId, data, {
          new: true,
          runValidators: true,
        }).select('-password');
        return res.status(200).json({
          success: true,
          message: 'User updated successfully',
          user: updatedUser,
        });

      case 'delete':
        await User.findByIdAndDelete(userId);
        return res.status(200).json({
          success: true,
          message: 'User deleted successfully',
        });

      case 'activate':
        const activatedUser = await User.findByIdAndUpdate(
          userId,
          { isActive: true },
          { new: true }
        ).select('-password');
        return res.status(200).json({
          success: true,
          message: 'User activated successfully',
          user: activatedUser,
        });

      case 'deactivate':
        const deactivatedUser = await User.findByIdAndUpdate(
          userId,
          { isActive: false },
          { new: true }
        ).select('-password');
        return res.status(200).json({
          success: true,
          message: 'User deactivated successfully',
          user: deactivatedUser,
        });

      default:
        return res.status(400).json({
          success: false,
          message:
            'Invalid action. Use: create, update, delete, activate, or deactivate',
        });
    }
  } catch (error) {
    console.error('Manage user error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL USERS
// ============================================
export const getUsers = async (req, res) => {
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE ROLES
// ============================================
export const manageRoles = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      user,
    });
  } catch (error) {
    console.error('Manage role error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SYSTEM ANALYTICS
// ============================================
export const getSystemAnalytics = async (req, res) => {
  try {
    const [totalSchools, totalStudents, totalTeachers, totalRevenue] =
      await Promise.all([
        School.countDocuments(),
        Student.countDocuments(),
        Teacher.countDocuments(),
        Fee.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    const growthData = [];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 12; i++) {
      const month = i + 1;
      const startDate = new Date(currentYear, month - 1, 1);
      const endDate = new Date(currentYear, month, 0);

      const count = await Student.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      growthData.push({
        month: months[i],
        students: count,
      });
    }

    const recentActivities = await User.find()
      .sort({ lastLogin: -1 })
      .limit(10)
      .select('name email role lastLogin');

    res.status(200).json({
      success: true,
      analytics: {
        summary: {
          totalSchools,
          totalStudents,
          totalTeachers,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        growth: growthData,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Get system analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE SUBSCRIPTIONS
// ============================================
export const manageSubscriptions = async (req, res) => {
  try {
    const { schoolId, plan, status } = req.body;

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    school.subscription = {
      plan: plan || school.subscription?.plan || 'basic',
      status: status || school.subscription?.status || 'active',
      startDate: school.subscription?.startDate || new Date(),
      endDate:
        school.subscription?.endDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    await school.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      school,
    });
  } catch (error) {
    console.error('Manage subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ACTIVITY LOGS
// ============================================
export const getActivityLogs = async (req, res) => {
  try {
    const logs = [];

    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    users.forEach((user) => {
      logs.push({
        type: 'user',
        action: 'created',
        user: user.name,
        details: `New ${user.role} account created`,
        timestamp: user.createdAt,
      });
    });

    const schools = await School.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('adminId', 'name');

    schools.forEach((school) => {
      logs.push({
        type: 'school',
        action: 'created',
        user: school.adminId?.name || 'Unknown',
        details: `New school "${school.name}" created`,
        timestamp: school.createdAt,
      });
    });

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedLogs = logs.slice(start, end);

    res.status(200).json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: logs.length,
        pages: Math.ceil(logs.length / limit),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};