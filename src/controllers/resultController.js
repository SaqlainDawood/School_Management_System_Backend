import mongoose from 'mongoose';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Subject from '../models/Subject.js';

// Helper function to calculate grade
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

// @desc    Get student results
// @route   GET /api/results/student
// @access  Private (Student)
export const getStudentResults = async (req, res) => {
  try {
    console.log('Fetching results for user:', req.user);

    let studentId = req.user.studentId || req.user._id;

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ userId: req.user._id }, { studentId: req.user.studentId }],
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found. Please contact administration.',
        });
      }

      studentId = student._id;
    }

    console.log('Student ID:', studentId);

    const results = await Result.find({ studentId: studentId })
      .populate('examId', 'name type date')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    console.log(`Found ${results.length} results`);

    if (!results || results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No results found for this student',
        results: [],
      });
    }

    const formattedResults = results.map((result) => {
      const percentage =
        result.percentage ||
        (result.totalMarks > 0
          ? (result.obtainedMarks / result.totalMarks) * 100
          : 0);
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
        gradePoint: result.gradePoint || gradeInfo.gradePoint,
        gpa: result.gpa || gradeInfo.gradePoint,
        status: result.status || (percentage >= 40 ? 'pass' : 'fail'),
        semester: result.semester || 'Semester 1',
        academicYear:
          result.academicYear || new Date().getFullYear().toString(),
        subjects: result.subjects || [],
        remarks: result.remarks || '',
        date: result.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedResults.length,
      results: formattedResults,
    });
  } catch (error) {
    console.error('Error in getStudentResults:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get result by ID
// @route   GET /api/results/:id
// @access  Private
export const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name rollNumber studentId')
      .populate('examId', 'name type date')
      .populate('subjectId', 'name code');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    const studentId = req.user.studentId || req.user._id;
    if (
      result.studentId._id.toString() !== studentId.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this result',
      });
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error in getResultById:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get student subject-wise performance
// @route   GET /api/results/subject-performance
// @access  Private
export const getSubjectPerformance = async (req, res) => {
  try {
    let studentId = req.user.studentId || req.user._id;

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ userId: req.user._id }, { studentId: req.user.studentId }],
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
      }
      studentId = student._id;
    }

    const results = await Result.find({ studentId: studentId });

    const subjectMap = {};
    results.forEach((result) => {
      if (result.subjects && result.subjects.length > 0) {
        result.subjects.forEach((sub) => {
          if (!subjectMap[sub.name]) {
            subjectMap[sub.name] = {
              name: sub.name,
              totalMarks: 0,
              obtainedMarks: 0,
              count: 0,
              percentages: [],
            };
          }
          subjectMap[sub.name].totalMarks += sub.totalMarks || 100;
          subjectMap[sub.name].obtainedMarks += sub.obtainedMarks || 0;
          subjectMap[sub.name].count += 1;
          const percentage =
            sub.totalMarks > 0
              ? (sub.obtainedMarks / sub.totalMarks) * 100
              : 0;
          subjectMap[sub.name].percentages.push(percentage);
        });
      }
    });

    const subjectPerformance = Object.values(subjectMap).map((sub) => ({
      name: sub.name,
      averagePercentage:
        sub.percentages.length > 0
          ? sub.percentages.reduce((a, b) => a + b, 0) /
            sub.percentages.length
          : 0,
      totalMarks: sub.totalMarks,
      obtainedMarks: sub.obtainedMarks,
      overallPercentage:
        sub.totalMarks > 0 ? (sub.obtainedMarks / sub.totalMarks) * 100 : 0,
    }));

    res.status(200).json({
      success: true,
      subjectPerformance,
    });
  } catch (error) {
    console.error('Error in getSubjectPerformance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get semester-wise performance
// @route   GET /api/results/semester-performance
// @access  Private
export const getSemesterPerformance = async (req, res) => {
  try {
    let studentId = req.user.studentId || req.user._id;

    if (req.user.role === 'student') {
      const student = await Student.findOne({
        $or: [{ userId: req.user._id }, { studentId: req.user.studentId }],
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student record not found',
        });
      }
      studentId = student._id;
    }

    const results = await Result.find({ studentId: studentId });

    const semesterMap = {};
    results.forEach((result) => {
      const semester = result.semester || 'Semester 1';
      if (!semesterMap[semester]) {
        semesterMap[semester] = {
          name: semester,
          percentages: [],
          grades: [],
        };
      }
      const percentage =
        result.percentage ||
        (result.totalMarks > 0
          ? (result.obtainedMarks / result.totalMarks) * 100
          : 0);
      semesterMap[semester].percentages.push(percentage);
      semesterMap[semester].grades.push(result.grade || 'F');
    });

    const semesterPerformance = Object.entries(semesterMap).map(
      ([name, data]) => {
        const avgPercentage =
          data.percentages.length > 0
            ? data.percentages.reduce((a, b) => a + b, 0) /
              data.percentages.length
            : 0;

        const gradeOrder = [
          'F',
          'D',
          'C',
          'C+',
          'B-',
          'B',
          'B+',
          'A-',
          'A',
          'A+',
        ];
        let bestGrade = 'F';
        data.grades.forEach((grade) => {
          if (gradeOrder.indexOf(grade) > gradeOrder.indexOf(bestGrade)) {
            bestGrade = grade;
          }
        });

        return {
          name,
          averagePercentage: avgPercentage,
          bestGrade: bestGrade,
          totalExams: data.percentages.length,
        };
      }
    );

    res.status(200).json({
      success: true,
      semesterPerformance,
    });
  } catch (error) {
    console.error('Error in getSemesterPerformance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Create new result (Admin/Teacher only)
// @route   POST /api/results
// @access  Private (Admin/Teacher)
export const createResult = async (req, res) => {
  try {
    const {
      studentId,
      examId,
      examName,
      examType,
      examDate,
      subjectId,
      subjectName,
      obtainedMarks,
      totalMarks,
      semester,
      academicYear,
      subjects,
      remarks,
    } = req.body;

    if (!studentId || !obtainedMarks || !totalMarks) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, obtained marks, and total marks are required',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const result = await Result.create({
      studentId,
      examId,
      examName: examName || 'Exam',
      examType: examType || 'Regular',
      examDate: examDate || new Date(),
      subjectId,
      subjectName: subjectName || 'General',
      obtainedMarks,
      totalMarks,
      semester: semester || 'Semester 1',
      academicYear: academicYear || new Date().getFullYear().toString(),
      subjects: subjects || [],
      remarks: remarks || '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      result,
    });
  } catch (error) {
    console.error('Error in createResult:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating result',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Update result (Admin/Teacher only)
// @route   PUT /api/results/:id
// @access  Private (Admin/Teacher)
export const updateResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    const updatedResult = await Result.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      result: updatedResult,
    });
  } catch (error) {
    console.error('Error in updateResult:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating result',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Delete result (Admin only)
// @route   DELETE /api/results/:id
// @access  Private (Admin only)
export const deleteResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found',
      });
    }

    await result.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteResult:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting result',
      error:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};