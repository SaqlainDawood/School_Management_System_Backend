import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import mongoose from 'mongoose';

// ============================================
// CREATE EXAM
// ============================================
export const createExam = async (req, res) => {
  try {
    console.log('📥 Received exam data:', req.body);

    const {
      name,
      code,
      type,
      class: classId,
      section,
      subjects,
      totalMarks,
      passingMarks,
      duration,
      instructions,
      academicYear,
      semester,
      startDate,
      endDate,
      status,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!code) missingFields.push('code');
    if (!type) missingFields.push('type');
    if (!classId) missingFields.push('class');
    if (!subjects || subjects.length === 0) missingFields.push('subjects');
    if (!totalMarks) missingFields.push('totalMarks');
    if (!passingMarks) missingFields.push('passingMarks');
    if (!duration) missingFields.push('duration');
    if (!academicYear) missingFields.push('academicYear');
    if (!semester) missingFields.push('semester');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate date logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    // Check if exam code exists
    const existingExam = await Exam.findOne({ code });
    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: 'Exam code already exists',
      });
    }

    const examData = {
      name,
      code,
      type,
      class: classId,
      section: section || null,
      subjects: subjects || [],
      totalMarks: parseInt(totalMarks),
      passingMarks: parseInt(passingMarks),
      duration: parseInt(duration),
      instructions: instructions || '',
      academicYear,
      semester,
      startDate: start,
      endDate: end,
      status: status || 'draft',
      createdBy: req.user.id,
    };

    const exam = await Exam.create(examData);

    console.log('✅ Exam created:', exam._id);

    res.status(201).json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error('❌ Create exam error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${messages.join(', ')}`,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate exam code. Please use a different code.',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Please check your input.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create exam',
    });
  }
};

// ============================================
// GET ALL EXAMS
// ============================================
export const getExams = async (req, res) => {
  try {
    const { classId, status, academicYear } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    const exams = await Exam.find(query)
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subjects', 'name code')
      .populate('schedule.subject', 'name')
      .populate('schedule.invigilator', 'name')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE EXAM
// ============================================
export const getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subjects', 'name code')
      .populate('schedule.subject', 'name')
      .populate('schedule.invigilator', 'name')
      .populate('createdBy', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    res.status(200).json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE EXAM
// ============================================
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      exam: updatedExam,
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE EXAM
// ============================================
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    await Result.deleteMany({ exam: exam._id });
    await Exam.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// PUBLISH EXAM
// ============================================
export const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    exam.status = 'published';
    await exam.save();

    res.status(200).json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error('Publish exam error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET EXAM SCHEDULE
// ============================================
export const getExamSchedule = async (req, res) => {
  try {
    const { classId, studentId } = req.query;

    const query = { status: 'published' };
    if (classId) query.class = classId;

    const exams = await Exam.find(query)
      .populate('class', 'name code')
      .populate('schedule.subject', 'name')
      .populate('schedule.invigilator', 'name')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      exams,
    });
  } catch (error) {
    console.error('Get exam schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET EXAM RESULTS
// ============================================
export const getExamResults = async (req, res) => {
  try {
    const { id } = req.params;

    const results = await Result.find({ exam: id })
      .populate('student', 'name rollNumber studentId')
      .populate('class', 'name code')
      .populate('marks.subject', 'name code')
      .sort({ percentage: -1 });

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};