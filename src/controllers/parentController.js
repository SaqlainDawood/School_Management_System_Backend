import Parent from '../models/Parent.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';

// ============================================
// GET ALL PARENTS
// ============================================
export const getParents = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' },
        role: 'parent',
      }).select('_id');
      const userIds = users.map((u) => u._id);
      query.user = { $in: userIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [parents, total] = await Promise.all([
      Parent.find(query)
        .populate('user', 'name email phone avatar')
        .populate('children', 'name rollNumber studentId class')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Parent.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      parents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE PARENT
// ============================================
export const getParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate('user', 'name email phone avatar address')
      .populate('children', 'name rollNumber studentId class section');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      parent.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this parent',
      });
    }

    res.status(200).json({
      success: true,
      parent,
    });
  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE PARENT
// ============================================
export const createParent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      relationship,
      occupation,
      company,
      children,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'parent123',
      role: 'parent',
      phone: phone || '',
      address: address || '',
      isActive: true,
      isVerified: true,
    });

    const parent = await Parent.create({
      user: user._id,
      relationship: relationship || 'guardian',
      occupation: occupation || '',
      company: company || '',
      phone: phone || '',
      address: address || '',
      children: children || [],
    });

    if (children && children.length > 0) {
      await Student.updateMany(
        { _id: { $in: children } },
        { parent: parent._id }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      parent,
      temporaryPassword: password || 'parent123',
    });
  } catch (error) {
    console.error('Create parent error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE PARENT
// ============================================
export const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      parent.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this parent',
      });
    }

    const { children, ...updateData } = req.body;

    const updatedParent = await Parent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (children) {
      await Student.updateMany(
        { parent: parent._id },
        { $unset: { parent: 1 } }
      );
      await Student.updateMany(
        { _id: { $in: children } },
        { parent: parent._id }
      );
      updatedParent.children = children;
      await updatedParent.save();
    }

    if (req.body.name || req.body.phone || req.body.address) {
      await User.findByIdAndUpdate(parent.user, {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Parent updated successfully',
      parent: updatedParent,
    });
  } catch (error) {
    console.error('Update parent error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE PARENT
// ============================================
export const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
      });
    }

    await Student.updateMany({ parent: parent._id }, { $unset: { parent: 1 } });
    await User.findByIdAndDelete(parent.user);
    await parent.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Parent deleted successfully',
    });
  } catch (error) {
    console.error('Delete parent error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET PARENT CHILDREN
// ============================================
export const getParentChildren = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id).populate({
      path: 'children',
      populate: [
        { path: 'user', select: 'name email phone avatar' },
        { path: 'class', select: 'name code' },
        { path: 'section', select: 'name' },
      ],
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      parent.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these children',
      });
    }

    res.status(200).json({
      success: true,
      children: parent.children,
    });
  } catch (error) {
    console.error('Get parent children error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET PARENT DASHBOARD
// ============================================
export const getParentDashboard = async (req, res) => {
  try {
    const parent = await Parent.findOne({ user: req.user.id }).populate({
      path: 'children',
      populate: [
        { path: 'user', select: 'name email phone' },
        { path: 'class', select: 'name code' },
        { path: 'section', select: 'name' },
      ],
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent profile not found',
      });
    }

    const childrenStats = await Promise.all(
      parent.children.map(async (child) => {
        const attendance = await Attendance.find({ student: child._id });
        const totalDays = attendance.length;
        const presentDays = attendance.filter(
          (a) => a.status === 'present'
        ).length;
        const attendancePercentage =
          totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

        const results = await Result.find({
          student: child._id,
          isPublished: true,
        })
          .populate('exam', 'name')
          .sort({ createdAt: -1 })
          .limit(5);

        const fees = await Fee.find({ student: child._id });
        const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
        const paidFees = fees
          .filter((f) => f.status === 'paid')
          .reduce((sum, f) => sum + f.amount, 0);
        const pendingFees = fees
          .filter((f) => f.status === 'pending' || f.status === 'overdue')
          .reduce((sum, f) => sum + (f.remainingAmount || f.amount), 0);

        return {
          child,
          attendance: { totalDays, presentDays, attendancePercentage },
          results: results,
          fees: { totalFees, paidFees, pendingFees },
        };
      })
    );

    res.status(200).json({
      success: true,
      dashboard: {
        parent,
        childrenStats,
        totalChildren: parent.children.length,
      },
    });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CHILD ATTENDANCE FOR PARENT
// ============================================
export const getChildAttendance = async (req, res) => {
  try {
    const { childId } = req.params;
    const { month, year } = req.query;

    const parent = await Parent.findOne({
      user: req.user.id,
      children: childId,
    });

    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's attendance",
      });
    }

    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find({
      student: childId,
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
    console.error('Get child attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CHILD RESULTS FOR PARENT
// ============================================
export const getChildResults = async (req, res) => {
  try {
    const { childId } = req.params;

    const parent = await Parent.findOne({
      user: req.user.id,
      children: childId,
    });

    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's results",
      });
    }

    const results = await Result.find({
      student: childId,
      isPublished: true,
    })
      .populate('exam', 'name type')
      .populate('class', 'name code')
      .populate('marks.subject', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Get child results error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CHILD FEES FOR PARENT
// ============================================
export const getChildFees = async (req, res) => {
  try {
    const { childId } = req.params;

    const parent = await Parent.findOne({
      user: req.user.id,
      children: childId,
    });

    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this child's fees",
      });
    }

    const fees = await Fee.find({ student: childId })
      .populate('class', 'name code')
      .sort({ dueDate: 1 });

    const summary = {
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      paidAmount: fees
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingAmount: fees
        .filter((f) => f.status === 'pending' || f.status === 'overdue')
        .reduce((sum, f) => sum + (f.remainingAmount || f.amount), 0),
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
    console.error('Get child fees error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};