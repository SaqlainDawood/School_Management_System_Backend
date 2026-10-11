import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import mongoose from 'mongoose';

// ============================================
// CREATE ASSIGNMENT
// ============================================
export const createAssignment = async (req, res) => {
  try {
    console.log('📥 Received assignment data:', req.body);

    const {
      title,
      description,
      class: classId,
      section,
      subject,
      dueDate,
      totalMarks,
      passingMarks,
      attachments,
      status,
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!classId) missingFields.push('class');
    if (!subject) missingFields.push('subject');
    if (!dueDate) missingFields.push('dueDate');
    if (!totalMarks) missingFields.push('totalMarks');
    if (!passingMarks) missingFields.push('passingMarks');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Get teacher from user
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found',
      });
    }

    const assignmentData = {
      title,
      description,
      class: classId,
      section: section || null,
      subject,
      teacher: teacher._id,
      dueDate: new Date(dueDate),
      totalMarks: parseFloat(totalMarks),
      passingMarks: parseFloat(passingMarks),
      attachments: attachments || [],
      status: status || 'draft',
    };

    const assignment = await Assignment.create(assignmentData);

    console.log('✅ Assignment created:', assignment._id);

    res.status(201).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('❌ Create assignment error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message:
          'Invalid data format. Please check class, section, or subject IDs.',
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
      message: error.message || 'Failed to create assignment',
    });
  }
};

// ============================================
// GET ALL ASSIGNMENTS
// ============================================
export const getAssignments = async (req, res) => {
  try {
    const { classId, subjectId, status } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;

    // If teacher, only show their assignments
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user.id });
      if (teacher) {
        query.teacher = teacher._id;
      }
    }

    // If student, show only published assignments for their class
    if (req.user.role === 'student') {
      query.status = 'published';
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        query.class = student.class;
      }
    }

    const assignments = await Assignment.find(query)
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      })
      .populate('submissions.student', 'name rollNumber')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('❌ Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE ASSIGNMENT
// ============================================
export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('class', 'name code')
      .populate('section', 'name')
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      })
      .populate('submissions.student', 'name rollNumber');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('❌ Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE ASSIGNMENT
// ============================================
export const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check if teacher owns this assignment
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (teacher && assignment.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment',
      });
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('❌ Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE ASSIGNMENT
// ============================================
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check if teacher owns this assignment
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (teacher && assignment.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment',
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// SUBMIT ASSIGNMENT
// ============================================
export const submitAssignment = async (req, res) => {
  try {
    const { file } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    if (assignment.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is not available for submission',
      });
    }

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      (s) => s.student.toString() === student._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment',
      });
    }

    assignment.submissions.push({
      student: student._id,
      file,
      submittedAt: new Date(),
      status: 'submitted',
    });

    await assignment.save();

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('❌ Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GRADE ASSIGNMENT
// ============================================
export const gradeAssignment = async (req, res) => {
  try {
    const { studentId, marks, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const submission = assignment.submissions.find(
      (s) => s.student.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    submission.marks = marks;
    submission.feedback = feedback || '';
    submission.status = 'graded';

    await assignment.save();

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('❌ Grade assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT ASSIGNMENTS
// ============================================
export const getStudentAssignments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const assignments = await Assignment.find({
      class: student.class,
      status: 'published',
    })
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ dueDate: 1 });

    // Add submission status
    const assignmentsWithStatus = assignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (s) => s.student.toString() === studentId
      );
      return {
        ...assignment.toObject(),
        submission: submission || null,
      };
    });

    res.status(200).json({
      success: true,
      assignments: assignmentsWithStatus,
    });
  } catch (error) {
    console.error('❌ Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET MY ASSIGNMENTS (for logged-in student)
// ============================================
export const getMyAssignments = async (req, res) => {
  try {
    console.log('📥 Fetching assignments for logged-in student');

    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    console.log('👨‍🎓 Student found:', student._id);

    const assignments = await Assignment.find({
      class: student.class,
      status: 'published',
    })
      .populate('subject', 'name code')
      .populate({
        path: 'teacher',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ dueDate: 1 });

    console.log('📚 Assignments found:', assignments.length);

    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map((assignment) => {
      const submission = assignment.submissions.find(
        (s) => s.student.toString() === student._id.toString()
      );
      return {
        ...assignment.toObject(),
        submission: submission || null,
      };
    });

    res.status(200).json({
      success: true,
      count: assignmentsWithStatus.length,
      assignments: assignmentsWithStatus,
    });
  } catch (error) {
    console.error('❌ Get my assignments error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};