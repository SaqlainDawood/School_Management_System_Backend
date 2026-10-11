import Notice from '../models/Notice.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';

// ============================================
// CREATE NOTICE
// ============================================
export const createNotice = async (req, res) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL NOTICES
// ============================================
export const getNotices = async (req, res) => {
  try {
    const { type, priority, isPublished, audience } = req.query;

    const query = {};
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (audience) query.audience = { $in: [audience] };

    const notices = await Notice.find(query)
      .populate('createdBy', 'name')
      .populate('class', 'name code')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE NOTICE
// ============================================
export const getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('class', 'name code');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    notice.views += 1;
    await notice.save();

    res.status(200).json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE NOTICE
// ============================================
export const updateNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      notice: updatedNotice,
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE NOTICE
// ============================================
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully',
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// PUBLISH NOTICE
// ============================================
export const publishNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found',
      });
    }

    notice.isPublished = true;
    notice.publishedAt = new Date();
    await notice.save();

    res.status(200).json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error('Publish notice error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT NOTICES
// ============================================
export const getStudentNotices = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const notices = await Notice.find({
      isPublished: true,
      $or: [
        { audience: 'all' },
        { audience: 'students' },
        { class: student.class },
      ],
    })
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error('Get student notices error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET TEACHER NOTICES
// ============================================
export const getTeacherNotices = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const notices = await Notice.find({
      isPublished: true,
      $or: [
        { audience: 'all' },
        { audience: 'teachers' },
        { class: { $in: teacher.classes } },
      ],
    })
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error('Get teacher notices error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};