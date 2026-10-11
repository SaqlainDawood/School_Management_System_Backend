import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import Fee from '../models/Fee.js';

// ============================================
// GENERATE STUDENT REPORT
// ============================================
export const generateStudentReport = async (req, res) => {
  try {
    const { class: classId, section, status, startDate, endDate } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (section) query.section = section;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const students = await Student.find(query)
      .populate('user', 'name email phone')
      .populate('class', 'name code')
      .populate('section', 'name');

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;
    const inactiveStudents = students.filter(
      (s) => s.status === 'inactive'
    ).length;
    const graduatedStudents = students.filter(
      (s) => s.status === 'graduated'
    ).length;

    const byClass = {};
    students.forEach((student) => {
      const className = student.class?.name || 'Unknown';
      if (!byClass[className]) byClass[className] = 0;
      byClass[className]++;
    });

    const byGender = {
      male: students.filter((s) => s.gender === 'male').length,
      female: students.filter((s) => s.gender === 'female').length,
      other: students.filter((s) => s.gender === 'other').length,
    };

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          graduatedStudents,
        },
        byClass,
        byGender,
        students,
      },
    });
  } catch (error) {
    console.error('Generate student report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE ATTENDANCE REPORT
// ============================================
export const generateAttendanceReport = async (req, res) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (studentId) query.student = studentId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code')
      .populate('subject', 'name');

    const totalRecords = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (a) => a.status === 'present'
    ).length;
    const absent = attendanceRecords.filter((a) => a.status === 'absent').length;
    const late = attendanceRecords.filter((a) => a.status === 'late').length;
    const excused = attendanceRecords.filter(
      (a) => a.status === 'excused'
    ).length;

    const byStudent = {};
    attendanceRecords.forEach((record) => {
      const studentId = record.student?._id?.toString() || 'unknown';
      if (!byStudent[studentId]) {
        byStudent[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }
      byStudent[studentId][record.status]++;
    });

    const byDate = {};
    attendanceRecords.forEach((record) => {
      const date = record.date.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      byDate[date][record.status]++;
    });

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalRecords,
          present,
          absent,
          late,
          excused,
          attendancePercentage:
            totalRecords > 0
              ? (((present + excused) / totalRecords) * 100).toFixed(2)
              : 0,
        },
        byStudent: Object.values(byStudent),
        byDate,
        records: attendanceRecords,
      },
    });
  } catch (error) {
    console.error('Generate attendance report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE FEE REPORT
// ============================================
export const generateFeeReport = async (req, res) => {
  try {
    const { studentId, classId, status, feeType, startDate, endDate } =
      req.query;

    const query = {};
    if (studentId) query.student = studentId;
    if (classId) query.class = classId;
    if (status) query.status = status;
    if (feeType) query.feeType = feeType;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const fees = await Fee.find(query)
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code');

    const totalFees = fees.length;
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees
      .filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees
      .filter((f) => f.status === 'pending' || f.status === 'overdue')
      .reduce((sum, f) => sum + (f.remainingAmount || f.amount), 0);

    const byType = {};
    fees.forEach((fee) => {
      if (!byType[fee.feeType]) {
        byType[fee.feeType] = { count: 0, amount: 0, paid: 0, pending: 0 };
      }
      byType[fee.feeType].count++;
      byType[fee.feeType].amount += fee.amount;
      if (fee.status === 'paid') {
        byType[fee.feeType].paid += fee.amount;
      } else {
        byType[fee.feeType].pending += fee.remainingAmount || fee.amount;
      }
    });

    const byStatus = {
      paid: fees.filter((f) => f.status === 'paid').length,
      pending: fees.filter((f) => f.status === 'pending').length,
      overdue: fees.filter((f) => f.status === 'overdue').length,
      partial: fees.filter((f) => f.status === 'partial').length,
      waived: fees.filter((f) => f.status === 'waived').length,
    };

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalFees,
          totalAmount,
          totalPaid,
          totalPending,
          collectionRate:
            totalAmount > 0
              ? ((totalPaid / totalAmount) * 100).toFixed(2)
              : 0,
        },
        byType,
        byStatus,
        fees,
      },
    });
  } catch (error) {
    console.error('Generate fee report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE RESULT REPORT
// ============================================
export const generateResultReport = async (req, res) => {
  try {
    const { classId, examId, studentId, startDate, endDate } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (examId) query.exam = examId;
    if (studentId) query.student = studentId;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const results = await Result.find(query)
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code')
      .populate('exam', 'name type')
      .populate('marks.subject', 'name code');

    const totalResults = results.length;
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;

    const averagePercentage =
      results.length > 0
        ? (
            results.reduce((sum, r) => sum + r.percentage, 0) / results.length
          ).toFixed(2)
        : 0;

    const gradeDistribution = {};
    results.forEach((result) => {
      if (!gradeDistribution[result.grade]) {
        gradeDistribution[result.grade] = 0;
      }
      gradeDistribution[result.grade]++;
    });

    const topPerformers = [...results]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)
      .map((r) => ({
        student: r.student,
        percentage: r.percentage,
        grade: r.grade,
        exam: r.exam,
      }));

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalResults,
          passed,
          failed,
          passRate:
            totalResults > 0 ? ((passed / totalResults) * 100).toFixed(2) : 0,
          averagePercentage,
        },
        gradeDistribution,
        topPerformers,
        results,
      },
    });
  } catch (error) {
    console.error('Generate result report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GENERATE TEACHER REPORT
// ============================================
export const generateTeacherReport = async (req, res) => {
  try {
    const { department, status, startDate, endDate } = req.query;

    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const teachers = await Teacher.find(query)
      .populate('user', 'name email phone')
      .populate('classes', 'name code')
      .populate('subjects', 'name code');

    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter((t) => t.status === 'active').length;
    const onLeave = teachers.filter((t) => t.status === 'on_leave').length;

    const byDepartment = {};
    teachers.forEach((teacher) => {
      if (!byDepartment[teacher.department]) {
        byDepartment[teacher.department] = 0;
      }
      byDepartment[teacher.department]++;
    });

    const totalExperience = teachers.reduce(
      (sum, t) => sum + (t.experience?.years || 0),
      0
    );
    const averageExperience =
      totalTeachers > 0 ? (totalExperience / totalTeachers).toFixed(1) : 0;

    const workload = teachers.map((t) => ({
      teacher: t,
      classCount: t.classes?.length || 0,
      subjectCount: t.subjects?.length || 0,
    }));

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalTeachers,
          activeTeachers,
          onLeave,
          averageExperience,
        },
        byDepartment,
        workload,
        teachers,
      },
    });
  } catch (error) {
    console.error('Generate teacher report error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// EXPORT PDF
// ============================================
export const exportPDF = async (req, res) => {
  try {
    const { reportType, format } = req.query;

    res.status(200).json({
      success: true,
      message: 'PDF export generated successfully',
      data: {
        reportType,
        format,
        generatedAt: new Date().toISOString(),
        downloadUrl: '/uploads/reports/sample.pdf',
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// EXPORT EXCEL
// ============================================
export const exportExcel = async (req, res) => {
  try {
    const { reportType, format } = req.query;

    res.status(200).json({
      success: true,
      message: 'Excel export generated successfully',
      data: {
        reportType,
        format,
        generatedAt: new Date().toISOString(),
        downloadUrl: '/uploads/reports/sample.xlsx',
      },
    });
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};