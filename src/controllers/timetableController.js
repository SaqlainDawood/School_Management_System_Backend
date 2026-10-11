import Timetable from '../models/Timetable.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';

// ============================================
// CREATE TIMETABLE
// ============================================
export const createTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.create(req.body);

    res.status(201).json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL TIMETABLES
// ============================================
export const getTimetables = async (req, res) => {
  try {
    const { classId, academicYear } = req.query;

    const query = {};
    if (classId) query.class = classId;
    if (academicYear) query.academicYear = academicYear;

    const timetables = await Timetable.find(query)
      .populate({ path: 'class', select: 'name code' })
      .populate({ path: 'section', select: 'name' })
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({
        path: 'periods.teacher',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ day: 1 });

    res.status(200).json({
      success: true,
      count: timetables.length,
      timetables,
    });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE TIMETABLE
// ============================================
export const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate({ path: 'class', select: 'name code' })
      .populate({ path: 'section', select: 'name' })
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({
        path: 'periods.teacher',
        populate: { path: 'user', select: 'name' },
      });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found',
      });
    }

    res.status(200).json({
      success: true,
      timetable,
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE TIMETABLE
// ============================================
export const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found',
      });
    }

    const updatedTimetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      timetable: updatedTimetable,
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE TIMETABLE
// ============================================
export const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found',
      });
    }

    await Timetable.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully',
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CLASS TIMETABLE
// ============================================
export const getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const timetables = await Timetable.find({
      class: classId,
      isActive: true,
    })
      .populate({ path: 'periods.subject', select: 'name code' })
      .populate({
        path: 'periods.teacher',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ day: 1 });

    const groupedTimetable = {};
    timetables.forEach((timetable) => {
      const day = timetable.day;
      if (!groupedTimetable[day]) {
        groupedTimetable[day] = [];
      }
      timetable.periods.forEach((period) => {
        groupedTimetable[day].push({ ...period.toObject() });
      });
    });

    res.status(200).json({
      success: true,
      timetable: groupedTimetable,
    });
  } catch (error) {
    console.error('Get class timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET TEACHER TIMETABLE
// ============================================
export const getTeacherTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const timetables = await Timetable.find({
      'periods.teacher': teacherId,
      isActive: true,
    })
      .populate('class', 'name code')
      .populate('periods.subject', 'name code')
      .sort({ day: 1 });

    const teacherTimetable = {};
    timetables.forEach((timetable) => {
      const day = timetable.day;
      if (!teacherTimetable[day]) {
        teacherTimetable[day] = [];
      }
      timetable.periods
        .filter((p) => p.teacher && p.teacher.toString() === teacherId)
        .forEach((period) => {
          teacherTimetable[day].push({
            ...period.toObject(),
            className: timetable.class.name,
            classCode: timetable.class.code,
          });
        });
    });

    res.status(200).json({
      success: true,
      timetable: teacherTimetable,
    });
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET MY TIMETABLE (for logged-in student)
// ============================================
export const getMyTimetable = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const timetables = await Timetable.find({
      class: student.class,
      isActive: true,
    })
      .populate('periods.subject', 'name code')
      .populate({
        path: 'periods.teacher',
        populate: { path: 'user', select: 'name' },
      })
      .sort({ day: 1 });

    const groupedTimetable = {};
    timetables.forEach((timetable) => {
      const day = timetable.day;
      if (!groupedTimetable[day]) {
        groupedTimetable[day] = [];
      }
      timetable.periods.forEach((period) => {
        groupedTimetable[day].push({ ...period.toObject() });
      });
    });

    res.status(200).json({
      success: true,
      timetable: groupedTimetable,
    });
  } catch (error) {
    console.error('❌ Get my timetable error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};