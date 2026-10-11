// controllers/attendanceController.js
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';

// ============================================
// MARK ATTENDANCE
// ============================================
export const markAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      status,
      date,
      semester,
      subjectId,
      reason,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: date || new Date(),
      class: classId,
      subject: subjectId,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student today',
      });
    }

    const attendance = await Attendance.create({
      student: studentId,
      class: classId,
      date: date || new Date(),
      status,
      semester,
      subject: subjectId,
      reason: reason || '',
      markedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ATTENDANCE
// ============================================
export const getAttendance = async (req, res) => {
  try {
    const { studentId, classId, date, startDate, endDate } = req.query;

    const query = {};
    if (studentId) query.student = studentId;
    if (classId) query.class = classId;
    if (date) query.date = new Date(date);
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code')
      .populate('subject', 'name')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE ATTENDANCE
// ============================================
export const updateAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CLASS ATTENDANCE - COMPLETE FIXED
// ============================================
export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    console.log('📡 Get class attendance:', { classId, date });

    // Validate class ID
    if (!classId || classId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid class ID format. Class ID must be 24 characters.',
      });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found.',
      });
    }

    // Get students in this class
    const students = await Student.find({ class: classId })
      .populate('user', 'name email phone')
      .lean();

    // Validate date
    let attendanceDate = new Date();
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        attendanceDate = parsedDate;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD.',
        });
      }
    }

    // Set start and end of day
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing attendance for this class and date
    const existingAttendance = await Attendance.find({
      class: classId,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('student', 'name rollNumber studentId')
      .populate('subject', 'name')
      .lean();

    console.log(`📊 Found ${existingAttendance.length} attendance records`);
    console.log(`📊 Found ${students.length} students in class`);

    // Group attendance by student
    const groupedAttendance = {};

    // Initialize with all students
    students.forEach((student) => {
      groupedAttendance[student._id.toString()] = {
        student: {
          _id: student._id,
          name: student.user?.name || 'Unknown',
          rollNumber: student.rollNumber,
          studentId: student.studentId,
          email: student.user?.email || '',
          phone: student.user?.phone || '',
        },
        records: [],
      };
    });

    // Add attendance records
    existingAttendance.forEach((record) => {
      const studentId =
        record.student?._id?.toString() || record.student?.toString();
      if (studentId && groupedAttendance[studentId]) {
        groupedAttendance[studentId].records.push({
          _id: record._id,
          status: record.status,
          date: record.date,
          subject: record.subject,
          reason: record.reason || '',
          markedBy: record.markedBy,
        });
      }
    });

    const attendanceArray = Object.values(groupedAttendance);

    res.status(200).json({
      success: true,
      message: 'Attendance fetched successfully',
      class: classData,
      date: attendanceDate,
      attendance: attendanceArray,
      totalStudents: students.length,
      totalRecords: existingAttendance.length,
    });
  } catch (error) {
    console.error('❌ Get class attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance',
    });
  }
};

// ============================================
// GET STUDENT ATTENDANCE
// ============================================
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const student = await Student.findById(studentId);
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
      student: studentId,
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
// GET ATTENDANCE REPORT
// ============================================
export const getAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code')
      .sort({ date: 1 });

    const report = {
      totalRecords: attendance.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      excused: attendance.filter((a) => a.status === 'excused').length,
      byStudent: {},
    };

    attendance.forEach((record) => {
      const studentId = record.student._id.toString();
      if (!report.byStudent[studentId]) {
        report.byStudent[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }
      report.byStudent[studentId][record.status]++;
    });

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET MY ATTENDANCE (for logged-in student)
// ============================================
export const getMyAttendance = async (req, res) => {
  try {
    console.log('📥 Fetching attendance for logged-in student');

    const { month, year } = req.query;

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    console.log('👨‍🎓 Student found:', student._id);

    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find({
      student: student._id,
      ...dateFilter,
    })
      .populate('class', 'name code')
      .populate('subject', 'name')
      .sort({ date: -1 });

    console.log('📊 Attendance records found:', attendance.length);

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
    console.error('❌ Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};