import Department from '../models/Department.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Result from '../models/Result.js';
import Notice from '../models/Notice.js';
import User from '../models/User.js';

// ============================================
// GET COORDINATOR DASHBOARD
// ============================================
export const getCoordinatorDashboard = async (req, res) => {
  try {
    const departments = await Department.find({ coordinator: req.user.id });

    const departmentIds = departments.map((d) => d._id);

    const [teachers, students, attendance] = await Promise.all([
      Teacher.countDocuments({ department: { $in: departmentIds } }),
      Student.countDocuments({ department: { $in: departmentIds } }),
      Attendance.countDocuments({
        date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: 'present',
    });

    res.status(200).json({
      success: true,
      dashboard: {
        departments: departments.length,
        teachers,
        students,
        attendance: {
          total: attendance,
          present: presentToday,
          percentage:
            attendance > 0
              ? ((presentToday / attendance) * 100).toFixed(2)
              : 0,
        },
        departments,
      },
    });
  } catch (error) {
    console.error('Get coordinator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL DEPARTMENTS
// ============================================
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('coordinator', 'name email')
      .populate('teachers', 'name teacherId')
      .populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE DEPARTMENT
// ============================================
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, coordinator } = req.body;

    const existingDepartment = await Department.findOne({ code });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists',
      });
    }

    const department = await Department.create({
      name,
      code,
      description: description || '',
      coordinator: coordinator || req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department,
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE DEPARTMENT
// ============================================
export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department: updatedDepartment,
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE DEPARTMENT
// ============================================
export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// VERIFY FEE
// ============================================
export const verifyFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.feeId);
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found',
      });
    }

    fee.verifiedBy = req.user.id;
    fee.verifiedDate = new Date();
    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Fee verified successfully',
      fee,
    });
  } catch (error) {
    console.error('Verify fee error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REVIEW RESULT
// ============================================
export const reviewResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    const { status, remarks } = req.body;
    result.status = status || result.status;
    if (remarks) result.remarks = remarks;
    await result.save();

    res.status(200).json({
      success: true,
      message: 'Result reviewed successfully',
      result,
    });
  } catch (error) {
    console.error('Review result error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// MANAGE NOTICES
// ============================================
export const manageNotices = async (req, res) => {
  try {
    const { title, content, type, audience, priority } = req.body;

    const notice = await Notice.create({
      title,
      content,
      type: type || 'general',
      audience: audience || ['all'],
      priority: priority || 'medium',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      notice,
    });
  } catch (error) {
    console.error('Manage notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE REPORTS
// ============================================
export const generateReports = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let report = {};

    switch (type) {
      case 'attendance':
        const attendance = await Attendance.find({
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });
        report = {
          type: 'attendance',
          total: attendance.length,
          present: attendance.filter((a) => a.status === 'present').length,
          absent: attendance.filter((a) => a.status === 'absent').length,
          late: attendance.filter((a) => a.status === 'late').length,
        };
        break;

      case 'fees':
        const fees = await Fee.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });
        report = {
          type: 'fees',
          total: fees.length,
          totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
          paid: fees.filter((f) => f.status === 'paid').length,
          pending: fees.filter((f) => f.status === 'pending').length,
          overdue: fees.filter((f) => f.status === 'overdue').length,
        };
        break;

      case 'results':
        const results = await Result.find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        });
        report = {
          type: 'results',
          total: results.length,
          passed: results.filter((r) => r.status === 'pass').length,
          failed: results.filter((r) => r.status === 'fail').length,
          average:
            results.reduce((sum, r) => sum + r.percentage, 0) /
            (results.length || 1),
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Use: attendance, fees, or results',
        });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ATTENDANCE OVERVIEW
// ============================================
export const getAttendanceOverview = async (req, res) => {
  try {
    const { departmentId, startDate, endDate } = req.query;

    const query = {};
    if (departmentId) query.department = departmentId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('class', 'name code');

    const byClass = {};
    attendance.forEach((record) => {
      const className = record.class?.name || 'Unknown';
      if (!byClass[className]) {
        byClass[className] = { total: 0, present: 0, absent: 0 };
      }
      byClass[className].total++;
      if (record.status === 'present') byClass[className].present++;
      if (record.status === 'absent') byClass[className].absent++;
    });

    res.status(200).json({
      success: true,
      overview: {
        total: attendance.length,
        byClass,
        records: attendance,
      },
    });
  } catch (error) {
    console.error('Get attendance overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};